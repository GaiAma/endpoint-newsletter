const sendVerification = async ({
  spark,
  email,
  subject,
  messagePlainText,
  messageHtml,
}) => {
  try {
    await spark.transmissions.send({
      options: {
        open_tracking: false,
        click_tracking: false,
      },
      content: {
        from: {
          name: process.env.ENDPOINT_CONTACT_NAME,
          email: process.env.ENDPOINT_SPARKPOST_EMAIL,
        },
        subject,
        text: messagePlainText,
        html: messageHtml,
      },
      recipients: [
        {
          address: {
            email: email,
          },
        },
      ],
    })

    return true
  } catch (e) {
    return e
  }
}

export default sendVerification
