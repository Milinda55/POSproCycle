import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
      react(),
    tailwindcss(),
      VitePWA({
          registerType: 'autoUpdate',
          manifest: {
              name: 'Bike Parts POS',
              short_name: 'BikePOS',
              theme_color: '#1e40af'
          }
      })
  ],
})
