import promptsJson from "./prompts.json";

export type Prompt = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  author: string;
  description: string;
  tags: string[];
  models: string[];
  prompt: string;
};

export const prompts: Prompt[] = promptsJson as Prompt[];

export const categories: string[] = Array.from(
  new Set(prompts.map((p) => p.category))
).sort();

export function filterPrompts(opts: {
  query?: string;
  category?: string;
}): Prompt[] {
  const q = (opts.query ?? "").trim().toLowerCase();
  const cat = opts.category ?? "All";
  return prompts.filter((p) => {
    const matchesCat = cat === "All" || p.category === cat;
    if (!matchesCat) return false;
    if (!q) return true;
    const haystack = [
      p.title,
      p.description,
      p.category,
      p.subcategory,
      p.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getPrompt(id: string): Prompt | undefined {
  return prompts.find((p) => p.id === id);
}
