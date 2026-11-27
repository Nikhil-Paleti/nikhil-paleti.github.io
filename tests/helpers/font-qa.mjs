import assert from "node:assert/strict";

// Text must render from the site's own font files at every pixel density:
// a normal monitor (1x), a scaled 4K monitor (1.5x and 2x) and a phone (3x).
// The crops are saved so the type can be compared by eye in the CI artifact.
const screens = [
  { name: "1x", width: 1440, scale: 1 },
  { name: "1.5x", width: 1440, scale: 1.5 },
  { name: "2x", width: 1440, scale: 2 },
  { name: "phone-3x", width: 390, scale: 3 },
];

export async function verifyFonts(browser, origin) {
  for (const screen of screens) {
    for (const colorScheme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width: screen.width, height: 900 }, deviceScaleFactor: screen.scale, colorScheme });
      const page = await context.newPage();
      const fontRequests = [];
      page.on("request", (request) => { if (request.resourceType() === "font") fontRequests.push(new URL(request.url()).pathname); });
      for (const route of ["/", "/blog/pragma-unroll/"]) {
        await page.goto(origin + route);
        await page.evaluate(() => document.fonts.ready);
        const faces = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, "")));
        assert.ok(faces.includes("Inter"), `${screen.name} ${route}: Inter loaded`);
        if (route !== "/") assert.ok(faces.includes("JetBrains Mono"), `${screen.name} ${route}: JetBrains Mono loaded`);
        const slug = route === "/" ? "home" : "article";
        await page.screenshot({ path: `test-results/screenshots/fonts-${slug}-${screen.name}-${colorScheme}.png`, clip: { x: 0, y: 0, width: screen.width, height: 900 } });
      }
      assert.ok(fontRequests.length > 0 && fontRequests.every((p) => p.startsWith("/fonts/")), `${screen.name}: fonts come from /fonts/ only (${fontRequests.join(", ")})`);
      await context.close();
    }
  }
  console.log("PASS fonts: self-hosted Inter and JetBrains Mono load at 1x, 1.5x, 2x and on a 3x phone");
}
