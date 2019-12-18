import { HandlerInterface } from '../types/handler'
import microCors from 'micro-cors'
import microHelmet from './micro-helmet'
import refuseBots from './refuse-bots'
import enforceHeaders from './enforce-headers'
// import ratelimit from 'micro-ratelimit'

const isDev = process.env.NODE_ENV === `development`

// TODO: find better way
/* eslint-disable @typescript-eslint/no-explicit-any */
const compose = (...fns: Array<(...a: any[]) => any>): Function =>
  fns.reduce((f, g) => (...xs: Array<(...a: any[]) => any>): Function => {
    const r = g(...xs)
    return Array.isArray(r) ? f(...r) : f(r)
  })
/* eslint-enable @typescript-eslint/no-explicit-any */

export const middlewares = isDev
  ? (handler: HandlerInterface): HandlerInterface => handler
  : (handler: HandlerInterface): HandlerInterface =>
      compose(
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
      )(handler)
