import type { Metadata } from "next";
import { listPrompts, listCategories } from "@/lib/prompts-repo";
import { LibraryClient } from "@/components/LibraryClient";

export const metadata: Metadata = {
  title: "Prompt Library — PromptDeck",
  description:
    "Browse curated, ready-to-use prompts for ChatGPT and Claude. Search by category, copy in one click.",
};

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [prompts, categories] = await Promise.all([
    listPrompts(),
    listCategories(),
  ]);
  return <LibraryClient prompts={prompts} categories={categories} />;
}
