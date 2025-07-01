import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const API_URL = process.env.VITE_API_URL || 'http://localhost:5500';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': API_URL
    }
  }
})
