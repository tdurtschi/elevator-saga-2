const STORAGE_KEY = 'theme';

function currentTheme() {
    return document.documentElement.getAttribute('data-theme')
        || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    window.monaco?.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
    updateToggleIcon(theme);
}

function applyTheme(theme) {
    setTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
}

function updateToggleIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fa fa-sun-o';
        btn.title = 'Switch to light mode';
    } else {
        icon.className = 'fa fa-moon-o';
        btn.title = 'Switch to dark mode';
    }
}

export function initThemeToggle() {
    updateToggleIcon(currentTheme());

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

    document.getElementById('theme-toggle')?.addEventListener('click', (e) => {
        e.preventDefault();
        applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
}
