import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'daleel-icon.svg', 'icons/*.png', 'audio/*.mp3'],

      manifest: {
        name: 'Daleel — دليل — Hajj Companion',
        short_name: 'Daleel',
        description: 'Your trusted offline-first Hajj companion. Day-by-day rituals, prayer times, du\'as, emergency contacts, and AI guidance.',
        theme_color: '#0D7377',
        background_color: '#FAFAF8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'en',
        categories: ['religion', 'travel', 'lifestyle'],
        icons: [
          { src: '/icons/icon-72.png',  sizes: '72x72',   type: 'image/png' },
          { src: '/icons/icon-96.png',  sizes: '96x96',   type: 'image/png' },
          { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        screenshots: [],
        shortcuts: [
          {
            name: 'Emergency Contacts',
            short_name: 'Emergency',
            description: 'Dial Saudi emergency numbers instantly',
            url: '/contacts',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }],
          },
          {
            name: 'Today\'s Rituals',
            short_name: 'Rituals',
            description: 'View today\'s Hajj ritual steps',
            url: '/rituals',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }],
          },
        ],
      },

      workbox: {
        // Pre-cache everything in the dist
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,mp3,json,webmanifest}'],
        // Don't let sw.js get stale
        skipWaiting: true,
        clientsClaim: true,

        runtimeCaching: [
          // Google Fonts stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts actual font files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // OpenStreetMap tiles — CacheFirst with 500 tile limit
          // Tiles visited once are available offline (great for Hajj area)
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Anthropic API — NetworkOnly (sensitive; never cache)
          {
            urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          // Everything else on same origin — NetworkFirst
          {
            urlPattern: /\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'daleel-app-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],

  // Ensure app shell route works on any path
  build: {
    rollupOptions: {
      output: {
        // Split vendor libs for better caching
        manualChunks: {
          react:   ['react', 'react-dom', 'react-router-dom'],
          adhan:   ['adhan'],
          dexie:   ['dexie'],
          i18n:    ['i18next', 'react-i18next'],
          leaflet: ['leaflet'],
        },
      },
    },
  },
})

