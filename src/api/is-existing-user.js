const isExistingUser = ({ list, id, email }) => {
  const result = list.recipients.find(
    x => x.metadata.id === id || x.address.email === email
  )

  if (!result && !result.address) {
    return null
  }

  if (result.metadata.confirmed) {
    return `ALREADY_CONFIRMED`
  }

  return `NOT_CONFIRMED`
}

export default isExistingUser
