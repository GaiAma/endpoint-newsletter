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
import moment from 'moment'
import { getList, isExistingUser } from './'

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

const addUpdateSubscriber = async ({
  spark,
  lang,
  email,
  listId,
  id,
  confirmed,
}) => {
  try {
    const { results: list } = await getList({ spark, listId })

    const { user } = isExistingUser({ id, email, list })
    if (user && !confirmed) {
      return {
        user,
        code: 409,
        msg: `NOT_CONFIRMED`,
      }
    }

    if (!user && confirmed) {
      return {
        code: 409,
        msg: `NON_EXISTENT_EMAIL`,
      }
    }

    const newRecipientList = {}

    if (user && confirmed) {
      newRecipientList.recipients = confirmSubscriber(
        user.metadata.id,
        list.recipients
      )
    }

    if (!user && !confirmed) {
      newRecipientList.recipients = unionWith(
        eqBy(path([`address`, `email`])),
        list.recipients,
        [
          {
            address: {
              email: user ? user.address.email : email,
            },
            metadata: {
              lang,
              id,
              confirmed,
              date: moment.utc().format(),
            },
            return_path: `newsletter@mail.gaiama.org`,
          },
        ]
      )
    }

    await spark.recipientLists.update(listId, newRecipientList)

    return { code: 200 }
  } catch (error) {
    return { code: 500, msg: error }
  }
}

export default addUpdateSubscriber
