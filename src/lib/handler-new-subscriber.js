import { send, json } from 'micro'
import heml from 'heml'
import { isEmail } from 'validator'
import urlEncodedParse from 'urlencoded-body-parser'
// import isDisposableEmail from 'is-disposable-email'
import contentType from 'content-type'
import sanitizeText from './sanitize-text'
import { sendVerification } from '../api'

const getConfirmationLink = ({ email, lang }) =>
  `https://gaiama-newsletter.now.sh/confirm/?email=${encodeURIComponent(
    email
  )}&lang=${encodeURIComponent(lang)}`

const parser = {
  'application/json': json,
  'application/x-www-form-urlencoded': urlEncodedParse,
}

export default ({ spark, listPrefix, i18n }) => async (req, res) => {
  const { type = `application/json` } = contentType.parse(req)

  try {
    const { email, lang: _lang = `en` } = await parser[type](req)
    const lang = sanitizeText(`${_lang}`)
    i18n.activate(lang)

    // block if disposable and no captcha filled
    // if (isDisposableEmail(email) && CAPTCHA_WRONG) {
    //   return send(res, 401, { msg: `DISPOSABLE_EMAIL` })
    // }

    if (!isEmail(email)) {
      return send(res, 400, {
        msg: `MALFORMED_EMAIL`,
      })
    }

    const confirmationLink = getConfirmationLink({ email, lang })

    const verificationResult = await sendVerification({
      spark,
      email,
      lang,
      subject: i18n.t`subject`,
      messagePlainText: getTextEmail({
        i18n,
        link: confirmationLink,
      }),
      messageHtml: await getHtmlEmail({
        i18n,
        link: confirmationLink,
      }),
    })

    if (verificationResult !== true) {
      throw new Error(verificationResult)
    }

    return send(res, 200, { msg: `OK` })
  } catch (error) {
    return send(res, 500, {
      msg: `ERROR`,
      error,
    })
  }
}

function getTextEmail({ i18n, link }) {
  return `
    ${i18n.t`title`}\n\n
    ${link}\n\n
    ${i18n.t`note`}\n\n
  `
}

async function getHtmlEmail({ i18n, link }) {
  const { html, errors } = await heml(`
    <heml>
      <head>
        <subject>${i18n.t`subject`}</subject>
        <style>
          h1 { font-size: 20px; color: gray; }
          h2 { margin: 30px 0; }
          .cta, .orCopy {margin-bottom: 30px; }
          .ctaButton { background-color: #287482; margin: 0; }
        </style>
      </head>
      <body>
        <container itemscope itemtype="http://schema.org/EmailMessage">
          <h1>GaiAma.org Newsletter</h1>

          <h2>${i18n.t`title`}</h2>

          <block class="cta" itemprop="potentialAction" itemscope itemtype="http://schema.org/ConfirmAction">
            <meta itemprop="name" content="${i18n.t`ctaLabel`}"/>
            <button class="ctaButton" href="${link}" itemprop="handler" itemscope itemtype="http://schema.org/HttpActionHandler">
              <link itemprop="url" href="${link}"/>
              ${i18n.t`ctaLabel`}
            </button>
          </block>

          <block class="orCopy">
            ${i18n.t`orCopy`}<br>
            ${link}
          </block>

          <block>
            ${i18n.t`note`}
          </block>
        </container>
        <meta itemprop="description" content="${i18n.t`subject`}"/>
      </body>
    </heml>
  `)

  if (errors.length) {
    throw new Error(JSON.stringify(errors.join(`\n\n`)))
  }

  return html
}

// const liste = require(`./subscribers.json`)
// await spark.recipientLists.delete(listId)
// const created = await spark.recipientLists.create({
//   id: listId,
//   name: `GaiAma Newsletter EN`,
//   description: ``,
//   total_accepted_recipients: 2,
//   recipients: liste
//     .filter(x => x.approved && x.language === `en`)
//     .map(x => ({
//       address: {
//         email: x.email,
//         name: x.name,
//       },
//       metadata: {
//         lang: x.language,
//         id: cuid(),
//         date: x.date,
//         isConfirmed: false,
//       },
//       return_path: `newsletter@mail.gaiama.org`,
//     })),
// })
