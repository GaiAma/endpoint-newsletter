import { router, patch, get } from 'microrouter'
import Sparkpost from 'sparkpost'
import { i18n } from '@lingui/core'
import localeEn from './locale/en/messages'
import localeDe from './locale/de/messages'
import middlewares from './lib/middlewares'
import handlerConfirmation from './lib/handler-confirmation'
import handlerNewSubscriber from './lib/handler-new-subscriber'
import handlerUnsubscribe from './lib/handler-unsubscribe'

const spark = new Sparkpost()
const listPrefix = `gaiama-newsletter`

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
  `/confirm/`,
  handlerConfirmation({
    spark,
    listPrefix,
    i18n,
  })
)

const handleUnsubscribe = get(
  `/unsubscribe/`,
  handlerUnsubscribe({
    spark,
    listPrefix,
    i18n,
  })
)

export default middlewares(
  router(handleNewSubscription, handleConfirmation, handleUnsubscribe)
)
