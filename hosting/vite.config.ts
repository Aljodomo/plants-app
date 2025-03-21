import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from "vite-plugin-vuetify";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['flower.svg'],
      manifest: {
        name: 'Blattgrün',
        short_name: 'Blattgrün',
        description: 'Behalte einen grünen Daumen',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'flower.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
        ]
      } })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@generated': fileURLToPath(new URL('./generated', import.meta.url))
    }
  }
})
