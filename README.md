This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Compatibilidade de vídeo no MVP local

Novos uploads são preparados com FFmpeg antes de registrar a versão: MP4 com vídeo
H.264 de 8 bits (`yuv420p`), áudio AAC estéreo (quando houver áudio) e metadados no
início do arquivo (`faststart`). Aceita MP4, MOV, M4V, WebM, MKV, AVI, MTS e M2TS
até 250 MB. A extensão sozinha não garante que o conteúdo seja decodificável.

Instale com `npm install` e reinicie `npm run dev` após atualizar as dependências.
O pacote `ffmpeg-static` baixa um executável para o sistema operacional atual.
O processamento é local, pode levar minutos e tem limite de 10 minutos por vídeo;
a página de envio deve permanecer aberta. O arquivo original no computador do
editor não é alterado. O servidor guarda a versão convertida para reprodução.
Arquivos enviados antes desta mudança devem ser reenviados como nova versão.

Não é uma garantia de suporte a todo codec: arquivos corrompidos, protegidos ou
sem faixa de vídeo são rejeitados. A conversão para 8 bits é voltada a revisão;
não substitui o master e não faz gerenciamento de cor/tone mapping de HDR.
Hospedagem serverless com disco temporário/timeout curto exige armazenamento e
fila de processamento externos. Nenhum serviço externo foi configurado aqui.

`npm run test:video` verifica H.264, HEVC de 10 bits, WebM/VP9, ProRes sem áudio,
arquivos inválidos e pedidos de trechos do vídeo. Com `VIDEO_TEST_BASE_URL`
apontando para um servidor local de teste, também verifica upload, reprodução
pública e desativação do link, criando e removendo seus próprios dados temporários.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
