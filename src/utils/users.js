const users = [
  {
    username: "admin",
    password: "admin",
    chips: 1000000000,
    authenticated: false
  }
]

const findUser = (username) => {
  return users.find(user => user.username === username)
}

const generateMessage = (username, message) => {
  return {
    username: username,
    message: message,
    createdAt: new Date().getTime()
  }
}

module.exports = {
  generateMessage,
  users,
  findUser
}
