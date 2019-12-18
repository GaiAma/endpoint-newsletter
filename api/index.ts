import { NowRequest, NowResponse } from '@now/node'
import { send } from 'micro'
import cuid from 'cuid'
import mjml2html from 'mjml'
import isEmail from 'validator/lib/isEmail'
import Sparkpost from 'sparkpost'
import * as localeEn from '../locale/en/messages.json'
import * as localeDe from '../locale/de/messages.json'
import { sanitizeText } from '../lib/sanitize-text'
import { sendVerification } from '../lib/send-verification'
import { addUpdateSubscriber } from '../lib/add-update-subscriber'
import { middlewares } from '../lib/middlewares'

type messageKeys =
  | `subject`
  | `title`
  | `note`
  | `privacyUrl`
  | `legalUrl`
  | `ctaLabel`
  | `orCopy`
  | `unsubscribe`
  | `privacyTitle`
  | `legalTitle`
type messageObject = {
  [key: string]: string
}
type languageKeys = `en` | `de`
type languageObject = {
  [key: string]: messageObject
}

const languageStrings: languageObject = {
  en: localeEn,
  de: localeDe,
}

type ActionLink = {
  id: string
  lang: string
  type: string
}

const getActionLink = ({ id, lang, type }: ActionLink) =>
  `https://gaiama-newsletter.now.sh/api/${type}/?id=${encodeURIComponent(
    id
  )}&lang=${encodeURIComponent(lang)}`

export default middlewares(
  async (req: NowRequest, res: NowResponse): Promise<NowResponse | void> => {
    try {
      if (req.method === `OPTIONS`) {
        return send(res, 200, `ok!`)
      }

      const { email, lang: _lang = `en` } = req.body

      const lang: string = sanitizeText(_lang)
      if (![`de`, `en`].includes(lang)) {
        return send(res, 400, { msg: `UNSUPPORTED_LANGUAGE` })
      }
      const strings: messageObject = languageStrings[lang]

      if (!isEmail(email)) {
        return send(res, 400, { msg: `MALFORMED_EMAIL` })
      }

      const spark = new Sparkpost()
      const listPrefix = `gaiama-newsletter`

      const listId = `${listPrefix}-${lang}`
      let id: string = cuid()

      const { msg, code, user } = await addUpdateSubscriber({
        spark,
        listId,
        id,
        email,
        lang,
        confirmed: false,
      })

      if (code !== 200 && msg !== `NOT_CONFIRMED`) {
        return send(res, code, { msg })
      }

      if (user?.metadata?.id) {
        id = user.metadata.id
      }

      const confirmationLink = getActionLink({ id, lang, type: `confirm` })
      const unsubscribeLink = getActionLink({ id, lang, type: `unsubscribe` })

      const verificationResult = await sendVerification({
        spark,
        email,
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
        throw new Error(`ERROR_SENDIND_VERIFICATION`)
      }

      return send(res, 200, { msg: `OK` })
    } catch (error) {
      return send(res, error.statusCode || 500, {
        msg: `ERROR`,
        error: error.msg,
      })
    }
  }
)

interface emailArgs {
  strings: messageObject
  confirmationLink: string
  unsubscribeLink: string
  lang: string
}

function getTextEmail({
  strings,
  confirmationLink,
  unsubscribeLink,
  lang,
}: emailArgs): string {
  return `
    ${strings.title}\n\n
    ${confirmationLink}\n\n
    ${strings.note}\n
    ${unsubscribeLink}\n\n\n
    https://www.gaiama.org/${lang}/ | ${strings.privacyUrl} | ${strings.legalUrl}
  `
}

function getHtmlEmail({
  strings,
  confirmationLink,
  unsubscribeLink,
  lang,
}: emailArgs): string {
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
              <mj-navbar-link href="https://www.gaiama.org/${lang}/">GaiAma.org</mj-navbar-link>
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
