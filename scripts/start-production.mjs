import { spawn } from "node:child_process";

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: "inherit", env: process.env });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Comando falhou (${code})`)));
  });
}

try {
  await run(["node_modules/prisma/build/index.js", "migrate", "deploy"]);
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", process.env.PORT ?? "3000"], { stdio: "inherit", env: process.env });
  for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => server.kill(signal));
  server.once("error", (error) => { console.error(error.message); process.exitCode = 1; });
  server.once("exit", (code) => { process.exitCode = code ?? 1; });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
