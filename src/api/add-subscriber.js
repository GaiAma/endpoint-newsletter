import { unionWith, eqBy, path } from 'ramda'
import moment from 'moment'
import cuid from 'cuid'
import { isExistingUser } from './'

const addSubscriber = async ({ spark, email, lang, listId }) => {
  try {
    const { results: list } = await spark.recipientLists.get(listId, {
      show_recipients: true,
    })

    if (isExistingUser({ email, list })) {
      return {
        code: 409,
        msg: `EXISTING_EMAIL`,
      }
    }

    const newRecipientList = {
      recipients: unionWith(eqBy(path([`address`, `email`])), list.recipients, [
        {
          address: {
            email,
          },
          metadata: {
            lang,
            id: cuid(),
            date: moment.utc().format(),
          },
          return_path: `newsletter@mail.gaiama.org`,
        },
      ]),
    }

    await spark.recipientLists.update(listId, newRecipientList)

    return { code: 200 }
  } catch (e) {
    return { code: 500 }
  }
}

export default addSubscriber
