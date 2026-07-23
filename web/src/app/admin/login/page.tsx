import { redirect } from "next/navigation";
import { isAuthed, isAuthConfigured } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Admin Login — PromptDeck" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAuthed()) redirect("/admin");
  const configured = isAuthConfigured();
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-bold">Admin Login</h1>
      <p className="mt-2 text-sm text-muted">
        Manage the PromptDeck prompt library.
      </p>
      {configured ? (
        <LoginForm />
      ) : (
        <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          Admin auth isn&apos;t configured yet. Set{" "}
          <code className="text-foreground">ADMIN_PASSWORD</code> and{" "}
          <code className="text-foreground">ADMIN_SECRET</code> in{" "}
          <code className="text-foreground">web/.env.local</code>, then restart.
        </div>
      )}
    </div>
  );
}
