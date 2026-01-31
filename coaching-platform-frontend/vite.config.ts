import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Visualize bundle size (only in analyze mode)
    mode === 'analyze' && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ].filter(Boolean),
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', 
        changeOrigin: true,  
      },
    }
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2015',
    // Output directory
    outDir: 'dist',
    // Generate source maps for production debugging (optional - set to false for smaller builds)
    sourcemap: false,
    // Minification (using esbuild - faster than terser)
    minify: 'esbuild',
    // Chunk size warning limit (in kbs)
    chunkSizeWarningLimit: 1000,
    // Rollup options for better code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'mui-x-vendor': ['@mui/x-data-grid', '@mui/x-date-pickers'],
          'query-vendor': ['@tanstack/react-query'],
          'editor-vendor': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-image',
            '@tiptap/extension-link',
            '@tiptap/extension-table',
            '@tiptap/extension-text-align',
            '@tiptap/extension-color',
            '@tiptap/extension-highlight',
            '@tiptap/extension-underline',
            '@tiptap/extension-code-block-lowlight',
            '@tiptap/extension-text-style',
          ],
          'player-vendor': ['react-player', 'hls.js'],
          'utils-vendor': ['axios', 'date-fns', 'html-react-parser'],
        },
        // Optimize chunk file names
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) {
            return `assets/[name]-[hash][extname]`;
          }
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Increase chunk size limit
    assetsInlineLimit: 4096, // 4kb - inline smaller assets as base64
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@tanstack/react-query',
    ],
    exclude: ['@tiptap/extension-code-block-lowlight'], // Exclude heavy deps that are rarely used
  },
  // Performance optimizations
  esbuild: {
    // Drop console and debugger in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}))
