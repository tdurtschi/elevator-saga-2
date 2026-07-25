
export var requirePassengerCountWithinTime = function(passengerCount, timeLimit) {
    return {
        type: "withinTime",
        passengerCount: passengerCount,
        timeLimit: timeLimit,
        description: "Transport <span class='emphasis-color'>" + passengerCount + "</span> people in <span class='emphasis-color'>" + timeLimit.toFixed(0) + "</span> seconds or less",
        evaluate: function(simulation) {
            if(simulation.elapsedTime() >= timeLimit || simulation.transportedCount() >= passengerCount) {
                return simulation.elapsedTime() <= timeLimit && simulation.transportedCount() >= passengerCount;
            } else {
                return null;
            }
        }
    };
};

export var requirePassengerCountWithMaxWaitTime = function(passengerCount, maxWaitTime) {
    return {
        type: "maxWaitTime",
        passengerCount: passengerCount,
        maxWaitTime: maxWaitTime,
        description: "Transport <span class='emphasis-color'>" + passengerCount + "</span> people and let no one wait more than <span class='emphasis-color'>" + maxWaitTime.toFixed(1) + "</span> seconds",
        evaluate: function(simulation) {
            if(simulation.maxWaitTime() >= maxWaitTime || simulation.transportedCount() >= passengerCount) {
                return simulation.maxWaitTime() <= maxWaitTime && simulation.transportedCount() >= passengerCount;
            } else {
                return null;
            }
        }
    };
};

export var requirePassengerCountWithinTimeWithMaxWaitTime = function(passengerCount, timeLimit, maxWaitTime) {
    return {
       type: "withinTimeAndMaxWaitTime",
       passengerCount: passengerCount,
       timeLimit: timeLimit,
       maxWaitTime: maxWaitTime,
       description: "Transport <span class='emphasis-color'>" + passengerCount + "</span> people in <span class='emphasis-color'>" + timeLimit.toFixed(0) + "</span> seconds or less and let no one wait more than <span class='emphasis-color'>" + maxWaitTime.toFixed(1) + "</span> seconds",
       evaluate: function(simulation) {
            if(simulation.elapsedTime() >= timeLimit || simulation.maxWaitTime() >= maxWaitTime || simulation.transportedCount() >= passengerCount) {
                return simulation.elapsedTime() <= timeLimit && simulation.maxWaitTime() <= maxWaitTime && simulation.transportedCount() >= passengerCount;
            } else {
                return null;
            }
       }
    };
};

export var requirePassengerCountWithinMoves = function(passengerCount, moveLimit) {
    return {
        type: "withinMoves",
        passengerCount: passengerCount,
        moveLimit: moveLimit,
        description: "Transport <span class='emphasis-color'>" + passengerCount + "</span> people using <span class='emphasis-color'>" + moveLimit + "</span> elevator moves or less",
        evaluate: function(simulation) {
            if(simulation.moveCount() >= moveLimit || simulation.transportedCount() >= passengerCount) {
                return simulation.moveCount() <= moveLimit && simulation.transportedCount() >= passengerCount;
            } else {
                return null;
            }
        }
    };
};

export var requireDemo = function() {
    return {
        type: "demo",
        description: "Perpetual demo",
        evaluate: function() { return null; }
    };
};

/* jshint laxcomma:true */
export const challenges = [
     {options: {floorCount: 3, elevatorCount: 1, spawnRate: 0.3}, condition: requirePassengerCountWithinTime(15, 60)}
    ,{options: {floorCount: 5, elevatorCount: 1, spawnRate: 0.5, elevatorCapacities: [6]}, condition: requirePassengerCountWithinTime(20, 60)}
    ,{options: {floorCount: 5, elevatorCount: 1, spawnRate: 0.4}, condition: requirePassengerCountWithinTime(21, 60)}
    ,{options: {floorCount: 8, elevatorCount: 2, spawnRate: 0.6}, condition: requirePassengerCountWithinTime(28, 60)}
    ,{options: {floorCount: 6, elevatorCount: 4, spawnRate: 1.7}, condition: requirePassengerCountWithinTime(100, 68)}
    ,{options: {floorCount: 4, elevatorCount: 2, spawnRate: 0.8}, condition: requirePassengerCountWithinMoves(40, 30)}
    ,{options: {floorCount: 3, elevatorCount: 3, spawnRate: 3.0}, condition: requirePassengerCountWithinMoves(100, 63)}
    ,{options: {floorCount: 6, elevatorCount: 2, spawnRate: 0.4, elevatorCapacities: [5]}, condition: requirePassengerCountWithMaxWaitTime(50, 21)}
    ,{options: {floorCount: 7, elevatorCount: 3, spawnRate: 0.6}, condition: requirePassengerCountWithMaxWaitTime(50, 20)}

    ,{options: {floorCount: 13, elevatorCount: 2, spawnRate: 1.1, elevatorCapacities: [4,10]}, condition: requirePassengerCountWithinTime(50, 70)}

    ,{options: {floorCount: 9, elevatorCount: 5, spawnRate: 1.1}, condition: requirePassengerCountWithMaxWaitTime(60, 19)}
    ,{options: {floorCount: 9, elevatorCount: 5, spawnRate: 1.1}, condition: requirePassengerCountWithMaxWaitTime(80, 17)}
    ,{options: {floorCount: 9, elevatorCount: 5, spawnRate: 1.1, elevatorCapacities: [5]}, condition: requirePassengerCountWithMaxWaitTime(100, 15)}
    ,{options: {floorCount: 9, elevatorCount: 5, spawnRate: 1.0, elevatorCapacities: [6]}, condition: requirePassengerCountWithMaxWaitTime(110, 15)}
    ,{options: {floorCount: 8, elevatorCount: 6, spawnRate: 0.9}, condition: requirePassengerCountWithMaxWaitTime(120, 14)}

    ,{options: {floorCount: 12, elevatorCount: 4, spawnRate: 1.4, elevatorCapacities: [5,10]}, condition: requirePassengerCountWithinTime(70, 80)}
    ,{options: {floorCount: 21, elevatorCount: 5, spawnRate: 1.9, elevatorCapacities: [10]}, condition: requirePassengerCountWithinTime(110, 80)}

    ,{options: {floorCount: 21, elevatorCount: 8, spawnRate: 1.5, elevatorCapacities: [6,8]}, condition: requirePassengerCountWithinTimeWithMaxWaitTime(2675, 1800, 45)}

    ,{options: {floorCount: 21, elevatorCount: 8, spawnRate: 1.5, elevatorCapacities: [6,8]}, condition: requireDemo()}
];
/* jshint laxcomma:false */
