import assert from 'node:assert/strict';
import katex from 'katex';

const rgb = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
const luminance = (value) => rgb(value).map(x => x / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
const light = { '--bg': '#f8f9f6', '--surface': '#ffffff', '--surface-strong': '#edf2f5', '--text': '#171a19', '--text-strong': '#171a19', '--muted': '#596359', '--line': '#c4ccc2', '--accent': '#244ce5', '--accent-soft': 'rgba(47, 109, 134, 0.11)', '--quote-text': '#314049' };

async function checkTextContrast(page, label) {
  const samples = await page.evaluate(() => {
    const color = value => value.match(/[\d.]+/g).map(Number);
    const background = el => {
      const layers = [];
      for (let node = el; node; node = node.parentElement) layers.unshift(color(getComputedStyle(node).backgroundColor));
      return `rgb(${layers.reduce((bg, fg) => bg.map((x, i) => fg[i] * (fg[3] ?? 1) + x * (1 - (fg[3] ?? 1))), [255, 255, 255]).join(',')})`;
    };
    return [...document.querySelectorAll('body *')].filter(el => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())).map(el => ({ text: el.textContent.trim().slice(0, 70), color: getComputedStyle(el).color, bg: background(el) }));
  });
  assert.ok(samples.length > 10, `${label}: text audit must not be empty`);
  const ratios = samples.map(x => ({ ...x, ratio: contrast(x.color, x.bg) }));
  assert.deepEqual(ratios.filter(x => x.ratio < 4.5), [], `${label}: all normal text, including syntax, must meet 4.5:1`);
  console.log(`PASS contrast ${label}: ${samples.length} text samples; minimum ${Math.min(...ratios.map(x => x.ratio)).toFixed(2)}:1`);
}

export async function verifyThemes(browser, origin) {
  for (const width of [390, 1440]) {
    for (const system of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: system });
      const page = await context.newPage();
      // Both automatic dark and explicit dark-on-light use exactly the same rules.
      await page.goto(origin);
      if (system === 'light') await page.locator('[data-theme-toggle]').click();
      for (const route of ['/', '/about/', '/blog/', '/publications/', '/blog/pragma-unroll/']) {
        await page.goto(origin + route);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(21, 22, 25)');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}/${width}: no page overflow`);
        await checkTextContrast(page, `${route}/${width}/${system}`);
        const themeIcon = await page.locator('.theme-toggle').evaluate(el => ({ color: getComputedStyle(el).color, bg: getComputedStyle(document.body).backgroundColor }));
        assert.ok(contrast(themeIcon.color, themeIcon.bg) >= 3, 'Theme control contrast');
        if (route === '/blog/pragma-unroll/') {
          assert.ok(await page.locator('table').count() > 0);
          const button = page.locator('.code-shell > button').first();
          const boundary = await button.evaluate(el => ({ border: getComputedStyle(el).borderColor, bg: getComputedStyle(el).backgroundColor }));
          assert.ok(contrast(boundary.border, boundary.bg) >= 3, 'Copy control boundary contrast');
          await button.hover();
          assert.equal(await button.evaluate(el => getComputedStyle(el).borderColor), 'rgb(142, 175, 255)');
          await page.locator('.code-shell pre').first().focus();
          await page.keyboard.press('Tab');
          assert.equal(await page.locator(':focus').getAttribute('data-copy-code'), 'true');
          const focus = await button.evaluate(el => ({ outline: getComputedStyle(el).outlineColor, bg: getComputedStyle(el).backgroundColor, style: getComputedStyle(el).outlineStyle }));
          assert.equal(focus.style, 'solid');
          assert.ok(contrast(focus.outline, focus.bg) >= 3, 'Keyboard focus contrast');
          await page.screenshot({ path: `test-results/screenshots/dark-code-focus-${width}-${system}.png` });
          await page.locator('table').first().screenshot({ path: `test-results/screenshots/dark-table-${width}-${system}.png` });
          // A QA-only fixture checks retained KaTeX support without publishing invented content.
          await page.locator('.prose').evaluate((el, html) => el.insertAdjacentHTML('beforeend', `<div data-math-fixture>${html}</div>`), katex.renderToString('E = mc^2', { displayMode: true }));
          await checkTextContrast(page, `KaTeX/${width}/${system}`);
          await page.locator('[data-math-fixture]').screenshot({ path: `test-results/screenshots/dark-math-${width}-${system}.png` });
        }
      }
      // Explicit light on dark OS and system light preserve the original values and syntax colors.
      await page.locator('[data-theme-toggle]').click();
      await page.reload();
      const values = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, getComputedStyle(document.documentElement).getPropertyValue(key).trim()])), Object.keys(light));
      assert.deepEqual(values, light, `Preserve light palette on ${system} OS`);
      assert.equal(await page.locator('.astro-code').first().evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(36, 41, 46)');
      const colors = await page.locator('.astro-code span[style]').evaluateAll(els => [...new Set(els.map(el => getComputedStyle(el).color))].sort());
      assert.deepEqual(colors, ['rgb(106, 115, 125)', 'rgb(121, 184, 255)', 'rgb(179, 146, 240)', 'rgb(225, 228, 232)', 'rgb(249, 117, 131)'].sort(), 'Preserve all existing light code token colors');
      // A system change must retain an intentional light override until reset.
      if (system === 'dark') {
        assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
        await page.emulateMedia({ colorScheme: 'light' });
        assert.equal(await page.locator('html').getAttribute('data-theme'), null);
        await page.emulateMedia({ colorScheme: 'dark' });
        assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(21, 22, 25)');
      }
      await context.close();
    }
  }
  console.log('PASS dark theme: automatic/override, light invariants, text/UI contrast, focus, code, tables, KaTeX, mobile');
}
