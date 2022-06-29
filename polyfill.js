// Console shim
(function () {
    var f = function () {};
    if (!console) {
        console = {
            log:f, info:f, warn:f, debug:f, error:f
        };
    }
}());

// Polyfill from MDN
window.sign = function(x) {
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)){
        return x;
    }
    return x > 0 ? 1 : -1;
};

if(typeof Math.sign === "undefined") {
    Math.sign = sign;
}