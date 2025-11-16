import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    root: '.',
    base: './',
    server: {
        port: 5173,
        strictPort: false,
    },
    preview: {
        port: 3000,
        strictPort: true,
    },
    build: {
        outDir: 'dist',
        assetsDir: '',
        rollupOptions: {
            input: 'index.html',
        },
        emptyOutDir: true,
    },
});
