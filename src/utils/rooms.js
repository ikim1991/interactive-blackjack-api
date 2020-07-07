const Game = require('./Game');

const rooms = {
  "server-1": {
    value: "Server 1",
    users: [],
    game: new Game()
  },
  "server-2": {
    value: "Server 2",
    users: [],
    game: new Game()
  },
  "server-3": {
    value: "Server 3",
    users: [],
    game: new Game()
  },
  "server-4": {
    value: "Server 4",
    users: [],
    game: new Game()
  }
}

module.exports = {
  rooms
}
