import { HandlerInterface } from '../types/handler'
import microCors from 'micro-cors'
import microHelmet from './micro-helmet'
import refuseBots from './refuse-bots'
import enforceHeaders from './enforce-headers'
// import ratelimit from 'micro-ratelimit'

const isDev = process.env.NODE_ENV === `development`

const compose = (...fns: Array<Function>): Function =>
  fns.reduce((f, g) => (...xs: Array<Function>): Function => {
    const r = g(...xs)
    return Array.isArray(r) ? f(...r) : f(r)
  })

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
