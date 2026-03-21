export const limitNumber = function(num, min, max) {
    return Math.min(max, Math.max(num, min));
};

export const epsilonEquals = function(a, b) {
    return Math.abs(a-b) < 0.00000001;
};

export const linearInterpolate = function(value0, value1, x) {
    return value0 + (value1 - value0) * x;
};

const powInterpolate = function(value0, value1, x, a) {
    return value0 + (value1 - value0) * Math.pow(x, a) / (Math.pow(x, a) + Math.pow(1-x, a));
};
export const coolInterpolate = function(value0, value1, x) {
    return powInterpolate(value0, value1, x, 1.3);
};


export const newGuard = function(obj, type) {
    if(!(obj instanceof type)) { throw "Incorrect instantiation, got " + typeof obj + " but expected " + type; }
}

// Fake frame requester helper used for testing and fitness simulations
export const createFrameRequester = function(timeStep) {
    var currentCb = null;
    var requester = {};
    requester.currentT = 0.0;
    requester.register = function(cb) { currentCb = cb; };
    requester.trigger = function() { requester.currentT += timeStep; if(currentCb !== null) { currentCb(requester.currentT); } };
    return requester;
};

export const getCodeObjFromCode = function(code) {
    if (code.trim().substr(0,1) == "{" && code.trim().substr(-1,1) == "}") {
        code = "(" + code + ")";
    }
    /* jslint evil:true */
    var obj = eval(code);
    /* jshint evil:false */
    if(typeof obj.init !== "function") {
        throw "Code must contain an init function";
    }
    if(typeof obj.update !== "function") {
        throw "Code must contain an update function";
    }
    return obj;
}
