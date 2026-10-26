import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf-8');

test('Developer credits appear in config, UI, HTML and manifest', () => {
  const credits = read('src/config/credits.ts');
  assert.ok(credits.includes('Yashodhar Mogaveera'));
  assert.ok(credits.includes('Sharanya Poojary'));
  assert.ok(read('index.html').includes('Yashodhar Mogaveera'));
  assert.ok(read('public/manifest.webmanifest').includes('Sharanya Poojary'));
  const app = read('src/App.tsx');
  for (const marker of ['loader-credit', 'credit-watermark', 'wc-footer-credit']) {
    assert.ok(app.includes(marker), `Missing credit placement: ${marker}`);
  }
});

test('Leaderboard UI and engine events are wired', () => {
  const app = read('src/App.tsx');
  assert.ok(app.includes('id="btn-leaderboard"'));
  assert.ok(app.includes('wizardchess:gameover'));
  const engine = read('src/wizardChessEngine.js');
  assert.ok(engine.includes("'wizardchess:gameover'"));
  assert.ok(engine.includes("'wizardchess:newgame'"));
});

test('PWA files exist and manifest is valid', () => {
  const m = JSON.parse(read('public/manifest.webmanifest'));
  assert.equal(m.display, 'standalone');
  for (const icon of m.icons) {
    assert.ok(fs.existsSync(path.join(ROOT, 'public', icon.src)), `Missing icon ${icon.src}`);
  }
  assert.ok(fs.existsSync(path.join(ROOT, 'sw.template.js')));
  assert.ok(read('index.html').includes('rel="manifest"'));
});

test('Install button lives in the top bar and hides once installed', () => {
  const app = read('src/App.tsx');
  assert.ok(app.includes('id="btn-install"'));
  assert.ok(app.includes('installEvent && !installed'));
  assert.ok(app.includes("'appinstalled'"));
});
