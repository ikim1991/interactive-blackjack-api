const Player = require('./Player');
const Deck = require('./Deck');
const { users, findUser } = require('./users');

class Game{
  constructor(){
    this.game = {
      phase: {
        waiting: true,
        betting: false,
        firstDeal: false,
        secondDeal: false,
        playerOne: false,
        playerTwo: false,
        playerThree: false,
        playerFour: false,
        playerFive: false,
        dealersTurn: false,
        results: false,
        distribution: false
      },
      dealer: {
        hand: [],
        firstCard: [],
        count: 0
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
    if(!findUser(user.username).seated){
      this.game.players[seatNumber].seatPlayer(user)
      findUser(user.username).seated = true
    }
  }

  playerExit(user, seatNumber){
    if(user.username === this.players[seatNumber].user.username){
      this.players = new Player()
    }
  }

}

module.exports = Game;
