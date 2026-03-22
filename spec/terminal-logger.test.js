import { createLogger } from '../src/ui/terminal-logger.js';

describe('createLogger', function () {
    let sink;
    let logger;

    beforeEach(function () {
        sink = jasmine.createSpy('sink');
        logger = createLogger(sink);
    });

    it('exposes debug, info, warning, and error methods', function () {
        expect(typeof logger.debug).toBe('function');
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.warning).toBe('function');
        expect(typeof logger.error).toBe('function');
    });

    it('calls sink with level=debug for debug()', function () {
        logger.debug('debug message');
        expect(sink).toHaveBeenCalledWith('debug', 'debug message');
    });

    it('calls sink with level=info for info()', function () {
        logger.info('info message');
        expect(sink).toHaveBeenCalledWith('info', 'info message');
    });

    it('calls sink with level=warning for warning()', function () {
        logger.warning('warn message');
        expect(sink).toHaveBeenCalledWith('warning', 'warn message');
    });

    it('calls sink with level=error for error()', function () {
        logger.error('error message');
        expect(sink).toHaveBeenCalledWith('error', 'error message');
    });
});

describe('log (legacy API)', function () {
    it('is exported as a function', async function () {
        const mod = await import('../src/ui/terminal-logger.js');
        expect(typeof mod.log).toBe('function');
    });
});
