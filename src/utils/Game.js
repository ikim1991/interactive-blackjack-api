const Player = require('./Player');
const Deck = require('./Deck');
const { users, findUser, seatUser, unseatUser, sendUserData } = require('./users');

class Game{
  constructor(){
    this.game = {
      phase: "waiting",
      dealer: {
        hand: [],
        firstCard: [],
        count: 0,
        text: "Place your Bets!"
      },
      players: {
        one: new Player(),
        two: new Player(),
        three: new Player(),
        four: new Player(),
        five: new Player()
      },
      deck: []
    }
  }

  seatPlayer(user, seatNumber){
    this.game.players[seatNumber].seatPlayer(user, seatNumber)
    seatUser(user, seatNumber)
  }

  playerExit(user, seatNumber){
    if(user.seated){
      this.game.players[seatNumber].defaultPlayer()
      unseatUser(user)
    }
  }

  shuffleCheck(){
    if(this.checkForPlauers()){
      this.deck = (new Deck()).shuffleDeck()
    }
  }

  checkForPlayers(){
    for(let [key, value] of Object.entries(this.game.players)){
      if(value.seated){
        return true
      }
    }
    return false
  }

  placeBet(bet, user){
    const u = findUser(user.username)
    if(bet <= u.chips){
      this.game.players[user.playerNumber].bet += bet
      this.game.players[user.playerNumber].user.chips -= bet
      u.chips -= bet
    }
  }

  placeLucky(bet, user){
    const u = findUser(user.username)
    if(bet <= u.chips){
      this.game.players[user.playerNumber].lucky += bet
      this.game.players[user.playerNumber].user.chips -= bet
      u.chips -= bet
    }
  }

  clearBet(user){
    const u = findUser(user.username)
    this.game.players[user.playerNumber].user.chips += this.game.players[user.playerNumber].bet
    u.chips += this.game.players[user.playerNumber].bet
    this.game.players[user.playerNumber].bet = 0
  }

  clearLucky(user){
    const u = findUser(user.username)
    this.game.players[user.playerNumber].user.chips += this.game.players[user.playerNumber].lucky
    u.chips += this.game.players[user.playerNumber].lucky
    this.game.players[user.playerNumber].lucky = 0
  }

}

module.exports = Game;
