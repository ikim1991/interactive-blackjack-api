const express = require('express');
const router = express.Router();
const { findUser, userAuth, registerUser } = require('./utils/users');
const { rooms } = require('./utils/rooms');

router.get('/', (req, res) => {
  res.send("Server is up and running")
})

router.post('/signin', async (req, res) => {
  const user = {...findUser(req.body.username)}
  if(user && user.password === req.body.password){
    delete user.password
    rooms[req.body.server].users.push(user.username)
    return res.send({...user, server: req.body.server, authenticated: userAuth(user.username), allUsers: rooms[req.body.server].users, room: rooms[req.body.server].value})
  }
  return res.status(400).send({error: "Invalid Username & Password"})
})

router.post('/signup', async (req, res) => {
  const user = findUser(req.body.username)

  if(user){
    return res.status(400).send({error: "USER ALREADY EXISTS...", username: req.body.username})
  } else{
    registerUser(req.body.username, req.body.password)
    return res.send({username: req.body.username})
  }
})

module.exports = router;
