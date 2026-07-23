import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";
import { listPrompts } from "@/lib/prompts-repo";
import { AdminDashboard } from "./AdminDashboard";

export const metadata = { title: "Admin — PromptDeck" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthed())) redirect("/admin/login");
  const prompts = await listPrompts();
  return (
    <AdminDashboard initialPrompts={prompts} dbConfigured={isDbConfigured()} />
  );
}
