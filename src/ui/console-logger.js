function format(level, message) {
    const d = new Date();
    const ts = `[${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}]`;
    return `${ts} [${level}] ${message}`;
}

export function createConsoleLogger() {
    return {
        debug: (message) => console.log(format("debug", message)),
        info: (message) => console.log(format("info", message)),
        warning: (message) => console.warn(format("warning", message)),
        error: (message) => console.error(format("error", message)),
    };
}
