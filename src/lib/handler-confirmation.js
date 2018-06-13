import { send } from 'micro'
import sanitizeText from './sanitize-text'
import { addUpdateSubscriber } from '../api'

export default ({ spark, listPrefix }) => async (req, res) => {
  const { id, lang: _lang } = req.query
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
      return send(res, code, { msg })
    }

    const Location = `https://www.gaiama.org/${lang}/?ref=subscribed-to-newsletter`
    res.writeHead(302, { Location })
    return res.end()
  } catch (error) {
    return send(res, 500, error)
  }
}
