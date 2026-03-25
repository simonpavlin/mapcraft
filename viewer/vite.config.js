import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, watchFile } from 'fs';

const MAP_SRC = resolve(__dirname, '../data/map.json');
const MAP_DST = resolve(__dirname, 'public/map.json');

// Auto-copy map.json when it changes
function copyMapPlugin() {
  return {
    name: 'copy-map-json',
    buildStart() {
      try { copyFileSync(MAP_SRC, MAP_DST); } catch {}
    },
    configureServer() {
      watchFile(MAP_SRC, { interval: 1000 }, () => {
        try { copyFileSync(MAP_SRC, MAP_DST); } catch {}
      });
    },
  };
}

export default defineConfig({
  plugins: [copyMapPlugin()],
  server: {
    port: 3000,
    open: true,
    watch: {
      usePolling: true,
      interval: 500,
    },
  },
});
