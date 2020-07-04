const express = require('express');
const router = express.Router();
const { findUser } = require('./utils/users');

router.get('/', (req, res) => {
  res.send("Server is up and running")
})

router.post('/signin', async (req, res) => {
  const user = {...findUser(req.body.username)}
  if(user && user.password === req.body.password){
    delete user.password
    return res.send({...user, server: req.body.server, authenticated: true})
  }
  return res.status(400).send({error: "Invalid Username & Password"})
})

router.post('/signup', async (req, res) => {
  const user = findUser(req.body.username)

  if(user){
    return res.status(400).send({error: "USER ALREADY EXISTS...", username: req.body.username})
  }
  return res.send({username: req.body.username})

})

module.exports = router;
