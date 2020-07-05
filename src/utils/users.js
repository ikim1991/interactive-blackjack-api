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

const userAuth = (username) => {
  const user = findUser(username)
  if(user){
    if(user.authenticated){
      user.authenticated = false
      return false
    } else{
      user.authenticated = true
      return true
    }
  }
}

const registerUser = (username, password) => {
  users.push({
    username: username,
    password: password,
    chips: 1000,
    authenticated: false
  })
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
  findUser,
  userAuth,
  registerUser
}
