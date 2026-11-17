import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Tailwind v4 ships an official Vite plugin, so no tailwind.config.js or postcss file is needed
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()], // tailwindcss() scans your JSX files for class names
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
});