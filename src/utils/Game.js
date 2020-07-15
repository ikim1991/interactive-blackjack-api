const Player = require('./Player');
const Deck = require('./Deck');
const { users, findUser, seatUser, unseatUser } = require('./users');

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

  waitingPhase(){
    this.game.phase = 'waiting'
  }
}

module.exports = Game;
