const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const PORT = process.env.PORT || 3001;

const router = require('./router');
const { generateMessage, findUser, userAuth, userSession, seatUser, unseatUser, sendUserData } = require('./utils/users');
const { rooms } = require('./utils/rooms');
const Game = require('./utils/Game');
const { sleep } = require('./utils/Sleep');

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
    if(!rooms[user.server].game.checkForPlayers()){
      rooms[user.server].game.shuffleCheck()
    }
    if(!findUser(user.username).seated){
      rooms[user.server].game.seatPlayer(user, seatNumber)
      socket.emit('updateUser', sendUserData(user.username, user.server))
      io.to(user.server).emit('updateGame', rooms[user.server].game)
    } else{
      console.log(`${user.username} is already seated...`)
    }
  })

  socket.on('countdown', (count, user) => {
    if(
      (!rooms[user.server].game.game.players['one'].user.seated) &&
      (!rooms[user.server].game.game.players['two'].user.seated) &&
      (!rooms[user.server].game.game.players['three'].user.seated) &&
      (!rooms[user.server].game.game.players['four'].user.seated) &&
      (!rooms[user.server].game.game.players['five'].user.seated)
    ){
      io.to(user.server).emit('stopCountdown')
      rooms[user.server].game.resetGame()
      io.to(user.server).emit('updateGame', rooms[user.server].game)
    } else if(count === 0){
        if(
          (rooms[user.server].game.game.players['one'].bet > 0) ||
          (rooms[user.server].game.game.players['two'].bet > 0) ||
          (rooms[user.server].game.game.players['three'].bet > 0) ||
          (rooms[user.server].game.game.players['four'].bet > 0) ||
          (rooms[user.server].game.game.players['five'].bet > 0)
        ){
          rooms[user.server].game.game.dealer.text = "Dealing Cards..."
          rooms[user.server].game.dealCards()
          io.to(user.server).emit('updateGame', rooms[user.server].game)
        } else{
          rooms[user.server].game.resetTable()
          io.to(user.server).emit('updateGame', rooms[user.server].game)
        }

      sleep(1000)
      setTimeout(() => {
        for(let player of ["five", "four", "three", "two", "one"]){
          if(rooms[user.server].game.game.players[player].user.seated){
            if(rooms[user.server].game.game.players[player].bet > 0 || rooms[user.server].game.game.players[player].lucky > 0){
              rooms[user.server].game.phaseChange(player)
              io.to(user.server).emit('initiatePhase', rooms[user.server].game)
              break
            }
          } else{
            continue
          }
        }
      }, 2500)
    } else{
      rooms[user.server].game.countDown(count)
      io.to(user.server).emit('updateGame', rooms[user.server].game)
    }
  })

  socket.on('hit', (user, callback) => {
    if(rooms[user.server].game.hitCard(user) >= 21){
      rooms[user.server].game.nextPlayer(user)
    }
    io.to(user.server).emit('updateGame', rooms[user.server].game)

    if(rooms[user.server].game.checkBust()){
      setTimeout(() => {
        rooms[user.server].game.checkForWinners()
        io.to(user.server).emit('updateGame', rooms[user.server].game)
        setTimeout(() => {
          rooms[user.server].game.resetTable()
          io.to(user.server).emit('updateGame', rooms[user.server].game)
        }, 4000)
      }, 3000)
    } else{
      if(rooms[user.server].game.game.phase === "dealer"){
        rooms[user.server].game.initiateDealer()
        io.to(user.server).emit('updateGame', rooms[user.server].game)

        if(rooms[user.server].game.game.dealer.count < 17 || rooms[user.server].game.game.dealer.count > 21){
          let int = setInterval(() =>{
            if(rooms[user.server].game.game.dealer.count >= 17 && rooms[user.server].game.game.dealer.count <= 21){
              rooms[user.server].game.dealerTurn()
              io.to(user.server).emit('updateGame', rooms[user.server].game)
              clearInterval(int)
              setTimeout(() => {
                rooms[user.server].game.checkForWinners()
                io.to(user.server).emit('updateGame', rooms[user.server].game)
                setTimeout(() => {
                  rooms[user.server].game.resetTable()
                  io.to(user.server).emit('updateGame', rooms[user.server].game)
                }, 4000)
              }, 3000)
            } else if(rooms[user.server].game.game.dealer.count > 21){
              rooms[user.server].game.dealerTurn()
              io.to(user.server).emit('updateGame', rooms[user.server].game)
              clearInterval(int)
              setTimeout(() => {
                rooms[user.server].game.checkForWinners()
                io.to(user.server).emit('updateGame', rooms[user.server].game)
                setTimeout(() => {
                  rooms[user.server].game.resetTable()
                  io.to(user.server).emit('updateGame', rooms[user.server].game)
                }, 4000)
              }, 3000)
            } else{
              rooms[user.server].game.dealerTurn()
              io.to(user.server).emit('updateGame', rooms[user.server].game)
              if(rooms[user.server].game.game.dealer.count >= 17){
                rooms[user.server].game.dealerTurn()
                io.to(user.server).emit('updateGame', rooms[user.server].game)
                clearInterval(int)
              }
              setTimeout(() => {
                rooms[user.server].game.checkForWinners()
                io.to(user.server).emit('updateGame', rooms[user.server].game)
                setTimeout(() => {
                  rooms[user.server].game.resetTable()
                  io.to(user.server).emit('updateGame', rooms[user.server].game)
                }, 4000)
              }, 3000)
            }
            if(
              (rooms[user.server].game.game.dealer.count >= 17 && rooms[user.server].game.game.dealer.count <= 21) ||
              (rooms[user.server].game.game.dealer.count > 21)
            ){
              clearInterval(int)
            }
          }, 3000)
        } else{
          rooms[user.server].game.dealerTurn()
          io.to(user.server).emit('updateGame', rooms[user.server].game)
          setTimeout(() => {
            rooms[user.server].game.checkForWinners()
            io.to(user.server).emit('updateGame', rooms[user.server].game)
            setTimeout(() => {
              rooms[user.server].game.resetTable()
              io.to(user.server).emit('updateGame', rooms[user.server].game)
            }, 4000)
          }, 3000)
        }
      }
    }
    callback(rooms[user.server].game.game.players[user.playerNumber].user.turn)
  })

  socket.on('stay', (user, callback) => {
    rooms[user.server].game.nextPlayer(user)
    io.to(user.server).emit('updateGame', rooms[user.server].game)

    if(rooms[user.server].game.checkBust()){
      setTimeout(() => {
        rooms[user.server].game.checkForWinners()
        io.to(user.server).emit('updateGame', rooms[user.server].game)
        setTimeout(() => {
          rooms[user.server].game.resetTable()
          io.to(user.server).emit('updateGame', rooms[user.server].game)
        }, 4000)
      }, 3000)
    } else{
      if(rooms[user.server].game.game.phase === "dealer"){
        rooms[user.server].game.initiateDealer()
        io.to(user.server).emit('updateGame', rooms[user.server].game)

        if(rooms[user.server].game.game.dealer.count < 17 || rooms[user.server].game.game.dealer.count > 21){
          let int = setInterval(() =>{
            if(rooms[user.server].game.game.dealer.count >= 17 && rooms[user.server].game.game.dealer.count <= 21){
              rooms[user.server].game.dealerTurn()
              io.to(user.server).emit('updateGame', rooms[user.server].game)
              clearInterval(int)
              setTimeout(() => {
                rooms[user.server].game.checkForWinners()
                io.to(user.server).emit('updateGame', rooms[user.server].game)
                setTimeout(() => {
                  rooms[user.server].game.resetTable()
                  io.to(user.server).emit('updateGame', rooms[user.server].game)
                }, 4000)
              }, 3000)
            } else if(rooms[user.server].game.game.dealer.count > 21){
              rooms[user.server].game.dealerTurn()
              io.to(user.server).emit('updateGame', rooms[user.server].game)
              clearInterval(int)
              setTimeout(() => {
                rooms[user.server].game.checkForWinners()
                io.to(user.server).emit('updateGame', rooms[user.server].game)
                setTimeout(() => {
                  rooms[user.server].game.resetTable()
                  io.to(user.server).emit('updateGame', rooms[user.server].game)
                }, 4000)
              }, 3000)
            } else{
              rooms[user.server].game.dealerTurn()
              io.to(user.server).emit('updateGame', rooms[user.server].game)
              if(rooms[user.server].game.game.dealer.count >= 17){
                rooms[user.server].game.dealerTurn()
                io.to(user.server).emit('updateGame', rooms[user.server].game)
                clearInterval(int)
              }
              setTimeout(() => {
                rooms[user.server].game.checkForWinners()
                io.to(user.server).emit('updateGame', rooms[user.server].game)
                setTimeout(() => {
                  rooms[user.server].game.resetTable()
                  io.to(user.server).emit('updateGame', rooms[user.server].game)
                }, 4000)
              }, 3000)
            }
            if(
              (rooms[user.server].game.game.dealer.count >= 17 && rooms[user.server].game.game.dealer.count <= 21) ||
              (rooms[user.server].game.game.dealer.count > 21)
            ){
              clearInterval(int)
            }
          }, 3000)
        } else{
          rooms[user.server].game.dealerTurn()
          io.to(user.server).emit('updateGame', rooms[user.server].game)
          setTimeout(() => {
            rooms[user.server].game.checkForWinners()
            io.to(user.server).emit('updateGame', rooms[user.server].game)
            setTimeout(() => {
              rooms[user.server].game.resetTable()
              io.to(user.server).emit('updateGame', rooms[user.server].game)
            }, 4000)
          }, 3000)
        }
      }
    }
    callback(rooms[user.server].game.game.players[user.playerNumber].user.turn)
  })

  socket.on('double', (user, callback) => {
    rooms[user.server].game.hitCard(user)
    rooms[user.server].game.doubleDown(user)
    rooms[user.server].game.nextPlayer(user)
    io.to(user.server).emit('updateGame', rooms[user.server].game)

    if(rooms[user.server].game.checkBust()){
      setTimeout(() => {
        rooms[user.server].game.checkForWinners()
        io.to(user.server).emit('updateGame', rooms[user.server].game)
        setTimeout(() => {
          rooms[user.server].game.resetTable()
          io.to(user.server).emit('updateGame', rooms[user.server].game)
        }, 4000)
      }, 3000)
    } else{
      if(rooms[user.server].game.game.phase === "dealer"){
        rooms[user.server].game.initiateDealer()
        io.to(user.server).emit('updateGame', rooms[user.server].game)

        if(rooms[user.server].game.game.dealer.count < 17 || rooms[user.server].game.game.dealer.count > 21){
          let int = setInterval(() =>{
            if(rooms[user.server].game.game.dealer.count >= 17 && rooms[user.server].game.game.dealer.count <= 21){
              rooms[user.server].game.dealerTurn()
              io.to(user.server).emit('updateGame', rooms[user.server].game)
              clearInterval(int)
              setTimeout(() => {
                rooms[user.server].game.checkForWinners()
                io.to(user.server).emit('updateGame', rooms[user.server].game)
                setTimeout(() => {
                  rooms[user.server].game.resetTable()
                  io.to(user.server).emit('updateGame', rooms[user.server].game)
                }, 4000)
              }, 3000)
            } else if(rooms[user.server].game.game.dealer.count > 21){
              rooms[user.server].game.dealerTurn()
              io.to(user.server).emit('updateGame', rooms[user.server].game)
              clearInterval(int)
              setTimeout(() => {
                rooms[user.server].game.checkForWinners()
                io.to(user.server).emit('updateGame', rooms[user.server].game)
                setTimeout(() => {
                  rooms[user.server].game.resetTable()
                  io.to(user.server).emit('updateGame', rooms[user.server].game)
                }, 4000)
              }, 3000)
            } else{
              rooms[user.server].game.dealerTurn()
              io.to(user.server).emit('updateGame', rooms[user.server].game)
              if(rooms[user.server].game.game.dealer.count >= 17){
                rooms[user.server].game.dealerTurn()
                io.to(user.server).emit('updateGame', rooms[user.server].game)
                clearInterval(int)
              }
              setTimeout(() => {
                rooms[user.server].game.checkForWinners()
                io.to(user.server).emit('updateGame', rooms[user.server].game)
                setTimeout(() => {
                  rooms[user.server].game.resetTable()
                  io.to(user.server).emit('updateGame', rooms[user.server].game)
                }, 4000)
              }, 3000)
            }
            if(
              (rooms[user.server].game.game.dealer.count >= 17 && rooms[user.server].game.game.dealer.count <= 21) ||
              (rooms[user.server].game.game.dealer.count > 21)
            ){
              clearInterval(int)
            }
          }, 3000)
        } else{
          rooms[user.server].game.dealerTurn()
          io.to(user.server).emit('updateGame', rooms[user.server].game)
          setTimeout(() => {
            rooms[user.server].game.checkForWinners()
            io.to(user.server).emit('updateGame', rooms[user.server].game)
            setTimeout(() => {
              rooms[user.server].game.resetTable()
              io.to(user.server).emit('updateGame', rooms[user.server].game)
            }, 4000)
          }, 3000)
        }
      }
    }
    callback(rooms[user.server].game.game.players[user.playerNumber].user.turn)
  })

  socket.on('placeBet', (bet, type, user) => {
    if(rooms[user.server].game.checkForPlayers()){
      if(rooms[user.server].game.checkForBets()){
        rooms[user.server].game.phaseChange("betting")
        io.to(user.server).emit('initiatePhase', rooms[user.server].game)
      }
    }

    if(type === "bet"){
      rooms[user.server].game.placeBet(bet, user)
      socket.emit('updateUser', sendUserData(user.username, user.server))
      io.to(user.server).emit('updateGame', rooms[user.server].game)
    }

    if(type === "lucky"){
      rooms[user.server].game.placeLucky(bet, user)
      socket.emit('updateUser', sendUserData(user.username, user.server))
      io.to(user.server).emit('updateGame', rooms[user.server].game)
    }
  })

  socket.on('clearBet', (type, user) => {
    if(type === "bet"){
      rooms[user.server].game.clearBet(user)
      socket.emit('updateUser', sendUserData(user.username, user.server))
      io.to(user.server).emit('updateGame', rooms[user.server].game)
    }

    if(type === "lucky"){
      rooms[user.server].game.clearLucky(user)
      socket.emit('updateUser', sendUserData(user.username, user.server))
      io.to(user.server).emit('updateGame', rooms[user.server].game)
    }
  })

  socket.on('unseat', (user, callback) => {
    const {username, seated, server, playerNumber } = user
      rooms[server].game.playerExit(user, playerNumber)
      socket.emit('updateUser', sendUserData(username, server))
      io.to(server).emit('updateGame', rooms[server].game)
      callback(rooms[user.server].game.game.players[user.playerNumber].user.turn)
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
