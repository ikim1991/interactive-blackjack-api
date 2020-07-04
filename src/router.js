const express = require('express');
const router = express.Router();
const { users } = require('./utils/database');

router.get('/', (req, res) => {
  res.send("Server is up and running")
})

router.post('/signin', async (req, res) => {
  const user = await users.find(u => req.body.username === u.username)

  if(user && user.password === req.body.password){
    const authenticated = true
    return res.send({ username: user.username, chips: user.chips, server: req.body.server, authenticated: authenticated})
  }
  return res.status(400).send({error: "Invalid Username & Password"})
})

router.post('/signup', async (req, res) => {
  const user = await users.find(u => req.body.username === u.username)

  if(user){
    return res.status(400).send({error: "USER ALREADY EXISTS...", username: req.body.username})
  }
  return res.send({username: req.body.username})

})

module.exports = router;
