export { default as addSubscriber } from './add-update-subscriber'
export { default as sendVerification } from './send-verification'
export { default as isExistingUser } from './is-existing-user'

export const getList = ({ spark, listId }) =>
  spark.recipientLists.get(listId, {
    show_recipients: true,
  })
