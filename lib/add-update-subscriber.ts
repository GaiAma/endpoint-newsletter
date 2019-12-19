import {
  curry,
  map,
  when,
  pathEq,
  assocPath,
  unionWith,
  eqBy,
  path,
} from 'ramda'
import Sparkpost, { Recipient, UpdateRecipientList } from 'sparkpost'
import moment from 'moment'
import { getList } from './get-list'
import { isExistingUser } from './is-existing-user'

// const confirmSubscriber = ({ list }) => {
//   const objToChange = R.find(R.propEq(`key`, 22 ))(list) // To find the object you like to change.
//   objToChange.key = 40 // Change your desired field.
//   R.update(R.findIndex(R.propEq(`key`, 22))(list), objToChange,
//   patients) // And update the array with the new changed object.
// }

const confirmSubscriber = curry((id, items) =>
  map(
    when(
      pathEq([`metadata`, `id`], id),
      assocPath([`metadata`, `confirmed`], true)
    ),
    items
  )
)

type addUpdateSubscriberArgs = {
  spark: Sparkpost
  id: string
  email?: string
  lang: string
  listId: string
  confirmed: boolean
}

type result = {
  code: number
  msg: string
  user?: Recipient
}

export const addUpdateSubscriber = async ({
  spark,
  lang,
  email,
  listId,
  id,
  confirmed,
}: addUpdateSubscriberArgs): Promise<result> => {
  try {
    const { results: list } = await getList({ spark, listId })

    const { user } = isExistingUser({ id, email, list })

    if (!user && confirmed) {
      return {
        code: 409,
        msg: `NON_EXISTENT_EMAIL`,
      }
    }

    if (user && !confirmed) {
      return {
        user,
        code: 409,
        msg: `NOT_CONFIRMED`,
      }
    }

    const newRecipientList: UpdateRecipientList = { recipients: [] }

    if (user?.metadata?.id && confirmed) {
      newRecipientList.recipients = confirmSubscriber(
        user.metadata.id,
        list.recipients
      )
    }

    if (!user && !confirmed && email) {
      newRecipientList.recipients = unionWith(
        eqBy(path([`address`, `email`])),
        list.recipients,
        [
          {
            address: {
              email,
            },
            metadata: {
              lang,
              id,
              confirmed,
              date: moment.utc().format(),
            },
            // eslint-disable-next-line @typescript-eslint/camelcase
            return_path: `newsletter@mail.gaiama.org`,
          },
        ]
      )
    }

    await spark.recipientLists.update(listId, newRecipientList)

    return { code: 200, msg: `OK!` }
  } catch (error) {
    return { code: 500, msg: error }
  }
}
