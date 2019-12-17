import { filter } from 'ramda'
import sanitizeText from './sanitize-text'
import { getList } from './get-list.js'
import { isExistingUser } from './is-existing-user.js'
import Sparkpost from 'sparkpost'
import { i18n } from '@lingui/core'
import localeEn from './locale/en/messages'
import localeDe from './locale/de/messages'

const spark = new Sparkpost()
const listPrefix = `gaiama-newsletter`

i18n.load({ en: localeEn, de: localeDe })

const removeByEmail = email => filter(x => x.address.email !== email)

export default async (req, res) => {
  const { id: _id, lang: _lang } = req.query
  const id = sanitizeText(_id)
  const lang = sanitizeText(decodeURIComponent(_lang))

  try {
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
    return res.status(500).json({ msg: `ERROR`, error })
  }
}
