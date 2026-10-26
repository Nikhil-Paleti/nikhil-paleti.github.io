import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { captureThemePreviews } from "./helpers/theme-previews.mjs";
import { verifyThemes } from "./helpers/theme-qa.mjs";

// Exercise the production build without publishing it anywhere.
const root = path.resolve("dist");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".pdf": "application/pdf", ".woff2": "font/woff2" };
const server = createServer(async (request, response) => {
  try {
    let file = path.resolve(root, `.${decodeURIComponent(new URL(request.url, "http://localhost").pathname)}`);
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) throw new Error("Invalid path");
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    response.setHeader("Content-Type", types[path.extname(file)] ?? "application/octet-stream");
    response.end(await readFile(file));
  } catch { response.writeHead(404).end("Not found"); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
await mkdir("test-results/screenshots", { recursive: true });
let browser;
try {
  browser = await chromium.launch();
  await captureThemePreviews(browser, origin);
  await verifyThemes(browser, origin);
  for (const width of [375, 390, 768, 1440]) {
    for (const colorScheme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(origin);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator("h1").innerText(), "Nikhil Paleti.");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}/${colorScheme}: horizontal overflow`);
      assert.equal(await page.locator(".social-links a").count(), 5);
      assert.equal(await page.locator(".news-row").count(), 4);
      assert.equal(await page.locator(".writing-row").count(), 3);
      await page.screenshot({ path: `test-results/screenshots/home-${width}-${colorScheme}.png`, fullPage: true });

      // Native disclosures support repeated mouse and keyboard interaction.
      const summary = page.locator("summary").first();
      await summary.click();
      assert.ok(await page.locator("details").first().getAttribute("open") !== null);
      await summary.press("Enter");
      assert.equal(await page.locator("details").first().getAttribute("open"), null);
      await summary.press("Enter");
      await summary.press("Enter");
      assert.equal(await page.locator("details").first().getAttribute("open"), null);

      const theme = page.locator("[data-theme-toggle]");
      await theme.click();
      assert.equal(await page.locator("html").getAttribute("data-theme"), colorScheme === "light" ? "dark" : "light");
      await page.reload();
      assert.equal(await page.locator("html").getAttribute("data-theme"), colorScheme === "light" ? "dark" : "light");
      await page.locator("[data-theme-toggle]").click();
      assert.equal(await page.locator("html").getAttribute("data-theme"), null);

      // Main navigation plus Back/Forward must not leave an overlay or trap focus.
      await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Writing" }).click();
      assert.equal(await page.locator("h1").innerText(), "Blog");
      await page.goBack();
      assert.equal(await page.locator("h1").innerText(), "Nikhil Paleti.");
      await page.goForward();
      assert.equal(await page.locator("h1").innerText(), "Blog");
      await page.goto(origin);
      await page.keyboard.press("Tab");
      assert.equal(await page.locator(":focus").innerText(), "Skip to content");
      await page.keyboard.press("Enter");
      assert.equal(await page.locator(":focus").getAttribute("id"), "main-content");
      assert.deepEqual(errors, [], `${width}/${colorScheme}: browser errors`);
      await context.close();
      console.log(`PASS home ${width}px ${colorScheme}: layout, theme, disclosures, navigation, keyboard`);
    }
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, colorScheme: "light" });
  const page = await context.newPage();
  for (const route of ["/about/", "/blog/", "/publications/", "/blog/pragma-unroll/"]) {
    const response = await page.goto(origin + route);
    assert.equal(response.status(), 200);
    assert.equal(await page.locator("h1").count(), 1);
    await page.screenshot({ path: `test-results/screenshots/${route.split("/").filter(Boolean).join("-")}-390.png`, fullPage: true });
    const overflow = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, elements: [...document.querySelectorAll("main *")].filter(el => el.getBoundingClientRect().right > innerWidth).slice(0, 12).map(el => ({ tag: el.tagName, class: el.className })) }));
    assert.ok(overflow.scrollWidth <= overflow.width, `${route}: mobile overflow ${JSON.stringify(overflow)}`);
    if (route === "/blog/pragma-unroll/") {
      const author = page.locator(".article-byline a");
      assert.equal(await author.innerText(), "Nikhil Paleti");
      assert.equal(await author.getAttribute("href"), "/about/");
      await author.click();
      assert.equal(await page.locator("h1").innerText(), "About my work");
      await page.goBack();
      assert.equal(await page.locator("h1").innerText(), "#pragma unroll");
      const scrollableCode = await page.locator(".prose pre").evaluateAll((blocks) => blocks.filter(block => block.scrollWidth > block.clientWidth).map(block => {
        block.scrollLeft = 100;
        const result = { overflowX: getComputedStyle(block).overflowX, scrolled: block.scrollLeft > 0 };
        block.scrollLeft = 0;
        return result;
      }));
      assert.ok(scrollableCode.length > 0);
      assert.ok(scrollableCode.every(block => block.overflowX === "auto" && block.scrolled), "Wide code remains horizontally scrollable");
    }
    console.log(`PASS route ${route}`);
  }
  // This existing route intentionally redirects to the original Medium article.
  const archivedPost = await context.request.get(origin + "/blog/positional-encoding/");
  assert.equal(archivedPost.status(), 200);
  const archivedHtml = await archivedPost.text();
  assert.ok(archivedHtml.includes('http-equiv="refresh"'));
  assert.ok(archivedHtml.includes("https://medium.com/thedeephub/positional-encoding-explained-a-deep-dive-into-transformer-pe-65cfe8cfe10b"));
  console.log("PASS existing positional-encoding archive redirect");
  const resume = await context.request.get(origin + "/Nikhil_Paleti_Resume.pdf");
  assert.equal(resume.status(), 200);
  assert.equal(resume.headers()["content-type"], "application/pdf");
  assert.ok((await resume.body()).subarray(0, 5).equals(Buffer.from("%PDF-")));
  await page.goto(origin + "/blog/pragma-unroll/#the-benchmark");
  assert.equal(await page.locator("#the-benchmark").count(), 1);
  console.log("PASS résumé PDF and benchmark anchor");
  await context.close();
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}

