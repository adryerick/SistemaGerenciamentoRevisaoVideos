# Sistema de Gerenciamento de Revisão de Vídeos

MVP acadêmico para centralizar versões de vídeos e solicitações de alteração entre
um editor e seus clientes. Next.js 16, React 19, TypeScript, Tailwind, Prisma e SQLite.

## Funcionalidades

- Login real do editor, sessão de 8 horas e saída da conta.
- Cadastro, consulta, edição e exclusão de clientes sem projetos vinculados.
- Criação, pesquisa, edição de nome/descrição/status e exclusão de projetos.
- Upload, conversão, reprodução, histórico e exclusão de versões.
- Link de revisão sem cadastro de cliente, com ativação/desativação.
- Comentários por versão, minutagem opcional, captura do instante do player e retorno ao trecho.
- Solicitações pendentes, em andamento ou resolvidas; histórico público por versão.
- Progresso calculado pela proporção de solicitações resolvidas e métricas no dashboard.

A conclusão do projeto é uma decisão manual do editor. Marcar o projeto como
Resolvido não altera automaticamente as solicitações, nem significa aprovação
formal do cliente. Não há fluxo de aprovação eletrônica no escopo atual.

## Executar localmente

Requer Node.js 20.9 ou superior compatível com as dependências nativas; validado
neste computador com Node.js 24.21.0. O FFmpeg é baixado na instalação.

1. Execute `npm install`.
2. Crie `.env` com `DATABASE_URL="file:./prisma/dev.db"`.
3. Execute `npx prisma generate` e `npx prisma migrate deploy`.
4. Execute `npm run auth:prepare`.
5. Execute `npm run dev`.
6. Abra o link local de configuração exibido pelo passo 4 e escolha nome, e-mail
   e senha de pelo menos 12 caracteres. Esse código de configuração é secreto,
   de uso inicial, e não deve ser compartilhado.
7. Nos próximos acessos, entre por [localhost:3000](http://localhost:3000).

A configuração associa o acesso ao editor local existente, preservando seu ID,
clientes, projetos e vídeos. Não é necessário executar o seed. `npm run db:seed`
é somente para demonstrações com dados fictícios, não para uma base de testes reais.

## Autenticação e dados locais

Esta edição do MVP atende **um editor por instalação**. As credenciais ficam em
`.local/auth.json`, fora da pasta pública e ignoradas pelo Git: senha derivada com
scrypt e salt aleatório, segredo de assinatura gerado localmente e ID do editor.
Não existe senha padrão ou acesso anônimo ao painel. Não envie essa pasta ao GitHub.

A sessão usa cookie HttpOnly, SameSite=Lax e prazo de 8 horas; em HTTPS, Secure.
Há validação da assinatura e do editor nas APIs, proteção de navegação no Proxy,
verificação de origem e limite simples de tentativas de login por processo.
Sair remove o cookie do navegador; como as sessões são assinadas e sem tabela de
sessões, uma cópia de um token continua válida até expirar. Rotacionar o segredo
invalida todas as sessões. Recuperação de senha por e-mail e múltiplos editores
não estão implementados.

Faça backup conjunto de `prisma/dev.db`, `public/uploads` e `.local`, com o
servidor parado. O banco, os vídeos e os segredos não são versionados.
Excluir projetos/versões remove os respectivos registros e arquivos, sem lixeira.

As URLs diretas de uploads exigem sessão do editor. O cliente recebe o vídeo
pela API que verifica o token e se o link está ativo. Desativar um link impede
novas consultas e envios; não apaga cópias já baixadas ou o vídeo já carregado
no navegador do cliente. Todo comentário do projeto é compartilhado pelo link:
não há notas privadas do editor.

## Compatibilidade de vídeo

Novos uploads são convertidos com FFmpeg para MP4/H.264 de 8 bits (`yuv420p`),
áudio AAC estéreo quando presente e índice no início do arquivo (`faststart`).
Aceita MP4, MOV, M4V, WebM, MKV, AVI, MTS e M2TS até 250 MB. A extensão não
garante que o conteúdo seja decodificável. Arquivos inválidos são rejeitados.

O processamento ocorre localmente, tem limite de 10 minutos por vídeo e requer
manter a página aberta. O original no computador não é modificado.
Não substitui o master, não faz tone mapping de HDR e não garante todos os codecs.
Vídeos antigos que falhem podem ser reenviados como nova versão.

Se um vídeo funcionar no Chrome e falhar no Opera, teste ativar/desativar a
aceleração gráfica nas configurações e reinicie o navegador. A aplicação não
consegue alterar essa configuração. [Orientação oficial do Opera](https://help.opera.com/en/faq/).

## Testes e conferência

- `npm run lint`: análise estática.
- `npx tsc --noEmit`: verificação de tipos.
- `npm run build`: compilação de produção.
- `npm test`: validações, sessões, minutagem, progresso e conversões.
- `npm run test:mvp`: sobe servidor temporário na porta 3107 e usa SQLite e
  credenciais exclusivos de teste. Verifica login, acesso negado, upload, revisão
  pública, comentários, edição, progresso e desativação. Reserva um ID de projeto
  sem pasta existente para os arquivos de teste; remove os próprios dados ao terminar.

O teste de conversão inclui H.264, HEVC de 10 bits, WebM/VP9 e ProRes sem áudio.
O vídeo propositalmente inválido gera um log de erro esperado.

Roteiro manual: cadastre cliente e projeto; envie um vídeo; abra o link em janela
anônima; marque um instante e envie comentário; no painel altere o status; no
link clique em Atualizar status; clique na minutagem e confira o trecho; desative
o link e confirme que novos acessos são negados.

## Publicação e limites

O MVP local está implementado, mas **não foi publicado na internet**. Links com
localhost só funcionam no computador que executa o servidor. Nenhum serviço pago
foi contratado e nenhuma conta externa foi criada.

Para publicar: escolher hospedagem Node com HTTPS e disco persistente, configurar
backups e uma origem confiável, revisar autenticação e limites de abuso para a
internet e verificar licenças do FFmpeg/codecs na distribuição pretendida.
Ambientes serverless de curta duração exigem armazenamento e fila de conversão
externos; não basta enviar esta instalação para uma função serverless.

Veja [CHANGELOG.md](CHANGELOG.md) para as entregas e limitações conhecidas.
