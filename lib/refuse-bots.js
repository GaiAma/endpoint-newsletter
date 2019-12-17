import bots from './botlist'

// note https://www.npmjs.com/package/ua-parser-js
const refuseBots = handler => (req, res, ...rest) => {
  // from https://github.com/atomantic/is-ua-bot/blob/master/index.js
  const regex = new RegExp(`(${Object.keys(bots).join(`|`).toLowerCase()})`)
  // from https://github.com/jeremyscalpello/express-nobots/blob/master/lib/middleware.js
  // const regex = new RegExp(`\\b${Object.keys(bots).join(`\\b|\\b`)}\\b`)
  // const regex = new RegExp(`\b(${Object.keys(bots).join(`\b|\b`)})\b`)
  const ua = (req.headers[`user-agent`] || ``).trim().toLowerCase()

  if (!ua || regex.test(ua)) {
    return res.status(403).json({ msg: `FORBIDDEN` })
  }

  return handler(req, res, ...rest)
}

export default refuseBots