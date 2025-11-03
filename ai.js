export const defaultPrompt = "When the elevator is idle, it should go to floor 0, then floor 1, and repeat.\n"

const systemPrompt = new Promise((resolve, reject) => {
    fetch('elevator-saga-prompt.md').then(function(resp) {
        if (!resp.ok) throw new Error('Failed to fetch elevator-saga-prompt.md: ' + resp.status);
        return resp.text();
    }).then(function(text) {
        resolve(text);
    }).catch(function(err) {
        reject(err);
    });
})

const sanitizeResponse = (response) => {
    const functionIndex = response.indexOf('function');
    const endIndex = response.lastIndexOf('}') + 1;
    if (functionIndex !== -1 && endIndex !== -1 && endIndex > functionIndex) {
        return response.substring(functionIndex, endIndex);
    }
    return response;
}

export function sendMessage(query) {
    // Only send if there's a message
    if (!query.trim()) return;

    return systemPrompt.then(sp => 
        fetch("http://localhost:8081/api/hello?prompt=" + encodeURIComponent(`${sp}\n The player's prompt is: "${query}"`))
    )
    .then(response => response.text())
    .then(sanitizeResponse);
}