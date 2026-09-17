import Link from "next/link";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-[#0d0d0f] px-5 text-white">
    <section className="max-w-md rounded-xl border border-zinc-800 bg-[#151517] p-8">
      <h1 className="text-xl font-semibold">Página ou link indisponível</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-400">O projeto pode ter sido excluído ou o link de revisão foi desativado. Se você é cliente, peça um link válido ao editor.</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-white px-4 py-2 text-sm text-black">Área do editor</Link>
    </section>
  </main>;
}
