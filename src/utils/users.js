const generateMessage = (user, text) => {
  return {
    username: user.username,
    text: text,
    createdAt: new Date().getTime()
  }
}

module.exports = {
  generateMessage
}
