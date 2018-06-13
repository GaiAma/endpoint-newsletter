import { send, json } from 'micro'
import cuid from 'cuid'
// import heml from 'heml'
import mjml2html from 'mjml'
import { isEmail } from 'validator'
import urlEncodedParse from 'urlencoded-body-parser'
// import isDisposableEmail from 'is-disposable-email'
import contentType from 'content-type'
import sanitizeText from './sanitize-text'
import { sendVerification, addUpdateSubscriber } from '../api'

const baseUrl = `https://www.gaiama.org`

const getActionLink = ({ id, lang, type }) =>
  `https://gaiama-newsletter.now.sh/${type}/?id=${encodeURIComponent(
    id
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

    const listId = `${listPrefix}-${lang}`
    const id = cuid()

    const { msg, code } = await addUpdateSubscriber({
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

    return send(res, 200, { msg: `OK` })
  } catch (error) {
    return send(res, 500, {
      msg: `ERROR`,
      error,
    })
  }
}

function getTextEmail({ i18n, confirmationLink, unsubscribeLink, lang }) {
  return `
    ${i18n.t`title`}\n\n
    ${confirmationLink}\n\n
    ${i18n.t`note`}\n
    ${unsubscribeLink}\n\n\n
    ${i18n.t`privacyUrl`} | ${i18n.t`legalUrl`}
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
            <mj-text>${i18n.t`orCopy`}</mj-text>
            <mj-text>${confirmationLink}</mj-text>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-text font-size="15px">
              ${i18n.t`note`}
              <a href="${unsubscribeLink}">${i18n.t`unsubscribe`}</a>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-navbar base-url="${baseUrl}${lang}" align="left">
              <mj-navbar-link href="/">GaiAma.org</mj-navbar-link>
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
  // <mj-raw>
  //   <script type="application/ld+json">
  //     {
  //       "@context": "http://schema.org",
  //       "@type": "EmailMessage",
  //       "potentialAction": {
  //         "@type": "ConfirmAction",
  //         "name": "${i18n.t`ctaLabel`}",
  //         "handler": {
  //           "@type": "HttpActionHandler",
  //           "url": "${link}"
  //         }
  //       },
  //       "description": "${i18n.t`subject`}"
  //     }
  //   </script>
  // </mj-raw>

  if (errors.length) {
    throw new Error(JSON.stringify(errors, null, 2))
  }

  return html
  // try {
  //   const { html, errors } = await heml(`
  //   <heml>
  //     <head>
  //       <subject>${i18n.t`subject`}</subject>
  //       <style>
  //         h1 { font-size: 20px; color: gray; }
  //         h2 { margin: 30px 0; }
  //         .cta, .orCopy {margin-bottom: 30px; }
  //         .ctaButton { background-color: #287482; margin: 0; }
  //       </style>
  //       <script type="application/ld+json">
  //         {
  //           "@context": "http://schema.org",
  //           "@type": "EmailMessage",
  //           "potentialAction": {
  //             "@type": "ConfirmAction",
  //             "name": "${i18n.t`ctaLabel`}",
  //             "handler": {
  //               "@type": "HttpActionHandler",
  //               "url": "${link}"
  //             }
  //           },
  //           "description": "Approval request for John's $10.13 expense for office supplies"
  //         }
  //         </script>
  //     </head>
  //     <body>
  //       <container itemscope itemtype="http://schema.org/EmailMessage">
  //         <h1>GaiAma.org Newsletter</h1>

  //         <h2>${i18n.t`title`}</h2>

  //         <block class="cta" itemprop="potentialAction" itemscope itemtype="http://schema.org/ConfirmAction">
  //           <meta itemprop="name" content="${i18n.t`ctaLabel`}"/>
  //           <button class="ctaButton" href="${link}" itemprop="handler" itemscope itemtype="http://schema.org/HttpActionHandler">
  //             <link itemprop="url" href="${link}"/>
  //             ${i18n.t`ctaLabel`}
  //           </button>
  //         </block>

  //         <block class="orCopy">
  //           ${i18n.t`orCopy`}<br>
  //           ${link}
  //         </block>

  //         <block>
  //           ${i18n.t`note`}
  //         </block>
  //       </container>
  //       <meta itemprop="description" content="${i18n.t`subject`}"/>
  //     </body>
  //   </heml>
  // `)

  //   if (errors.length) {
  //     throw new Error(JSON.stringify(errors.join(`\n\n`)))
  //   }

  //   return html
  // } catch (error) {
  //   return error
  // }
}
