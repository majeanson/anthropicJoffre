import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }) as any,
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
  build: {
    // Chunk size warning limit (increase to 1000 kB to reduce warnings)
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React vendor chunk
          'vendor-react': ['react', 'react-dom'],

          // Socket.io vendor chunk
          'vendor-socket': ['socket.io-client'],

          // Sentry vendor chunk (if used)
          'vendor-sentry': ['@sentry/react'],
        },

        // Optimize chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
      },
    },

    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
});
