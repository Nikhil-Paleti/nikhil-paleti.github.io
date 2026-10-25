import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

// Inspect production artifacts without a server, browser, or network access.
const root = path.resolve("dist");
const origin = "https://nikhilpaleti.dev";
const decode = (text) => text.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (_, entity) => {
  if (entity.startsWith("#")) return String.fromCodePoint(parseInt(entity.slice(entity[1].toLowerCase() === "x" ? 2 : 1), entity[1].toLowerCase() === "x" ? 16 : 10));
  return { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" }[entity.toLowerCase()];
});
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(([, key, double, single]) => [key.toLowerCase(), decode(double ?? single)]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(([tag]) => attributes(tag));
const meta = (html, name) => tags(html, "meta").find((tag) => tag.name === name || tag.property === name)?.content;
const canonical = (html) => {
  const links = tags(html, "link").filter((tag) => tag.rel === "canonical");
  assert.equal(links.length, 1, "Exactly one canonical per route");
  return links[0].href;
};
const title = (html) => decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
const locations = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => decode(url));
const localFile = (url) => {
  const parsed = new URL(url);
  assert.equal(parsed.origin, origin, `Unexpected sitemap origin: ${url}`);
  assert.ok(!parsed.pathname.includes("//"), `Malformed path: ${url}`);
  return path.join(root, parsed.pathname);
};
function checkSchemaUrls(value) {
  if (typeof value === "string" && value.startsWith(`${origin}/`)) {
    assert.ok(!new URL(value).pathname.includes("//"), `Malformed schema URL: ${value}`);
  } else if (value && typeof value === "object") {
    Object.values(value).forEach(checkSchemaUrls);
  }
}

const sitemapIndex = await readFile(path.join(root, "sitemap-index.xml"), "utf8");
const sitemapFiles = locations(sitemapIndex);
assert.ok(sitemapFiles.length > 0, "Sitemap index must reference a sitemap");
const sitemapUrls = (await Promise.all(sitemapFiles.map(async (url) => locations(await readFile(localFile(url), "utf8"))))).flat();
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, "Sitemap URLs must be unique");

const expectedUrls = [];
const titles = new Set();
const descriptions = new Set();
const routeHtml = new Map();
for (const file of (await readdir(root, { recursive: true })).filter((file) => file === "index.html" || file.endsWith(`${path.sep}index.html`))) {
  const route = `/${file.split(path.sep).join("/").replace(/index\.html$/, "")}`;
  const url = new URL(route, origin).href;
  const html = await readFile(path.join(root, file), "utf8");
  routeHtml.set(route, html);
  const isRedirect = tags(html, "meta").some((tag) => tag["http-equiv"]?.toLowerCase() === "refresh");
  const noindex = /\bnoindex\b/i.test(meta(html, "robots") ?? "");
  if (noindex || isRedirect) {
    assert.ok(!sitemapUrls.includes(url), `Non-indexable route in sitemap: ${route}`);
    continue;
  }
  expectedUrls.push(url);
  assert.equal(canonical(html), url, `${route}: canonical must match route`);
  assert.equal(meta(html, "og:url"), url, `${route}: OG URL must match canonical`);
  const pageTitle = title(html);
  const description = meta(html, "description");
  assert.ok(pageTitle && !/^Home\s*[|—-]/i.test(pageTitle), `${route}: descriptive title required`);
  assert.ok(description?.trim(), `${route}: description required`);
  assert.ok(!titles.has(pageTitle), `${route}: duplicate title`);
  assert.ok(!descriptions.has(description), `${route}: duplicate description`);
  titles.add(pageTitle);
  descriptions.add(description);
  assert.equal(meta(html, "og:title"), pageTitle);
  assert.equal(meta(html, "twitter:title"), pageTitle);
  const stylesheets = tags(html, "link").filter((tag) => tag.rel === "stylesheet");
  assert.ok(stylesheets.some((tag) => tag.href?.startsWith("https://fonts.googleapis.com/css2?")), `${route}: discover fonts directly from HTML`);
  const css = (await Promise.all(stylesheets.filter((tag) => tag.href?.startsWith("/")).map((tag) => readFile(localFile(new URL(tag.href, origin)), "utf8")))).join("\n");
  assert.ok(!/@import[^;]*fonts\.googleapis\.com/.test(css), `${route}: no chained font import`);
  if (route === "/") assert.ok(!/\.katex-mathml\b/.test(css), "Homepage must not load article math CSS");
  if (route === "/blog/pragma-unroll/") assert.match(css, /\.katex-mathml\b/, "Article math styles remain available");
  const imageUrl = meta(html, "og:image");
  assert.equal(meta(html, "twitter:image"), imageUrl, `${route}: consistent sharing image`);
  assert.equal(meta(html, "twitter:image:alt"), meta(html, "og:image:alt"));
  assert.ok(meta(html, "og:image:alt")?.trim(), `${route}: sharing image description required`);
  assert.equal(path.extname(new URL(imageUrl).pathname), ".png", `${route}: raster sharing image required`);
  const image = await readFile(localFile(imageUrl));
  assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${route}: valid PNG signature`);
  assert.equal(image.readUInt32BE(16), Number(meta(html, "og:image:width")));
  assert.equal(image.readUInt32BE(20), Number(meta(html, "og:image:height")));
  assert.ok(image.length < 5 * 1024 * 1024, `${route}: sharing image under 5 MB`);
  assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `${route}: one primary heading`);
  const nodes = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attrs]) => attributes(attrs).type === "application/ld+json")
    .map(([, , json]) => JSON.parse(json));
  assert.ok(nodes.length > 0, `${route}: structured data required`);
  nodes.forEach(checkSchemaUrls);
  for (const node of nodes) {
    if (node["@type"] === "CollectionPage") assert.equal(node.url, url, `${route}: collection URL must match canonical`);
    if (node["@type"] === "WebSite" || node["@type"] === "BlogPosting") {
      assert.equal(node.author["@id"], `${origin}/#person`, `${route}: stable author identity`);
      assert.equal(node.author.url, `${origin}/about/`, `${route}: author profile URL`);
    }
    if (node["@type"] === "BlogPosting") {
      assert.equal(node.mainEntityOfPage, url, `${route}: article URL must match canonical`);
      assert.equal(node.image, imageUrl);
      assert.equal(meta(html, "og:type"), "article");
      assert.ok(tags(html, "a").some((tag) => tag.rel === "author" && tag.href === "/about/"), `${route}: visible author link`);
    }
  }
  console.log(`PASS SEO ${route}: title, description, canonical, schema, heading`);
}
assert.deepEqual([...sitemapUrls].sort(), expectedUrls.sort(), "Sitemap must contain exactly the canonical indexable routes");
assert.equal(title(routeHtml.get("/")), "ML Infrastructure Engineer & Researcher | Nikhil Paleti");
assert.equal(title(routeHtml.get("/blog/pragma-unroll/")), "CUDA #pragma unroll: GPU Latency and H100 Benchmarks | Nikhil Paleti");
const publications = routeHtml.get("/publications/");
assert.ok(tags(publications, "a").some((tag) => tag.href === "https://neurips.cc/virtual/2026/poster/151156"), "Link the DINO paper to its official NeurIPS record");
assert.match(publications, /class="author-name is-self">\s*Nikhil C Paleti\s*<\/span>/, "Recognize the official author-name variant");
for (const [, , json] of [...publications.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(([, attrs]) => attributes(attrs).type === "application/ld+json")) {
  const node = JSON.parse(json);
  if (node["@type"] === "ScholarlyArticle") assert.ok(!node.datePublished, "Do not invent publication dates from year-only metadata");
  if (node.url === "https://neurips.cc/virtual/2026/poster/151156") {
    assert.equal(node.headline, "Complementing DINO Features with Image Structure for Part Discovery");
    assert.deepEqual(node.author.map((author) => author.name), ["Samyak Rawlekar", "Nikhil C Paleti", "Amey Gupta", "Narendra Ahuja"]);
  }
}
assert.match(routeHtml.get("/blog/pragma-unroll/"), /<h1[^>]*>#pragma unroll<\/h1>/, "Preserve the visible article title");
for (const [route, destination] of [
  ["/projects/", `${origin}/`],
  ["/blog/positional-encoding/", "https://medium.com/thedeephub/positional-encoding-explained-a-deep-dive-into-transformer-pe-65cfe8cfe10b"]
]) {
  const html = routeHtml.get(route);
  assert.ok(html, `Preserve legacy route ${route}`);
  assert.match(meta(html, "robots"), /\bnoindex\b/);
  assert.equal(canonical(html), destination);
  const refresh = tags(html, "meta").find((tag) => tag["http-equiv"] === "refresh")?.content;
  assert.ok(refresh, `Preserve redirect ${route}`);
  assert.equal(new URL(refresh.split(/url=/i)[1].trim(), origin).href, destination);
}
assert.match(await readFile(path.join(root, "robots.txt"), "utf8"), /Sitemap: https:\/\/nikhilpaleti\.dev\/sitemap-index\.xml/);
console.log(`PASS sitemap: ${sitemapUrls.length} canonical indexable URLs; legacy redirects preserved`);
