import { createConsoleLogger } from "../src/ui/console-logger.js";

describe("console logger", function () {
    it("writes info messages with timestamp and level", function () {
        spyOn(console, "log");
        const logger = createConsoleLogger();
        logger.info("hello");
        expect(console.log).toHaveBeenCalledWith(jasmine.stringMatching(/^\[\d{2}:\d{2}:\d{2}\] \[info\] hello$/));
    });

    it("writes debug messages with timestamp and level", function () {
        spyOn(console, "log");
        const logger = createConsoleLogger();
        logger.debug("trace this");
        expect(console.log).toHaveBeenCalledWith(jasmine.stringMatching(/^\[\d{2}:\d{2}:\d{2}\] \[debug\] trace this$/));
    });

    it("writes warning messages with timestamp and level", function () {
        spyOn(console, "warn");
        const logger = createConsoleLogger();
        logger.warning("watch out");
        expect(console.warn).toHaveBeenCalledWith(jasmine.stringMatching(/^\[\d{2}:\d{2}:\d{2}\] \[warning\] watch out$/));
    });

    it("writes error messages with timestamp and level", function () {
        spyOn(console, "error");
        const logger = createConsoleLogger();
        logger.error("broke");
        expect(console.error).toHaveBeenCalledWith(jasmine.stringMatching(/^\[\d{2}:\d{2}:\d{2}\] \[error\] broke$/));
    });
});
