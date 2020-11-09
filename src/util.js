const Util = {
    inherits(childClass, parentClass) {
        childClass.prototype = Object.create(parentClass.prototype);
        childClass.prototype.constructor = childClass;
    },

    randomVec(length) {
        const deg = 2 * Math.PI * Math.random();
        
        return Util.scale([Math.sin(deg), Math.cos(deg)], length);
    },
    // Scale the length of a vector by the given amount.

    scale(vec, m) {
        return [Math.abs(vec[0] * m), Math.abs(vec[1] * m)];
    }
};

module.exports = Util;


// Function.prototype.inherits = function (ParentClass) { ... };


// // https://appacademy.github.io/curriculum/language_comparison/index.html



// Util.inherits(asteroid,movingobject)

// Function.prototype.inherits = function (parent, child) { 

// };