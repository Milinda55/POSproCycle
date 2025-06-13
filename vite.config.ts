import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";


export default defineConfig({
  plugins: [
      react(),
    tailwindcss(),
      VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          manifest: {
              name: 'My React App',
              short_name: 'ReactApp',
              description: 'My Awesome React App',
              theme_color: '#ffffff',
              icons: [
                  {
                      src: 'pwa-192x192.png',
                      sizes: '192x192',
                      type: 'image/png'
                  },
                  {
                      src: 'pwa-512x512.png',
                      sizes: '512x512',
                      type: 'image/png'
                  },
                  {
                      src: 'pwa-512x512.png',
                      sizes: '512x512',
                      type: 'image/png',
                      purpose: 'any maskable'
                  }
              ]
          },
          workbox: {
              globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
          },
          devOptions: {
              enabled: true // Enable PWA in development for testing
          }
      })
  ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
