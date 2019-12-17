export const getList = ({ spark, listId }) =>
  spark.recipientLists.get(listId, {
    show_recipients: true,
  })