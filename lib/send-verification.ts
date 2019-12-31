import Sparkpost, { InlineContent } from 'sparkpost'

interface SendVerificationArgs {
  spark: Sparkpost
  email: string
  subject: string
  messagePlainText: string
  messageHtml: string
}

export const sendVerification = async ({
  spark,
  email,
  subject,
  messagePlainText,
  messageHtml,
}: SendVerificationArgs): Promise<boolean> => {
  try {
    await spark.transmissions.send({
      options: {
        open_tracking: false,
        click_tracking: false,
        transactional: true,
      },
      content: {
        from: {
          name: process.env.ENDPOINT_CONTACT_NAME,
          email: process.env.ENDPOINT_NEWSLETTER_MAIL,
        },
        subject,
        text: messagePlainText,
        html: messageHtml,
      } as InlineContent, // TODO: is it proper way?
      recipients: [
        {
          address: {
            email,
          },
        },
      ],
    })

    return true
  } catch (error) {
    return error.msg
  }
}
