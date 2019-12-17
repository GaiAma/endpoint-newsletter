import {
  compose,
  // curry,
} from 'ramda'
import microCors from 'micro-cors'
// import ratelimit from 'micro-ratelimit'
import microHelmet from './micro-helmet'
import refuseBots from './refuse-bots'
import enforceHeaders from './enforce-headers'

const isProduction = process.env.NODE_ENV === `production`

export const middlewares = process.env.NODE_ENV === `development`
  ? handler => handler
  : compose(
      microHelmet,
      microCors({
        allowMethods: [`OPTIONS`, `GET`, `PATCH`],
        origin: isProduction ? process.env.ENDPOINT_CORS_ORIGIN : `*`,
      }),
      refuseBots,
      enforceHeaders,
      // curry(ratelimit)({
      //   window: 8000,
      //   limit: 2,
      //   headers: true,
      // })
    )