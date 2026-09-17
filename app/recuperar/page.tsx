import AuthForm from "../components/AuthForm";
import { readAuthConfig } from "../lib/auth-core";
import { readRecovery, validRecovery } from "../lib/auth-recovery";

export const dynamic = "force-dynamic";
export default async function RecoveryPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const config = await readAuthConfig();
  const valid = validRecovery(token, await readRecovery(), config);
  return <AuthForm recovery token={valid ? token : ""} email={valid ? config!.email : ""} />;
}
