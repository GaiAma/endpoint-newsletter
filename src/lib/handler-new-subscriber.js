import { send, json } from 'micro'
// import heml from 'heml'
import mjml2html from 'mjml'
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
      messageHtml: getHtmlEmail({
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

function getHtmlEmail({ i18n, link }) {
  const { html, errors } = mjml2html(
    `
    <mjml>
      <mj-head>
        <mj-attributes>
          <mj-text font-size="20px" font-family="helvetica" />
        </mj-attributes>
      </mj-head>
      <mj-body>
        <mj-section full-width="full-width">
          <mj-column>
            <mj-text align="center">GaiAma.org Newsletter</mj-text>

            <mj-text>${i18n.t`title`}</mj-text>

            <mj-button font-size="16px" font-family="helvetica">${i18n.t`ctaLabel`}</mj-button>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-text>${i18n.t`orCopy`}</mj-text>
            <mj-text>${link}</mj-text>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-text font-size="17px">
              ${i18n.t`note`}
            </mj-text>
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
