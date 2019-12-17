import { filter } from 'ramda'
import sanitizeText from './sanitize-text'
import { getList } from './get-list.js'
import { isExistingUser } from './is-existing-user.js'
import Sparkpost from 'sparkpost'

const spark = new Sparkpost()
const listPrefix = `gaiama-newsletter`

const removeByEmail = email => filter(x => x.address.email !== email)

export default async function unsubscribe(req, res) {
  try {
    const { id: _id, lang: _lang } = req.query
    const id = sanitizeText(_id)
    const lang = sanitizeText(decodeURIComponent(_lang))

    const listId = `${listPrefix}-${lang}`
    const { results: list } = await getList({ spark, listId })
    const { user } = isExistingUser({ list, id })

    if (!user) {
      return res.status(401).json({ msg: `UNKNOWN_ID` })
    }

    const newRecipientList = {
      recipients: removeByEmail(user.address.email)(list.recipients),
    }

    await spark.recipientLists.update(listId, newRecipientList)

    const Location = `https://www.gaiama.org/${lang}/?ref=unsubscribed`
    res.writeHead(302, { Location })
    return res.end()
  } catch (error) {
    return res.status(error.statusCode || 500).json({ msg: `ERROR`, error: error.msg })
  }
}
