import { NowRequest, NowResponse } from '@now/node';
import { HandlerInterface } from '../types/handler';
import { send } from 'micro';
import microCors from 'micro-cors';
import microHelmet from './micro-helmet';
import refuseBots from './refuse-bots';
import enforceHeaders from './enforce-headers';
// import ratelimit from 'micro-ratelimit'

const isDev = process.env.NODE_ENV === `development`;

const compose = (...fns: Array<Function>): Function =>
  fns.reduce((f, g) => (...xs: Array<Function>): Function => {
    const r = g(...xs);
    return Array.isArray(r) ? f(...r) : f(r);
  });

// only needed until v1 lands https://github.com/possibilities/micro-cors
const handlePreflightRequest = (handler: HandlerInterface) => (
  req: NowRequest,
  res: NowResponse
): Promise<NowResponse | void> => {
  if (req.method === `OPTIONS`) {
    return send(res, 200, `ok!`);
  }
  return handler(req, res);
};

export const middlewares = isDev
  ? (handler: HandlerInterface): HandlerInterface => handler
  : (handler: HandlerInterface): HandlerInterface =>
      compose(
        handlePreflightRequest,
        microHelmet,
        microCors({
          allowMethods: [`OPTIONS`, `GET`, `PATCH`],
          origin: !isDev ? process.env.ENDPOINT_CORS_ORIGIN : `*`,
        }),
        refuseBots,
        enforceHeaders
        // curry(ratelimit)({
        //   window: 8000,
        //   limit: 2,
        //   headers: true,
        // })
      )(handler);
