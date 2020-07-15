const users = [
  {
    username: "admin",
    password: "admin",
    chips: 1000000000,
    authenticated: false,
    playerNumber: "",
    seated: false,
    turn: false,
    sessionID: ""
  },
  {
    username: "tester",
    password: "tester",
    chips: 1000,
    authenticated: false,
    playerNumber: "",
    seated:false,
    turn: false,
    sessionID: ""
  }
]

const findUser = (username) => {
  return users.find(user => user.username === username)
}

const sendUserData = (username, server) => {
  const user = {...findUser(username), server: server}
  delete user.password
  return user
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

const userSession = (username, id = "") => {
  const user = findUser(username)
  if(user){
    user.sessionID = id
  }
}

const seatUser = (user, seatNumber) => {
  const u = findUser(user.username)
  u.seated = true
  u.playerNumber = seatNumber
}

const unseatUser = (user) => {
  const u = findUser(user.username)
  u.seated = false
  u.turn = false
  u.playerNumber = ""
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
  userSession,
  registerUser,
  seatUser,
  unseatUser,
  sendUserData
}
