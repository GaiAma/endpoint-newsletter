import SparkPost, { RecipientListWithRecipients } from 'sparkpost'

type getListArgs = {
  spark: SparkPost
  listId: string
}

type result = {
  results: RecipientListWithRecipients
}

export const getList = ({ spark, listId }: getListArgs): Promise<result> =>
  spark.recipientLists.get(listId, {
    // eslint-disable-next-line @typescript-eslint/camelcase
    show_recipients: true,
  })
