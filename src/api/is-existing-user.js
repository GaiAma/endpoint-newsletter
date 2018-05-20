const isExistingUser = ({ list, email }) => {
  if (list.recipients.findIndex(x => x.address.email === email) > -1) {
    return true
  }

  return false
}

export default isExistingUser
