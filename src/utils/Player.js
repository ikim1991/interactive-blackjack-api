const { findUser, seatUser, unseatUser } = require('./users');

class Player{
  constructor(){
    this.user = {
      username: "",
      chips: 0,
      playerNumber: "",
      seated: false,
      turn: false
    };
    this.hand = [];
    this.count = 0;
    this.bet = 0;
    this.lucky = 0;
  }

  seatPlayer(user, seatNumber) {
    this.user = {
      username: user.username,
      chips: user.chips,
      playerNumber: seatNumber,
      seated: true,
      turn: false
    }
  }

  defaultPlayer(){
    this.user = {
      username: "",
      chips: 0,
      playerNumber: "",
      seated: false,
      turn: false
    }
    this.hand = [];
    this.count = 0;
    this.bet = 0;
    this.lucky = 0;
  }

  placeBet(value) {
    this.bet += value
  }

  placeLucky(value) {
    this.lucky += value
  }
}

module.exports = Player;
