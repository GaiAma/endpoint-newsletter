import { send } from 'micro'
import { filter } from 'ramda'
import sanitizeText from './sanitize-text'
import { getList, isExistingUser } from '../api'

const removeByEmail = email => filter(x => x.address.email !== email)

export default ({ spark, listPrefix }) => async (req, res) => {
  const { id: _id, lang: _lang } = req.query
  const id = sanitizeText(_id)
  const lang = sanitizeText(decodeURIComponent(_lang))

  try {
    const listId = `${listPrefix}-${lang}`
    const { results: list } = await getList({ spark, listId })
    const { user } = isExistingUser({ list, id })

    if (!user) {
      return send(res, 401, { msg: `UNKNOWN_ID` })
    }

    const newRecipientList = {
      recipients: removeByEmail(user.address.email)(list.recipients),
    }

    await spark.recipientLists.update(listId, newRecipientList)

    const Location = `https://www.gaiama.org/${lang}/?ref=unsubscribed`
    res.writeHead(302, { Location })
    return res.end()
  } catch (error) {
    return send(res, 500, {
      msg: `ERROR`,
      error,
    })
  }
}
