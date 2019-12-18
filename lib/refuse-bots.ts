import { NowRequest, NowResponse } from '@now/node'
import { send } from 'micro'
import { HandlerInterface } from '../types/handler'
import bots from './botlist'

// note https://www.npmjs.com/package/ua-parser-js
const refuseBots = (handler: HandlerInterface) => (
  req: NowRequest,
  res: NowResponse
): Promise<NowResponse | void> => {
  // from https://github.com/atomantic/is-ua-bot/blob/master/index.js
  const regex = new RegExp(
    `(${Object.keys(bots)
      .join(`|`)
      .toLowerCase()})`
  )
  // from https://github.com/jeremyscalpello/express-nobots/blob/master/lib/middleware.js
  // const regex = new RegExp(`\\b${Object.keys(bots).join(`\\b|\\b`)}\\b`)
  // const regex = new RegExp(`\b(${Object.keys(bots).join(`\b|\b`)})\b`)
  const ua = (req.headers[`user-agent`] || ``).trim().toLowerCase()

  if (!ua || regex.test(ua)) {
    return send(res, 403, { msg: `FORBIDDEN` })
  }

  return handler(req, res)
}

export default refuseBots
