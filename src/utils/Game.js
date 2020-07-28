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
    } else if(phase === "waiting"){
      this.game.phase = phase
      this.game.dealer.text = "Place your Bets!"
    }else if(phase === "dealer"){
      this.game.phase = phase
      this.game.dealer.text = "Dealer's Turn"
    } else if(phase === "distribution"){
      this.game.phase = phase
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

    if(playerNumber === "one"){
      players[playerNumber].user.turn = false
      this.phaseChange("dealer")
    } else if(playerNumber === "five"){
      players[playerNumber].user.turn = false
      for(let player of ["four", "three", "two", "one"]){
        if(players[player].bet > 0 || players[player].lucky > 0){
          players[player].user.turn = true
          this.phaseChange(player)
          break
        }
      }
    } else if(playerNumber === "four"){
      players[playerNumber].user.turn = false
      for(let player of ["three", "two", "one"]){
        if(players[player].bet > 0 || players[player].lucky > 0){
          players[player].user.turn = true
          this.phaseChange(player)
          break
        }
      }
    } else if(playerNumber === "three"){
      players[playerNumber].user.turn = false
      for(let player of ["two", "one"]){
        if(players[player].bet > 0 || players[player].lucky > 0){
          players[player].user.turn = true
          this.phaseChange(player)
          break
        }
      }
    } else if(playerNumber === "two"){
      players[playerNumber].user.turn = false
      if(players["one"].bet > 0 || players["one"].lucky > 0){
        players["one"].user.turn = true
        this.phaseChange("one")
      }
    }

    if(!players["one"].user.turn && !players["two"].user.turn && !players["three"].user.turn && !players["four"].user.turn && !players["five"].user.turn){
      this.phaseChange("dealer")
    }

  }

  initiateDealer(){
    const { dealer, player, deck } = this.game
    dealer.hand.push(dealer.firstCard.pop())
    dealer.count = this.checkForAces(dealer.hand, this.calculateHand(dealer.hand))
    if(dealer.hand.length === 2 && dealer.count === 21){
      dealer.text = `Dealer BlackJack!`
    } else{
      dealer.text = `Dealer Shows ${dealer.count}`
    }

    this.game.phase = "dealer-hit"
  }

  dealerTurn(){
    const { dealer, player, phase, deck } = this.game
    if(dealer.count === 17){
      dealer.text = "Dealer has 17! PUSH!"
    } else if(dealer.count === 21 && dealer.hand.length === 2){
      dealer.text = "Dealer BlackJack!"
    } else if(dealer.count > 17 && dealer.count <= 21){
      dealer.text = `Dealer has ${dealer.count}`
    } else if(dealer.count < 17){
      dealer.hand.push(deck.pop())
      dealer.count = this.checkForAces(dealer.hand, this.calculateHand(dealer.hand))
      dealer.text = `Dealer has ${dealer.count}`
    } else{
      dealer.text = "Dealer Bust!"
    }
    return dealer.count
  }

  checkForAces(hand, count){
    const { players } = this.game
    let numOfAces = 0
    for(let i = 0; i < hand.length; i++){
      if(hand[i].number === 'a'){
        numOfAces++
      }
    }
    if(numOfAces > 0){
      if(count === 21 && hand.length === 2){
        return 21
      } else if(count > 21 && numOfAces === 1){
        return (count - 10)
      } else if(count > 21 && numOfAces > 1){
        if((count - ((numOfAces - 1) * 10)) <= 21){
          return (count - ((numOfAces - 1) * 10))
        } else{
          return (count - (numOfAces * 10))
        }
      } else{
        return count
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

  checkForWinners(){
    const { players, dealer } = this.game
    for(let player in players){
      if(players[player].bet > 0){
        if(players[player].hand.length === 2 && players[player].count === 21){
          if(dealer.count === 21 && dealer.hand.length === 2){
            players[player].user.chips += Math.floor((players[player].bet * 1.5) + players[player].bet)
            findUser(players[player].user.username).chips += Math.floor((players[player].bet * 1.5) + players[player].bet)
          } else{
            players[player].user.chips += Math.floor(players[player].bet * 2)
            findUser(players[player].user.username).chips += Math.floor(players[player].bet * 2)
          }
        } else if((players[player].count <= 21 && players[player].count > dealer.count) && dealer.count <= 21){
          players[player].user.chips += Math.floor(players[player].bet * 2)
          findUser(players[player].user.username).chips += Math.floor(players[player].bet * 2)
        } else if((players[player].count <= 21) && dealer.count > 21){
          players[player].user.chips += Math.floor(players[player].bet * 2)
          findUser(players[player].user.username).chips += Math.floor(players[player].bet * 2)
        } else if((players[player].count === dealer.count) && !(dealer.count === 21 && dealer.hand.length === 2)){
          players[player].user.chips += players[player].bet
          findUser(players[player].user.username).chips += players[player].bet
        } else{
          continue
        }
      } else{
        continue
      }
    }
  }

  checkBust(){
    const { players } = this.game
    for(let player in players){
      if(players[player].count <= 21 && players[player].count > 0){
        return false
      } else{
        continue
      }
    }
    return true
  }

  resetTable(){
    const { dealer, players, } = this.game
    this.phaseChange("waiting")
    dealer.hand = []
    dealer.firstCard = []
    dealer.count = 0

    for(let player in players){
      players[player].hand = []
      players[player].count = 0
      players[player].bet = 0
      players[player].lucky = 0
    }

    if(this.game.deck.length < 156){
      this.shuffleCheck()
    }
  }

  resetGame(){
    const { dealer, players, } = this.game
    this.phaseChange("waiting")
    dealer.hand = []
    dealer.firstCard = []
    dealer.count = 0

    for(let player in players){
      players[player].hand = []
      players[player].count = 0
      players[player].bet = 0
      players[player].lucky = 0
    }

    this.shuffleCheck()
  }


}

module.exports = Game;
