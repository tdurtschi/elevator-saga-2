const hasDom = typeof document !== 'undefined';

export const log = (message, level) => {
    if (!hasDom) {
        console.log(message);
        return;
    }
    const date = new Date();
    const timestamp = `[${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}] `;

    const div = document.createElement('div');
    div.innerHTML = timestamp + message;
    if (level === 'error') div.style.color = '#ed4848';

    const container = document.getElementById('terminal-output');
    container.appendChild(div);
    div.scrollIntoView({ block: 'nearest' });
};

export const clearLog = () => {
    if (hasDom) document.getElementById('terminal-output').textContent = '';
};

export const init = () => {
    document.querySelector('.clear-log').addEventListener('click', clearLog);
    document.querySelector('.copy-log').addEventListener('click', copyToClipboard);
};

function copyToClipboard() {
    const text = Array.from(document.querySelectorAll('#terminal-output > div'))
        .map(el => el.textContent)
        .join('\n');
    navigator.clipboard.writeText(text).catch(e => log(e));
}

if (hasDom) {
    document.addEventListener('DOMContentLoaded', init);
}
