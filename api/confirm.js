import Sparkpost from 'sparkpost'
import { i18n } from '@lingui/core'
import localeEn from '../locale/en/messages'
import localeDe from '../locale/de/messages'
import sanitizeText from '../lib/sanitize-text'
import { addUpdateSubscriber } from '../lib/add-update-subscriber.js'

const spark = new Sparkpost()
const listPrefix = `gaiama-newsletter`

i18n.load({ en: localeEn, de: localeDe })

export default async (req, res) => {
  const { id: _id, lang: _lang } = req.query
  const id = sanitizeText(_id)
  const lang = sanitizeText(decodeURIComponent(_lang))

  if (!id) {
    return { code: 500, msg: `MISSING_ID` }
  }

  if (!lang) {
    return { code: 500, msg: `MISSING_LANG` }
  }

  const listId = `${listPrefix}-${lang}`

  try {
    const { msg, code } = await addUpdateSubscriber({
      spark,
      id,
      lang,
      listId,
      confirmed: true,
    })

    if (code !== 200) {
      return res.status(code).json({ msg })
    }

    const Location = `https://www.gaiama.org/${lang}/?ref=subscribed`
    res.writeHead(302, { Location })
    return res.end()
  } catch (error) {
    return res.status(500).json(error)
  }
}
