const Player = require('./Player');
const Deck = require('./Deck');
const { users, findUser, seatUser, unseatUser, sendUserData } = require('./users');
const { sleep } = require('./Sleep');

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
    this.game.deck = (new Deck()).shuffleDeck()
  }

  checkForPlayers(){
    for(let [key, value] of Object.entries(this.game.players)){
      if(value.user.seated){
        return true
      }
    }
    return false
  }

  checkForBets(){
    if(
      (this.game.players['one'].bet === 0) &&
      (this.game.players['two'].bet === 0) &&
      (this.game.players['three'].bet === 0) &&
      (this.game.players['four'].bet === 0) &&
      (this.game.players['five'].bet === 0)
    ){
      return true
    }else{
      return false
    }
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
    if(bet <= u.chips && this.game.players[user.playerNumber].bet > 0){
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

  phaseChange(phase){
    if(phase === "betting"){
      this.game.phase = phase
    } else if(phase === "dealer"){
      this.game.phase = phase
      this.game.dealer.text = "Dealer's Turn"
    } else{
      this.game.phase = phase
      this.game.players[phase].user.turn = true
      this.game.dealer.text = `Player ${phase.replace(phase[0], phase[0].toUpperCase())}s' Turn`
    }
  }

  countDown(count){
    this.game.dealer.text = count.toString()
  }

  dealCards(player){
    const { players, deck, dealer } = this.game
    for(let key of ['five', 'four', 'three', 'two', 'one']){
      if((players[key].user.seated && players[key].hand.length === 0) && (players[key].bet > 0 || players[key].lucky > 0)){
        players[key].hand.push(deck.pop())
        players[key].count = this.calculateHand(players[key].hand)
      }
    }

    if(dealer.firstCard.length === 0){
      dealer.firstCard.push(deck.pop())
    }

    for(let key of ['five', 'four', 'three', 'two', 'one']){
      if((players[key].user.seated && players[key].hand.length === 1) && (players[key].bet > 0 || players[key].lucky > 0)){
        players[key].hand.push(deck.pop())
        players[key].count = this.calculateHand(players[key].hand)
      }
    }

    if(dealer.hand.length === 0){
      dealer.hand.push(deck.pop())
      dealer.count = this.calculateHand(dealer.hand)
    }
  }

  hitCard(user){
    const { players, deck } = this.game
    const { playerNumber } = user
    players[playerNumber].hand.push(deck.pop())
    players[playerNumber].count = this.calculateHand(players[playerNumber].hand)
    players[playerNumber].count = this.checkForAces(players[playerNumber].hand, players[playerNumber].count)
    return players[playerNumber].count
  }

  doubleDown(user){
    const { username, playerNumber, chips } = user
    const { players } = this.game
    this.placeBet(players[playerNumber].bet, user)
  }

  nextPlayer(user){
    const { players, deck, dealer } = this.game
    const { playerNumber } = user
    switch(playerNumber){
      case "five":
        players[playerNumber].user.turn = false
        for(let player in ["four", "three", "two", "one"]){
          if(players["four"].bet > 0 || players["four"].lucky > 0){
            players["four"].user.turn = true
            this.phaseChange("four")
            this.game.dealer.text = "Player Fours' Turn"
            break
          }
        }

      case "four":
        players[playerNumber].user.turn = false
        for(let player in ["three", "two", "one"]){
          if(players["three"].bet > 0 || players["three"].lucky > 0){
            players["three"].user.turn = true
            this.phaseChange("three")
            this.game.dealer.text = "Player Threes' Turn"
            break
          }
        }
        case "three":
          players[playerNumber].user.turn = false
          for(let player in ["two", "one"]){
            if(players["two"].bet > 0 || players["two"].lucky > 0){
              players["two"].user.turn = true
              this.phaseChange("two")
              this.game.dealer.text = "Player Twos' Turn"
              break
            }
          }
        case "two":
          players[playerNumber].user.turn = false
          if(players["one"].bet > 0 || players["one"].lucky > 0){
            players["one"].user.turn = true
            this.phaseChange("one")
            this.game.dealer.text = "Player Ones' Turn"
            break
          }
        case "one":
          players[playerNumber].user.turn = false
          this.phaseChange("dealer")
          break;
        default:
          this.phaseChange("dealer")
    }
  }

  checkForAces(hand, count){
    const { players } = this.game
    let numOfAces = 0
    for(let i = 0; i < hand.length; i++){
      if(hand[i].number === 'a'){
        numOfAces++
      }
    }
    if(numOfAces === 1 && count === 21){
      return 21
    } else if(numOfAces > 1 && count > 21){
      if((count - ((numOfAces - 1) * 10)) <= 21){
        return (count - ((numOfAces - 1) * 10))
      } else{
        return (count - (numOfAces * 10))
      }
    } else{
      return count
    }
  }

  calculateHand(hand){
    let sum = 0
    for(let i = 0; i < hand.length; i++){
      sum += hand[i].value
    }
    return sum
  }
}

module.exports = Game;
