export const isExistingUser = ({ list, id, email }) => {
  const user = list.recipients.find(
    x => x.metadata.id === id || x.address.email === email
  )

  if (!user) {
    return {}
  }

  if (user.metadata.confirmed) {
    return {
      user,
      msg: `ALREADY_CONFIRMED`,
    }
  }

  return {
    user,
    msg: `NOT_CONFIRMED`,
  }
}
