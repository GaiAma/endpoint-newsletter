import {
  send,
} from 'micro'

const enforceHeaders = handler => (req, res, ...rest) => {
  if (!req.headers[`user-agent`] ||
    !req.headers[`accept`] ||
    !req.headers[`accept-language`]
  ) {
    return send(res, 403, {
      msq: `MISSING_HEADERS`,
    })
  }

  return handler(req, res, ...rest)
}

export default enforceHeaders