const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const PORT = process.env.PORT || 3001;

const router = require('./router');
const generateMessage = require('./utils/generateMessage')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
  console.log("Client Connected...");

  socket.on("sendMessage", ({ user, message}) => {
    io.emit("message", generateMessage(user, message))
  })


  socket.on('disconnect', () => {
    console.log("User has left...")
  })

})

app.use(router);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`)
})