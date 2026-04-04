import { createDomLogger } from "../src/ui/dom-logger.js";

describe("DOM logger", function () {
    let container;
    let logger;

    beforeEach(function () {
        container = document.createElement("div");
        logger = createDomLogger(container);
    });

    it("info() appends a message to the container", function () {
        logger.info("hello");
        expect(container.children.length).toBe(1);
        expect(container.children[0].textContent).toContain("hello");
    });

    it("includes timestamp and level in each message", function () {
        logger.info("hello");
        const text = container.children[0].textContent;
        expect(text).toMatch(/^\[\d{2}:\d{2}:\d{2}\] \[info\] hello$/);
    });

    it("error() colors the message red", function () {
        logger.error("broke");
        expect(container.children[0].style.color).toBe("rgb(237, 72, 72)");
    });

    it("debug() appends a message to the container", function () {
        logger.debug("trace");
        expect(container.children[0].textContent).toContain("trace");
    });

    it("warning() appends a message to the container", function () {
        logger.warning("careful");
        expect(container.children[0].textContent).toContain("careful");
    });
});
