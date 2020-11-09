const Dino = require("./Dino.js");
const MovingObject = require("./moving_object.js")
// const Bullet = require("./bullet.js")
// const User  = require("./User.js")
const Game = require("./game.js")
// const Dino = require("./Dino.js")
// const Util = require("./util.js")
const GameView = require("./game_view.js")



document.addEventListener("DOMContentLoaded", function () {
    console.log("Webpack is working!")

    const canvasElement = document.getElementById("game-canvas")
    const ctx = canvasElement.getContext("2d")


    window.MovingObject = MovingObject
    // window.Bullet = Bullet
    // window.User = User
    window.Game = Game
    window.Dino = Dino
    // window.Util = Util
    window.GameView = GameView


    gameview = new GameView(canvasElement, ctx)
    gameview.start()

    
    // GameView.start(canvasElement, ctx)
    // const mo = new MovingObject({
    //     pos: [30, 30],
    //     vel: [10, 10],
    //     radius: 5,
    //     color: "#00FF00"
    // });

    // mo.draw(ctx);

    // // const Dino1 = new Dino({pos:[30,30]});
    // // Dino1.draw(ctx)

});