import { send } from 'micro'
import { sanitizeText } from '../lib/sanitize-text'
import { getList } from '../lib/get-list'
import { isExistingUser } from '../lib/is-existing-user'
import Sparkpost, { Recipient } from 'sparkpost'
import { middlewares } from '../lib/middlewares'
import { NowResponse, NowRequest } from '@now/node'

type redirectToArgs = { res: NowResponse; Location: string }

const redirectTo = ({ res, Location }: redirectToArgs): void => {
  res.writeHead(302, { Location })
  return res.end()
}

const spark = new Sparkpost()
const listPrefix = `gaiama-newsletter`

const removeByEmail = (email: string, list: Recipient[]): Recipient[] =>
  list.filter(
    (r: Recipient) =>
      (typeof r.address === `string` ? r.address : r.address?.email) !== email
  )

export default middlewares(async function unsubscribe(
  req: NowRequest,
  res: NowResponse
): Promise<NowResponse | void> {
  try {
    if (req.method === `OPTIONS`) {
      return send(res, 200, `ok!`)
    }

    const _id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
    const _lang = Array.isArray(req.query.lang)
      ? req.query.lang[0]
      : req.query.lang
    const id = sanitizeText(_id)
    const lang = sanitizeText(decodeURIComponent(_lang))

    const listId = `${listPrefix}-${lang}`
    const { results: list } = await getList({ spark, listId })
    const { user } = isExistingUser({ list, id })
    const email =
      typeof user?.address === `string` ? user.address : user?.address?.email

    // TODO: redirect to gaiama.org and show proper message
    // TODO: use TypeScript https://zeit.co/docs/v2/serverless-functions/supported-languages/#node.js-typescript-support:
    if (!email) {
      return send(res, 401, { msg: `UNKNOWN_ID` })
    }

    const newRecipientList = {
      recipients: removeByEmail(email, list.recipients),
    }

    await spark.recipientLists.update(listId, newRecipientList)

    const Location = `https://www.gaiama.org/${lang}/?ref=unsubscribed`
    return redirectTo({ res, Location })
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ msg: `ERROR`, error: error.msg })
  }
})
