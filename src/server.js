const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const PORT = process.env.PORT || 3001;

const router = require('./router');
const { generateMessage, findUser, userAuth } = require('./utils/users');
const { rooms } = require('./utils/rooms');

const app = express();
const server = http.createServer(app);
const cors = require('cors');
const io = socketio(server);


io.on('connection', (socket) => {
  console.log("Client Connected...");

  socket.on('login', (userlogin) => {
    const { username, server, allUsers, game } = userlogin

    socket.join(server)

    console.log(`${username} has joined...`)
    io.to(server).emit('updateUsers', allUsers)
    socket.emit('loginState', game)
  })

  socket.on('sendMessage', ({user, message}) => {
    io.to(user.server).emit('message', generateMessage(user.username, message))
  })

  socket.on('seatPlayer', (user, seatNumber) => {
    rooms[user.server].game.seatPlayer(user, seatNumber)
    io.to(user.server).emit('updateGame', rooms[user.server].game)
  })

  socket.on('logout', (userlogout) => {
    const { username, server } = userlogout
    rooms[server].users = rooms[server].users.filter(user => user !== username)
    userAuth(username)
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
