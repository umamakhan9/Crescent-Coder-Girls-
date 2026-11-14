import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-data-directory',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const match = req.url.match(/^\/(?:data|Data)\/(.+)$/);
          if (match) {
            const fileName = decodeURIComponent(match[1].split('?')[0]);
            const filePath = path.resolve(__dirname, 'Data', fileName);
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'text/csv; charset=utf-8');
              res.setHeader('Access-Control-Allow-Origin', '*');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }
          next();
        });
      },
      closeBundle() {
        // Copy Data folder to dist/data on build
        const srcDir = path.resolve(__dirname, 'Data');
        const destDir = path.resolve(__dirname, 'dist', 'data');
        if (fs.existsSync(srcDir)) {
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          fs.readdirSync(srcDir).forEach((file) => {
            fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
          });
        }
      }
    }
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
