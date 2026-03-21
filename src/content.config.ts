import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      featured: z.boolean().default(false),
      archiveUrl: z.string().url().optional(),
      heroImage: image().optional()
    })
});

const publications = defineCollection({
  schema: z.object({
    title: z.string(),
    venue: z.string(),
    year: z.number(),
    authors: z.string(),
    href: z.string().url(),
    selected: z.boolean().default(false)
  })
});

export const collections = {
  blog,
  publications
};
