const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const PORT = process.env.PORT || 3001;

const router = require('./router');
const { generateMessage, findUser, userAuth, userSession, seatUser, unseatUser, sendUserData } = require('./utils/users');
const { rooms } = require('./utils/rooms');
const Game = require('./utils/Game');

const app = express();
const server = http.createServer(app);
const cors = require('cors');
const io = socketio(server);


const game = new Game()

io.on('connection', (socket) => {
  console.log("Client Connected...");

  socket.on('login', (userlogin) => {
    const { username, server, allUsers, game } = userlogin
    const sessionID = socket.id
    userSession(username, sessionID)
    socket.join(server)
    console.log(`${username} has joined...`)
    io.to(server).emit('updateUsers', allUsers)
    socket.emit('loginState', game)
    socket.emit('updateUser', sendUserData(username, server))
  })

  socket.on('sendMessage', ({user, message}) => {
    io.to(user.server).emit('message', generateMessage(user.username, message))
  })

  socket.on('seatPlayer', (user, seatNumber) => {
    if(!findUser(user.username).seated){
      rooms[user.server].game.seatPlayer(user, seatNumber)
      socket.emit('updateUser', sendUserData(user.username, user.server))
      io.to(user.server).emit('updateGame', rooms[user.server].game)
    } else{
      console.log(`${user.username} is already seated...`)
    }
  })

  socket.on('placeBet', (bet, type, user) => {
    if(type === "bet"){
      rooms[user.server].game.placeBet(bet, user)
    }

    if(type === "lucky"){
      rooms[user.server].game.placeLucky(bet, user)
    }

    console.log(rooms[user.server].game.game.players)
    console.log(sendUserData(user.username, user.server))

  })

  socket.on('logout', (userlogout) => {
    const { username, seated, server, playerNumber } = userlogout
    rooms[server].users = rooms[server].users.filter(user => user !== username)
    userAuth(username)
    userSession(username)
    if(seated){
      rooms[server].game.playerExit(userlogout, playerNumber)
    }
    io.to(server).emit('updateGame', rooms[server].game)
    io.to(server).emit('updateUsers', rooms[server].users)
    console.log(`${username} has left...`)
  })

  socket.on('disconnect', () => {
    console.log("Client Disconnected...")
  })
})

app.use(express.json())
app.use(cors())
app.use(router);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`)
})
