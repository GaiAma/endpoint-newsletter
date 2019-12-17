import { send } from 'micro'
import cuid from 'cuid'
import mjml2html from 'mjml'
import { isEmail } from 'validator'
import Sparkpost from 'sparkpost'
import localeEn from '../locale/en/messages'
import localeDe from '../locale/de/messages'
import sanitizeText from '../lib/sanitize-text'
import { sendVerification } from '../lib/send-verification'
import { addUpdateSubscriber } from '../lib/add-update-subscriber'
import { middlewares } from '../lib/middlewares'

const languageStrings = {
  en: localeEn,
  de: localeDe,
}

const getActionLink = ({ id, lang, type }) =>
  `https://gaiama-newsletter.now.sh/${type}/?id=${encodeURIComponent(
    id
  )}&lang=${encodeURIComponent(lang)}`

export default middlewares(async (req, res) => {
  try {
    if (req.method === `OPTIONS`) {
      return send(res, 200, `ok!`)
    }

    const { email, lang: _lang = `en` } = req.body

    const lang = sanitizeText(_lang)
    if (![`de`, `en`].includes(lang)) {
      return res.status(400).json({ msg: `UNSUPPORTED_LANGUAGE` })
    }
    const strings = languageStrings[lang]

    if (!isEmail(email)) {
      return res.status(400).json({ msg: `MALFORMED_EMAIL` })
    }

    const spark = new Sparkpost()
    const listPrefix = `gaiama-newsletter`

    const listId = `${listPrefix}-${lang}`
    let id = cuid()

    const { msg, code, user } = await addUpdateSubscriber({
      spark,
      listId,
      id,
      email,
      lang,
      confirmed: false,
    })

    if (code !== 200 && msg !== `NOT_CONFIRMED`) {
      return res.status(code).json({ msg })
    }

    if (user) {
      id = user.metadata.id
    }

    const confirmationLink = getActionLink({ id, lang, type: `confirm` })
    const unsubscribeLink = getActionLink({ id, lang, type: `unsubscribe` })

    const verificationResult = await sendVerification({
      spark,
      email,
      lang,
      subject: strings.subject,
      messagePlainText: getTextEmail({
        strings,
        lang,
        confirmationLink,
        unsubscribeLink,
      }),
      messageHtml: getHtmlEmail({
        strings,
        lang,
        confirmationLink,
        unsubscribeLink,
      }),
    })

    if (verificationResult !== true) {
      throw new Error(verificationResult)
    }

    return res.status(200).json({ msg: `OK` })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ msg: `ERROR`, error: error.msg })
  }
})

function getTextEmail({ strings, confirmationLink, unsubscribeLink, lang }) {
  return `
    ${strings.title}\n\n
    ${confirmationLink}\n\n
    ${strings.note}\n
    ${unsubscribeLink}\n\n\n
    https://www.gaiama.org | ${strings.privacyUrl} | ${strings.legalUrl}
  `
}

function getHtmlEmail({ strings, confirmationLink, unsubscribeLink, lang }) {
  const { html, errors } = mjml2html(
    `
    <mjml>
      <mj-head>
        <mj-attributes>
          <mj-text
            font-size="18px"
            font-family="helvetica"
            line-height="24px"
          />
        </mj-attributes>
      </mj-head>
      <mj-body>
        <mj-section full-width="full-width">
          <mj-column>
            <mj-text>GaiAma.org Newsletter</mj-text>

            <mj-text>${strings.title}</mj-text>
          </mj-column>
        </mj-section>

        <mj-section full-width="full-width">
          <mj-column>
            <mj-button
              font-size="16px"
              font-family="helvetica"
              href="${confirmationLink}"
              align="left"
            >
              ${strings.ctaLabel}
            </mj-button>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-text font-size="13px" line-height="20px">
              ${strings.orCopy}<br/>
              ${confirmationLink}
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-text font-size="13px">
              ${strings.note}
              <a href="${unsubscribeLink}">${strings.unsubscribe}</a>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-navbar>
              <mj-navbar-link href="https://www.gaiama.org">GaiAma.org</mj-navbar-link>
              <mj-navbar-link href="${strings.privacyUrl}">${strings.privacyTitle}</mj-navbar-link>
              <mj-navbar-link href="${strings.legalUrl}">${strings.legalTitle}</mj-navbar-link>
            </mj-navbar>
          </mj-column>
        </mj-section>

      </mj-body>
    </mjml>
  `,
    { minify: true }
  )

  if (errors.length) {
    throw new Error(JSON.stringify(errors, null, 2))
  }

  return html
}
