import { filter } from 'ramda'
import { isExistingUser } from './'

const removeByEmail = email => filter(x => x.address.email !== email)

const removeSubscriber = async ({ spark, email, lang, listId }) => {
  try {
    const { results: list } = await spark.recipientLists.get(listId, {
      show_recipients: true,
    })

    if (!isExistingUser({ email, list })) {
      return {
        code: 409,
        msg: `NON_EXISTENT_EMAIL`,
      }
    }

    const newRecipientList = {
      recipients: removeByEmail(email)(list.recipients),
    }

    await spark.recipientLists.update(listId, newRecipientList)

    return { code: 200 }
  } catch (e) {
    return { code: 500 }
  }
}

export default removeSubscriber
