import AuthForm from "../components/AuthForm";
import { readAuthConfig } from "../lib/auth-core";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function SetupPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  if (await readAuthConfig()) redirect("/");
  const { token } = await searchParams;
  return <AuthForm setup token={typeof token === "string" ? token : ""} />;
}
