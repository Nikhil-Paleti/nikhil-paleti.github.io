// Renders the link-preview cards (1200×630) in the site's design:
// warm paper, Inter + JetBrains Mono, orange only for the result.
//   - public/og-card.png            site-wide card
//   - src/content/blog/<slug>/social-preview.png   one card per post
//
// Run by hand after adding a post or changing a post's title or result:
//   node scripts/og-cards.mjs
// The PNGs are committed, so CI and the deploy don't need these fonts.
// Rendering needs Inter and JetBrains Mono installed as system fonts.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import yaml from "js-yaml";

const W = 1200;
const H = 630;
const PAD = 80;
const C = { bg: "#f6f5f1", ink: "#16161a", muted: "#5f5e58", line: "#d9d6cd", accent: "#b93d0b" };
const SANS = "Inter, sans-serif";
const MONO = "'JetBrains Mono', monospace";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Greedy wrap by an average glyph width (em fraction); good enough for short titles.
function wrap(text, size, maxWidth, em = 0.55, maxLines = 3) {
  const perLine = Math.floor(maxWidth / (size * em));
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > perLine && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[\s,.;:]*\S*$/, "") + "…";
  }
  return lines;
}

const tspans = (lines, x, lh) =>
  lines.map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lh}">${esc(l)}</tspan>`).join("");

const frame = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <text x="${PAD}" y="${PAD + 22}" font-family="${SANS}" font-size="30" font-weight="600" fill="${C.ink}">NP / Nikhil Paleti</text>
  <text x="${W - PAD}" y="${PAD + 22}" font-family="${MONO}" font-size="22" fill="${C.muted}" text-anchor="end">nikhilpaleti.com</text>
  <rect x="${PAD}" y="${PAD + 50}" width="${W - 2 * PAD}" height="2" fill="${C.ink}"/>
  ${body}
</svg>`;

function siteCard() {
  return frame(`
  <text x="${PAD}" y="300" font-family="${SANS}" font-size="104" font-weight="700" letter-spacing="-3" fill="${C.ink}">Nikhil Paleti</text>
  <text x="${PAD}" y="370" font-family="${SANS}" font-size="38" fill="${C.muted}">ML systems engineer and researcher</text>
  <rect x="${PAD}" y="${H - PAD - 52}" width="${W - 2 * PAD}" height="1" fill="${C.line}"/>
  <text x="${PAD}" y="${H - PAD}" font-family="${MONO}" font-size="22" letter-spacing="1.5" fill="${C.muted}">MACHINE LEARNING SYSTEMS / GPU PERFORMANCE</text>`);
}

function postCard(data) {
  const date = new Date(data.date).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase();
  const titleLines = wrap(data.title, 88, W - 2 * PAD, 0.56, 2);
  let y = 250;
  let body = `<text x="${PAD}" y="${y}" font-family="${MONO}" font-size="22" letter-spacing="1.5" fill="${C.muted}">WRITING · ${esc(date)}</text>`;
  y += 100;
  body += `<text x="${PAD}" y="${y}" font-family="${SANS}" font-size="88" font-weight="700" letter-spacing="-2.5" fill="${C.ink}">${tspans(titleLines, PAD, 96)}</text>`;
  y += (titleLines.length - 1) * 96;

  const footY = H - PAD;
  if (data.result) {
    // Result block: label, big value, then the summary beside it.
    const top = y + 60;
    body += `<rect x="${PAD}" y="${top}" width="${W - 2 * PAD}" height="1" fill="${C.line}"/>`;
    body += `<text x="${PAD}" y="${top + 44}" font-family="${MONO}" font-size="20" font-weight="500" letter-spacing="2" fill="${C.accent}">RESULT</text>`;
    body += `<text x="${PAD}" y="${top + 128}" font-family="${SANS}" font-size="84" font-weight="700" letter-spacing="-2" fill="${C.accent}">${esc(data.result.value)}</text>`;
    const valueWidth = data.result.value.length * 84 * 0.5 + 40;
    const sumLines = wrap(data.result.summary, 30, W - 2 * PAD - valueWidth, 0.52, 3);
    body += `<text x="${PAD + valueWidth}" y="${top + 84}" font-family="${SANS}" font-size="30" fill="${C.ink}">${tspans(sumLines, PAD + valueWidth, 40)}</text>`;
  } else {
    // No headline number: title and tags only, the same footer as the site card.
    const tags = (data.tags ?? []).slice(0, 4).join(" / ").toUpperCase();
    body += `<rect x="${PAD}" y="${footY - 52}" width="${W - 2 * PAD}" height="1" fill="${C.line}"/>`;
    body += `<text x="${PAD}" y="${footY}" font-family="${MONO}" font-size="22" letter-spacing="1.5" fill="${C.muted}">${esc(tags)}</text>`;
  }
  return frame(body);
}

async function render(svg, out) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
  console.log("wrote", out);
}

const root = process.cwd();
const siteSvg = siteCard();
fs.writeFileSync(path.join(root, "public/og-card.svg"), siteSvg);
await render(siteSvg, path.join(root, "public/og-card.png"));

const blogDir = path.join(root, "src/content/blog");
for (const slug of fs.readdirSync(blogDir)) {
  const dir = path.join(blogDir, slug);
  const file = ["index.mdx", "index.md"].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f));
  if (!file) continue;
  const data = yaml.load(fs.readFileSync(file, "utf8").split(/^---$/m)[1]);
  // Drafts and posts that redirect to an archive copy never show a card.
  if (data.draft || data.archiveUrl) continue;
  const svg = postCard(data);
  fs.writeFileSync(path.join(dir, "social-preview.svg"), svg);
  await render(svg, path.join(dir, "social-preview.png"));
}
