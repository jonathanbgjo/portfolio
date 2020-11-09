const Dino = require("./dino");

const DIM_X = 1000;
const DIM_Y = 700;
const NUM_DINOS = 10;

function Game(){
    this.dinos = []
}

Game.prototype.step = function (){

}

Game.prototype.moveObjects = function () {
    this.dinos.forEach(dino => dino.move())
}

Game.prototype.checkCollisions = function () {
    
}

Game.prototype.draw = function (ctx) {
    ctx.clearRect(0, 0, DIM_X, DIM_Y);
    this.dinos.forEach(dino => dino.draw(ctx))
}

Game.prototype.addDinos = function () {
    this.dinos.push(new Dino({pos:this.randomPosition(), game: this}))
}

Game.prototype.randomPosition = function (){

    let startPOS = [0,1,2,3]
    let dinoStart = random_item(startPOS);
    
    if (dinoStart === 0){
        return [1000,Math.floor(Math.random() * 700)];
    }
    if (dinoStart === 1){
        return [1000,Math.floor(Math.random() * 700)];
    }
    if (dinoStart === 2){
        return [Math.floor(Math.random() * 1000), 0];
    }
    if (dinoStart === 3){
        return [Math.floor(Math.random() * 1000), 700];
    }
}

Game.prototype.wrap = function(pos){
    
    if(pos[0] > 1050 || pos[0] < -50){
        if(pos[0] > 1050){
            pos = [-50, 700 - pos[1]]
        }
        if(pos[0] < -50){
            pos = [1050, 700 - pos[1]]
        }
    }
    if(pos[1] > 750 || pos[1] < -50){
        if(pos[1] > 750){
            pos = [1000 - pos[0], -50]
        }
        if(pos[1] < -50){
            pos = [1000 - pos[0], 750]
        }
    }
    return pos
}

function random_item(items){
    return items[Math.floor(Math.random()*items.length)];   
}

module.exports = Game;
//Math.floor(Math.random() * 10);     // returns a random integer from 0 to 9


// [0, 0-700], [0-1000, 0] [1000, 0-700] [ 0-1000, 700]
//   https://open.appacademy.io/learn/swe-in-person/javascript/prototypal-inheritance

// // // // // // // // //
//  __________________  //
// |                  | //
// |                  | //
// |                  | // 
// |__________________| //
// // // // // // // // // 
//the // is the potential spawn postition of the dino