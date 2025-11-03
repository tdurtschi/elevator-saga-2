import { marked } from 'marked';
// Render documentation.md into #content using marked and highlight.js
        (function() {
            function renderMarkdown(md) {
                try {
                    // Configure marked to use highlight.js for code blocks
                    marked.setOptions({
                        highlight: function(code, lang) {
                            try {
                                if (window.hljs) {
                                    if (lang && hljs.getLanguage(lang)) {
                                        return hljs.highlight(code, {language: lang}).value;
                                    }
                                    return hljs.highlightAuto(code).value;
                                }
                            } catch (e) {
                                return code;
                            }
                            return code;
                        }
                    });
                    document.getElementById('content').innerHTML = marked.parse(md);
                    if (window.hljs && hljs.highlightAll) hljs.highlightAll();
                } catch (e) {
                    document.getElementById('content').innerText = 'Error rendering documentation: ' + e.message;
                }
            }

            fetch('elevator-saga-prompt.md').then(function(resp) {
                if (!resp.ok) throw new Error('Failed to fetch documentation.md: ' + resp.status);
                return resp.text();
            }).then(function(text) {
                renderMarkdown(text);
            }).catch(function(err) {
                // Fallback: inline message with link to raw file
                var el = document.getElementById('content');
                el.innerHTML = '<p>Could not load documentation.md: ' + err.message + '</p>' +
                    '<p>If you are opening the file locally (file://), some browsers restrict fetch. Try serving the repo via a local server (e.g. `npx serve .`).</p>';
            });
        })();