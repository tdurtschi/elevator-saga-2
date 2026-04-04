function appendMessage(container, level, message, style) {
    const date = new Date();
    const timestamp = `[${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}]`;

    const div = document.createElement("div");
    div.textContent = `${timestamp} [${level}] ${message}`;
    if (style) Object.assign(div.style, style);
    container.appendChild(div);
    if (div.scrollIntoView) div.scrollIntoView({ block: "nearest" });
}

export function createDomLogger(container) {
    return {
        debug: (message) => appendMessage(container, "debug", message),
        info: (message) => appendMessage(container, "info", message),
        warning: (message) => appendMessage(container, "warning", message),
        error: (message) => appendMessage(container, "error", message, { color: "#ed4848" }),
    };
}
