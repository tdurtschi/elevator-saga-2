import $ from "jquery";
import _ from "lodash-es";

function clearAll($elems) {
    _.each($elems, function($elem) {
        $elem.empty();
    });
}

function setTransformPos(elem, x, y) {
    var style = "translate(" + x + "px," + y + "px) translateZ(0)";
    elem.style.transform = style;
    elem.style["-ms-transform"] = style;
    elem.style["-webkit-transform"] = style;
}

function updateUserState($user, elem_user, user) {
    setTransformPos(elem_user, user.worldX, user.worldY);
    if(user.done) { $user.addClass("leaving"); }
}


function presentStats($parent, world) {

    var elem_transportedcounter = $parent.find(".transportedcounter").get(0),
        elem_elapsedtime = $parent.find(".elapsedtime").get(0),
        elem_transportedpersec = $parent.find(".transportedpersec").get(0),
        elem_avgwaittime = $parent.find(".avgwaittime").get(0),
        elem_maxwaittime = $parent.find(".maxwaittime").get(0),
        elem_movecount = $parent.find(".movecount").get(0);

    world.on("stats_display_changed", function updateStats() {
        elem_transportedcounter.textContent = world.transportedCounter;
        elem_elapsedtime.textContent = world.elapsedTime.toFixed(0) + "s";
        elem_transportedpersec.textContent = world.transportedPerSec.toPrecision(3);
        elem_avgwaittime.textContent = world.avgWaitTime.toFixed(1) + "s";
        elem_maxwaittime.textContent = world.maxWaitTime.toFixed(1) + "s";
        elem_movecount.textContent = world.moveCount;
    });
    world.trigger("stats_display_changed");
}

function presentChallenge($parent, challenge, app, world, worldController, challengeNum) {
    var startButtonText = world.challengeEnded ? "<i class='fa fa-repeat'></i> Restart" : (worldController.isPaused ? "Start" : "Pause");
    var $challenge = $(`<div class="left">
            <h3>Challenge #${challengeNum}: ${challenge.condition.description}</h3>
        </div>
        <button class="right startstop unselectable" style="width: 140px">${startButtonText}</button>
        <h3 class="right">
            <i class="fa fa-minus-square timescale_decrease unselectable"></i>
            <span class="emphasis-color" style="display: inline-block; width: 22px; text-align: center">${worldController.timeScale.toFixed(0)}x</span>
            <i class="fa fa-plus-square timescale_increase unselectable"></i>
        </h3>`);
    $parent.html($challenge);

    $parent.find(".startstop").on("click", function() {
        app.startStopOrRestart();
    });
    $parent.find(".timescale_increase").on("click", function(e) {
        e.preventDefault();
        if(worldController.timeScale < 40) {
            var timeScale = Math.round(worldController.timeScale * 1.618);
            worldController.setTimeScale(timeScale);
        }
    });
    $parent.find(".timescale_decrease").on("click", function(e) {
        e.preventDefault();
        var timeScale = Math.round(worldController.timeScale / 1.618);
        worldController.setTimeScale(timeScale);
    });
}

function presentFeedback($parent, world, title, message, url) {
    $parent.html(`<div class="feedback">
        <h2 class="emphasis-color">${title}</h2>
        <p class="emphasis-color">${message}</p>
        ${url ? `<a href="${url}" class="emphasis-color">Next challenge <i class="fa fa-caret-right blink" style="text-decoration: blink"></i></a>` : ""}
    </div>`);
}

function presentWorld($world, world) {
    $world.css("height", world.floorHeight * world.floors.length);

    $world.append(_.map(world.floors, function(f) {
        var $floor = $(`<div class="floor" style="top: ${f.yPosition}px">
            <span class="floornumber">${f.level}</span>
            <span class="buttonindicator">
                <i class="fa fa-arrow-circle-up up"></i>
                <i class="fa fa-arrow-circle-down down"></i>
            </span>
        </div>`);
        var $up = $floor.find(".up");
        var $down = $floor.find(".down");
        f.on("buttonstate_change", function(buttonStates) {
            $up.toggleClass("activated", buttonStates.up !== "");
            $down.toggleClass("activated", buttonStates.down !== "");
        });
        $up.on("click", function() {
            f.pressUpButton();
        });
        $down.on("click", function() {
            f.pressDownButton();
        });
        return $floor;
    }));
    $world.find(".floor").first().find(".down").addClass("invisible");
    $world.find(".floor").last().find(".up").addClass("invisible");

    function renderElevatorButtons(states) {
        // This is a rarely executed inner-inner loop, does not need efficiency
        return _.map(states, function(b, i) {
            return `<span class="buttonpress">${i}</span>`;
        }).join("");
    };

    function setUpElevator(e) {
        var $elevator = $(`<div class="elevator movable" style="width: ${e.width}px">
            <span class="directionindicator directionindicatorup"><i class="fa fa-arrow-circle-up up activated"></i></span>
            <span class="floorindicator"><span></span></span>
            <span class="directionindicator directionindicatordown"><i class="fa fa-arrow-circle-down down activated"></i></span>
            <span class="buttonindicator"></span>
        </div>`);
        var elem_elevator = $elevator.get(0);
        $elevator.find(".buttonindicator").html(renderElevatorButtons(e.buttonStates));
        var $buttons = _.map($elevator.find(".buttonindicator").children(), function(c) { return $(c); });
        var elem_floorindicator = $elevator.find(".floorindicator > span").get(0);

        $elevator.on("click", ".buttonpress", function() {
            e.pressFloorButton(parseInt($(this).text()));
        });
        e.on("new_display_state", function updateElevatorPosition() {
            setTransformPos(elem_elevator, e.worldX, e.worldY);
        });
        e.on("new_current_floor", function update_current_floor(floor) {
            elem_floorindicator.textContent = floor;
        });
        e.on("floor_buttons_changed", function update_floor_buttons(states, indexChanged) {
            $buttons[indexChanged].toggleClass("activated", states[indexChanged]);
        });
        e.on("indicatorstate_change", function indicatorstate_change(indicatorStates) {
            $elevator.find(".up").toggleClass("activated", indicatorStates.up);
            $elevator.find(".down").toggleClass("activated", indicatorStates.down);
        });
        e.trigger("new_state", e);
        e.trigger("new_display_state", e);
        e.trigger("new_current_floor", e.currentFloor);
        return $elevator;
    }

    $world.append(_.map(world.elevators, function(e) {
        return setUpElevator(e);
    }));

    world.on("new_user", function(user) {
        var $user = $(`<i class="movable fa user fa-${user.displayType} ${user.done ? "leaving" : ""}"></i>`);
        var elem_user = $user.get(0);

        user.on("new_display_state", function() { updateUserState($user, elem_user, user); })
        user.on("removed", function() {
            $user.remove();
        });
        $world.append($user);
    });
}

function makeDemoFullscreen() {
    $("body .container > *").not(".world").css("visibility", "hidden");
    $("html, body, body .container, .world").css({width: "100%", margin: "0", "padding": 0});
}

export {
    clearAll,
    setTransformPos,
    presentStats,
    presentChallenge,
    presentFeedback,
    presentWorld,
    makeDemoFullscreen
};
