import _ from "lodash-es";

export function parseParams(path) {
    return _.reduce(path.split(","), function (result, p) {
        var match = p.match(/(\w+)=(\w+$)/);
        if (match) {
            result[match[1]] = match[2];
        }
        return result;
    }, {});
}

export function startRouter(onRoute) {
    const handle = () => onRoute(parseParams(window.location.hash));
    window.addEventListener('hashchange', handle);
    handle();
}
