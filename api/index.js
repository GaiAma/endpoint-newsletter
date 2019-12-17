import { json } from 'micro'
import cuid from 'cuid'
import mjml2html from 'mjml'
import { isEmail } from 'validator'
import Sparkpost from 'sparkpost'
import { i18n } from '@lingui/core'
import urlEncodedParse from 'urlencoded-body-parser'
import contentType from 'content-type'
import localeEn from '../locale/en/messages'
import localeDe from '../locale/de/messages'
import sanitizeText from '../lib/sanitize-text'
import { sendVerification } from '../lib/send-verification'
import { addUpdateSubscriber } from '../lib/add-update-subscriber'

const spark = new Sparkpost()
const listPrefix = `gaiama-newsletter`

i18n.load({ en: localeEn, de: localeDe })

const getActionLink = ({ id, lang, type }) =>
  `https://gaiama-newsletter.now.sh/${type}/?id=${encodeURIComponent(
    id
  )}&lang=${encodeURIComponent(lang)}`

const parser = {
  'application/json': json,
  'application/x-www-form-urlencoded': urlEncodedParse,
}

export default async (req, res) => {
  const { type = `application/json` } = contentType.parse(req)

  try {
    const { email, lang: _lang = `en` } = await parser[type](req)
    const lang = sanitizeText(_lang)
    i18n.activate(lang)

    if (!isEmail(email)) {
      return res.status(400).json({ msg: `MALFORMED_EMAIL` })
    }

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
      subject: i18n.t`subject`,
      messagePlainText: getTextEmail({
        i18n,
        lang,
        confirmationLink,
        unsubscribeLink,
      }),
      messageHtml: getHtmlEmail({
        i18n,
        lang,
        confirmationLink,
        unsubscribeLink,
      }),
    })

    if (verificationResult !== true) {
      throw new Error(verificationResult)
    }

    return res.json({ msg: `OK` })
  } catch (error) {
    return res.status(500).json({ msg: `ERROR`, error })
  }
}

function getTextEmail({ i18n, confirmationLink, unsubscribeLink, lang }) {
  return `
    ${i18n.t`title`}\n\n
    ${confirmationLink}\n\n
    ${i18n.t`note`}\n
    ${unsubscribeLink}\n\n\n
    https://www.gaiama.org | ${i18n.t`privacyUrl`} | ${i18n.t`legalUrl`}
  `
}

function getHtmlEmail({ i18n, confirmationLink, unsubscribeLink, lang }) {
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

            <mj-text>${i18n.t`title`}</mj-text>
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
              ${i18n.t`ctaLabel`}
            </mj-button>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-text font-size="13px" line-height="20px">
              ${i18n.t`orCopy`}<br/>
              ${confirmationLink}
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-text font-size="13px">
              ${i18n.t`note`}
              <a href="${unsubscribeLink}">${i18n.t`unsubscribe`}</a>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-navbar>
              <mj-navbar-link href="https://www.gaiama.org">GaiAma.org</mj-navbar-link>
              <mj-navbar-link href="${i18n.t`privacyUrl`}">${i18n.t`privacyTitle`}</mj-navbar-link>
              <mj-navbar-link href="${i18n.t`legalUrl`}">${i18n.t`legalTitle`}</mj-navbar-link>
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
