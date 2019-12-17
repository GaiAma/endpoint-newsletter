import {
  compose,
  // curry,
} from 'ramda'
import microCors from 'micro-cors'
// import ratelimit from 'micro-ratelimit'
import microHelmet from './micro-helmet'
import refuseBots from './refuse-bots'
import enforceHeaders from './enforce-headers'

const isDev = process.env.NODE_ENV === `development`

const preFlight = handler => (req, res) =>
  req.method === `OPTIONS`
    ? res.status(200).send(`ok!`)
    : handler(req, res)

export const middlewares = isDev
  ? handler => handler
  : compose(
      microHelmet,
      preFlight,
      microCors({
        allowMethods: [`OPTIONS`, `GET`, `PATCH`],
        origin: !isDev ? process.env.ENDPOINT_CORS_ORIGIN : `*`,
      }),
      refuseBots,
      enforceHeaders,
      // curry(ratelimit)({
      //   window: 8000,
      //   limit: 2,
      //   headers: true,
      // })
    )