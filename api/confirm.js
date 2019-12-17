import Sparkpost from 'sparkpost'
import sanitizeText from '../lib/sanitize-text'
import { addUpdateSubscriber } from '../lib/add-update-subscriber.js'

const spark = new Sparkpost()
const listPrefix = `gaiama-newsletter`

export default async (req, res) => {
  try {
    const { id: _id, lang: _lang } = req.query
    const id = sanitizeText(_id)

    if (!id) {
      return { code: 500, msg: `MISSING_ID` }
    }

    const lang = sanitizeText(decodeURIComponent(_lang))
    if (![`de`, `en`].includes(lang)) {
      return res.status(400).json({ msg: `UNSUPPORTED_LANGUAGE` })
    }

    const listId = `${listPrefix}-${lang}`

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
    return res.status(error.statusCode || 500).json({ msg: `ERROR`, error: error.msg })
  }
}
