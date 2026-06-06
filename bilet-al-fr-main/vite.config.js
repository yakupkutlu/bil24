import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: { port: 5173, host: '0.0.0.0' },
    preview: { port: 4173, host: '0.0.0.0' },
    build: {
        sourcemap: false,
        chunkSizeWarningLimit: 900,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-query': ['@tanstack/react-query', 'axios', 'zustand'],
                    'vendor-motion': ['framer-motion'],
                    'vendor-charts': ['recharts'],
                    'vendor-icons': ['lucide-react']
                }
            }
        }
    }
});
