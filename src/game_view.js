const Game = require("./game");

function GameView(canvas, ctx) {
    // let game = new Game()
    this.game = new Game()
    this.ctx = ctx
    this.canvas = canvas
    // this.ship = new Ship()
}

GameView.prototype.start = function () {
    this.game.addDinos(this.ctx);
    this.game.addDinos(this.ctx);
    this.game.addDinos(this.ctx);
    this.game.addDinos(this.ctx);
    let that = this
    let interval = 20;
    setInterval(() => {
        that.game.moveObjects();
        that.game.draw(that.ctx);
    }, interval);
    setInterval(() => {
        this.game.addDinos(this.ctx);
        this.game.addDinos(this.ctx);
    }, 5000);
}



module.exports = GameView

//Stores a Game instance.
// Stores a canvas context to draw the game into.
// Installs key listeners to move the ship and fire bullets.
// Installs a timer to call Game.prototype.step.