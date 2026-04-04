export const clearLog = () => {
    document.getElementById('terminal-output').textContent = '';
};

function copyToClipboard(logger) {
    const text = Array.from(document.querySelectorAll('#terminal-output > div'))
        .map(el => el.textContent)
        .join('\n');
    navigator.clipboard.writeText(text).catch(e => logger.error(e));
}

export const init = (logger) => {
    document.querySelector('.clear-log').addEventListener('click', clearLog);
    document.querySelector('.copy-log').addEventListener('click', () => copyToClipboard(logger));
};
