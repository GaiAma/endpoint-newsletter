import { send } from 'micro'
import { addSubscriber } from '../api'

export default ({ spark, listPrefix }) => async (req, res) => {
  const { email: _email, lang: _lang } = req.query
  const email = decodeURIComponent(_email).trim()
  const lang = decodeURIComponent(_lang).trim()

  if (!email) {
    return { code: 500, msg: `MISSING_EMAIL` }
  }

  if (!lang) {
    return { code: 500, msg: `MISSING_LANG` }
  }

  const listId = `${listPrefix}-${lang}`

  try {
    const { msg, code } = await addSubscriber({
      spark,
      email,
      lang,
      listId,
    })

    if (code !== 200) {
      return send(res, code, { msg })
    }

    // return send(res, 200, {
    //   msg: `OK`,
    //   updated: await spark.recipientLists.get(listId, {
    //     show_recipients: true,
    //   }),
    // })

    const Location = `https://www.gaiama.org/${lang}/?ref=subscribed-to-newsletter`
    res.writeHead(302, { Location })
    return res.end()
  } catch (error) {
    return send(res, 500, error)
  }
}
