import $ from "jquery";

export const log = (message, level) => {
    const newDiv = $("<div>").html(message);
    if(level === 'error') newDiv.get(0).style = "color: #ed4848;";
    let $logContainer = $("#loading_message");
    $logContainer.append(newDiv);
    newDiv.get(0).scrollIntoView({container: "nearest"});
}

export const clearLog = () => $("#loading_message").text("");