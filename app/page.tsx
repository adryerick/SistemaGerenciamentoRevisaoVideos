import { redirect } from "next/navigation";
import AuthForm from "./components/AuthForm";
import { getAuthenticatedEditor } from "./lib/auth";

export const dynamic = "force-dynamic";
export default async function Home() {
  if (await getAuthenticatedEditor()) redirect("/dashboard");
  return <AuthForm />;
}
