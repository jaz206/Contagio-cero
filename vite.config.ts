import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno según el modo (development/production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    server: {
      port: 3000
    },
    define: {
      // Esto sustituye process.env.API_KEY por el valor real de VITE_API_KEY durante el build
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || process.env.VITE_API_KEY)
    }
  };
});