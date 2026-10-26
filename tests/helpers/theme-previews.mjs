// Review-only color studies on the real production pages; never shipped to visitors.
export const palettes = {
  graphite: { bg: '#151619', surface: '#1c1e22', raised: '#25282e', text: '#e7e8ea', strong: '#f5f6f7', muted: '#abb0ba', accent: '#8eafff', line: '#363a42', ui: '#75808e', comment: '#a0a7b4' },
  midnight: { bg: '#111622', surface: '#181f2e', raised: '#232d40', text: '#e5e9f2', strong: '#f4f6fb', muted: '#a7b3c9', accent: '#a0b9ff', line: '#34405a', ui: '#707f99', comment: '#a7b3c9' },
  warm: { bg: '#181716', surface: '#22201e', raised: '#2c2926', text: '#ede9e2', strong: '#faf7f1', muted: '#b8afa4', accent: '#a5baff', line: '#443f39', ui: '#887c6e', comment: '#b8afa4' }
};

export async function captureThemePreviews(browser, origin) {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: 'dark' });
    const page = await context.newPage();
    for (const [name, p] of Object.entries(palettes)) {
      const css = `:root { --bg: ${p.bg} !important; --surface: ${p.surface} !important; --surface-strong: ${p.raised} !important; --text: ${p.text} !important; --text-strong: ${p.strong} !important; --muted: ${p.muted} !important; --accent: ${p.accent} !important; --line: ${p.line} !important; --button-bg: ${p.surface} !important; --quote-text: ${p.text} !important; --accent-soft: color-mix(in srgb, ${p.accent} 12%, transparent) !important; } a { text-decoration-color: ${p.accent} !important; }`;
      await page.goto(origin);
      await page.addStyleTag({ content: css });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `test-results/screenshots/palette-${name}-home-${width}.png`, fullPage: true });
      await page.goto(origin + '/blog/pragma-unroll/');
      await page.addStyleTag({ content: css });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `test-results/screenshots/palette-${name}-article-${width}.png` });
    }
    await context.close();
  }
}
