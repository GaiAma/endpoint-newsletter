import { router, patch, get } from 'microrouter'
import Sparkpost from 'sparkpost'
import { i18n } from '@lingui/core'
import localeEn from './locale/en/messages'
import localeDe from './locale/de/messages'
import middlewares from './lib/middlewares'
import handlerConfirmation from './lib/handler-confirmation'
import handlerNewSubscriber from './lib/handler-new-subscriber'
// import handlerUnsubscribe from './lib/handler-unsubscribe'

// import moment from 'moment'
// import cuid from 'cuid'
// import { addSubscriber } from './api'

const spark = new Sparkpost()
const listPrefix = `gaiama-newsletter`

// const cleanup = async () => {
//   try {
//     const lang = `de`
//     const listId = `gaiama-newsletter-${lang}`
//     // await addSubscriber({
//     //   spark,
//     //   email: `etilerhf@gmail.com`,
//     //   lang: `de`,
//     //   listId,
//     // })
//     const { results } = await spark.recipientLists.get(listId, {
//       show_recipients: true,
//     })
//     return console.log(results.recipients)
//     // await spark.recipientLists.delete(listId)
//     const created = await spark.recipientLists.create({
//       id: listId,
//       name: listId,
//       recipients: [
//         {
//           address: {
//             email: `cansrau+${listId}@gmail.com`,
//           },
//           metadata: {
//             lang,
//             id: cuid(),
//             date: moment.utc().format(),
//           },
//           return_path: `newsletter@mail.gaiama.org`,
//         },
//       ],
//     })
//     console.log(created)
//   } catch (error) {
//     return console.error(error)
//   }
// }
// cleanup()

i18n.load({ en: localeEn, de: localeDe })

const handleNewSubscription = patch(
  `/`,
  handlerNewSubscriber({
    spark,
    listPrefix,
    i18n,
  })
)

const handleConfirmation = get(
  `/confirm`,
  handlerConfirmation({
    spark,
    listPrefix,
    i18n,
  })
)

// const handleUnsubscribe = get(
//   `/confirm`,
//   handlerUnsubscribe({
//     spark,
//     listPrefix,
//     i18n,
//   })
// )

export default middlewares(
  router(handleNewSubscription, handleConfirmation /*handleUnsubscribe*/)
)
