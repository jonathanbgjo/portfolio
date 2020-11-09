// const Game = require("./game.js")

function MovingObject(param) {
    this.pos = param.pos
    this.vel = param["vel"]
    this.radius = param["radius"]
    this.color = param["color"]
    this.game = param["game"]
    this.word = param["word"]
}

MovingObject.prototype.move = function () {
    this.pos = this.game.wrap(this.pos);
    this.pos[0] = this.pos[0] + this.vel[0];
    // this.pos[1] = this.pos[1] + this.vel[1];
}

MovingObject.prototype.draw = function (ctx) {

    ctx.beginPath();

    // ctx.arc(this.pos[0], this.pos[1], this.radius, 0, 2 * Math.PI);
    ctx.rect(this.pos[0], this.pos[1], this.radius*2, this.radius*2)
    // ctx.arc(this.pos[0], this.pos[1], this.radius, 0, (2 * Math.PI) * this.radius)

    ctx.lineWidth = 1;
    // ctx.fillStyle = this.color;
    // ctx.strokeStyle = "black";
    // ctx.fillText(this.word
    ctx.fillText(this.word, this.pos[0], this.pos[1])
    ctx.stroke();
    // ctx.fill();

    //creating a circle with path
    // var ctx = c.getContext("2d");
    // debugger
    // ctx.beginPath(); // necessary to begin drawing this path
    // canvas.arc(this.pos[0], this.pos[1], this.radius, 0, (2 * Math.PI) * this.radius)

    // (circleCenterX, circleCenterY, radius, startAngle, endAngle, counterclockwise(optional))
    // ctx.strokeStyle = "red"; // optionally sets color of path
    //     ctx.stroke(); // draws path (default color is black)
    //     ctx.closePath(); // optional when drawing a circle
    //     ctx.fillStyle = this.color; // sets color to be filled inside of the path
    //     ctx.fill(); // fills the interior of the circle (does not work without fillStyle being set)
}

MovingObject.prototype.isCollidedWith = function (otherMovingObject) {

}

module.exports = MovingObject;