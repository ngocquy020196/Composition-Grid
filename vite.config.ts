import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { copyFileSync, existsSync } from 'fs';

// Post-build plugin: copies content.css from source to dist
function copyContentCss(): PluginOption {
    return {
        name: 'copy-content-css',
        closeBundle() {
            const src = resolve(__dirname, 'src/content/content.css');
            const dest = resolve(__dirname, 'dist/content.css');
            if (existsSync(src)) {
                copyFileSync(src, dest);
            }
        },
    };
}

export default defineConfig(({ mode }) => {
    const buildTarget = process.env.BUILD_TARGET;

    // Background service worker build
    if (buildTarget === 'background') {
        return {
            build: {
                outDir: 'dist',
                emptyOutDir: false,
                target: 'chrome100',
                lib: {
                    entry: resolve(__dirname, 'src/background/index.ts'),
                    name: 'Background',
                    formats: ['iife'],
                    fileName: () => 'background.js',
                },
            },
        };
    }

    // Content script build
    if (buildTarget === 'content') {
        return {
            plugins: [copyContentCss()],
            build: {
                outDir: 'dist',
                emptyOutDir: false,
                target: 'chrome100',
                cssCodeSplit: false,
                lib: {
                    entry: resolve(__dirname, 'src/content/index.ts'),
                    name: 'CompositionGrid',
                    formats: ['iife'],
                    fileName: () => 'content.js',
                },
                rollupOptions: {
                    output: {
                        globals: {},
                    },
                },
            },
        };
    }

    // Default: popup build
    return {
        plugins: [react(), tailwindcss()],
        base: './', // Relative paths for Chrome Extension
        build: {
            outDir: 'dist',
            emptyOutDir: true,
            rollupOptions: {
                input: {
                    popup: resolve(__dirname, 'popup.html'),
                    options: resolve(__dirname, 'options.html'),
                },
                output: {
                    entryFileNames: '[name].js',
                    chunkFileNames: '[name].js',
                    assetFileNames: 'assets/[name][extname]',
                },
            },
        },
    };
});
