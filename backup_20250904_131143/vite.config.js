// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 5173,
    
    // Proxy configuration สำหรับแก้ปัญหา CORS
    proxy: {
      // Proxy API requests ไป MyKids API server
      '/api': {
        target: 'https://apps4.coop.ku.ac.th',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          // แปลง /api/* เป็น /mykids/api/*
          const newPath = path.replace(/^\/api/, '/mykids/api');
          console.log(`[PROXY] ${path} -> ${newPath}`);
          return newPath;
        },
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[PROXY] ${req.method} ${req.url} -> ${options.target}${proxyReq.path}`);
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`[PROXY] Response: ${proxyRes.statusCode} for ${req.url}`);
          });
          
          proxy.on('error', (err, req, res) => {
            console.error(`[PROXY] Error: ${err.message} for ${req.url}`);
          });
        }
      }
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  
  // Define environment variables
  define: {
    __API_URL__: JSON.stringify(
      process.env.NODE_ENV === 'production' 
        ? 'https://apps4.coop.ku.ac.th/mykids/api' 
        : '/api'  // ใช้ proxy ใน development
    )
  }
})