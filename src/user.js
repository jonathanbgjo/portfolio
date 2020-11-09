const MovingObject = require("./moving_object.js")
const Util = require("./util.js")


function User() {

}


// User.prototype = Object.create(MovingObject.prototype);
// User.prototype.constructor = User
Util.inherits(User, MovingObject)


module.exports = User;