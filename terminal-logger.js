import $ from "jquery";

export const log = (message, level) => {
    var date = new Date();
    var timestamp = `[${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}] `;

    const newDiv = $("<div>").html(timestamp + message);
    if(level === 'error') newDiv.get(0).style = "color: #ed4848;";

    let $logContainer = $("#terminal-output");
    $logContainer.append(newDiv);

    newDiv.get(0).scrollIntoView({container: "nearest"});
}

export const clearLog = () => $("#terminal-output").text("");

export const init = () => {
    console.log("hi! 2")
    $(".clear-log").click(() => clearLog());
    $(".copy-log").click(copyToClipboard);
}
function copyToClipboard() {
    var text = $("#terminal-output > div").map(function() { return $(this).text(); }).get().join( "\n");
    navigator.clipboard.writeText(text).then((result) => log(result))
        .catch(e => log(e))
}

$(init);