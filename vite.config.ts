import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Generates dist/sw.js with a precache list of every built file (PWA offline support).
function pwaServiceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'wizard-chess-pwa-sw',
    apply: 'build',
    configResolved(cfg) {
      outDir = path.resolve(cfg.root, cfg.build.outDir);
    },
    closeBundle() {
      const walk = (dir: string): string[] =>
        fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
          const full = path.join(dir, e.name);
          return e.isDirectory() ? walk(full) : [full];
        });
      const files = walk(outDir)
        .map((f) => path.relative(outDir, f).split(path.sep).join('/'))
        .filter((f) => f !== 'sw.js' && !f.endsWith('.map'));
      const list = ['./', ...files.map((f) => `./${f}`)];
      const tpl = fs.readFileSync(path.resolve('sw.template.js'), 'utf-8');
      const out = tpl
        .replace('__PRECACHE_LIST__', JSON.stringify(list, null, 2))
        .replace('__BUILD_VERSION__', String(Date.now()));
      fs.writeFileSync(path.join(outDir, 'sw.js'), out);
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), pwaServiceWorker()],
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
  };
});
