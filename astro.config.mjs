import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import rehypeBenchTables from "./src/lib/rehype-bench-tables.mjs";

export default defineConfig({
  site: "https://nikhilpaleti.com",
  integrations: [
    mdx(),
    sitemap({
      // These legacy URLs redirect and explicitly opt out of indexing.
      filter: (page) => !["/projects/", "/blog/positional-encoding/"].includes(new URL(page).pathname)
    })
  ],
  markdown: {
    shikiConfig: {
      // Light code sits on the paper surface; dark keeps high contrast.
      themes: { light: "github-light", dark: "github-dark-high-contrast" },
      defaultColor: "light"
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      rehypeBenchTables,
      rehypeKatex,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            ariaLabel: "Link to section"
          }
        }
      ],
      [
        rehypePrettyCode,
        {
          theme: "github-light",
          keepBackground: false
        }
      ]
    ]
  }
});

