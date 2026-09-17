# Sistema de Gerenciamento de Revisão de Vídeos

MVP acadêmico para centralizar versões de vídeos e solicitações de alteração entre
um editor e seus clientes. Next.js 16, React 19, TypeScript, Tailwind, Prisma e SQLite.

## Funcionalidades

- Login real do editor, sessão de 8 horas, saída da conta e recuperação local de acesso.
- Cadastro, consulta, edição e exclusão de clientes sem projetos vinculados.
- Criação, pesquisa, edição de nome/descrição/status e exclusão de projetos.
- Upload, conversão, reprodução, histórico e exclusão de versões.
- Link de revisão sem cadastro de cliente, com ativação/desativação.
- Comentários por versão, minutagem opcional, captura do instante do player e retorno ao trecho.
- Solicitações pendentes, em andamento ou resolvidas; histórico público por versão.
- Progresso de upload separado da conversão, confirmação de envio e preservação do arquivo em falhas.
- Revisão responsiva com filtros de status e rascunhos locais separados por versão.
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

### Esqueci meu acesso

No terminal, na pasta do projeto, execute `npm run auth:recover`. Abra o link
gerado, confira ou corrija seu e-mail e escolha uma nova senha com pelo menos
12 caracteres. O link é secreto, dura 30 minutos e pode ser usado uma única vez.
Gerar o link não altera a senha; confirmar o formulário troca as credenciais e
invalida todas as sessões anteriores. Clientes, projetos e vídeos são preservados.
Cada novo link substitui o anterior. É necessário acesso ao computador/servidor:
não há envio de recuperação por e-mail. Não publique links ou arquivos de recuperação.

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

O buffer do Next Proxy aceita 260 MB para comportar o limite de 250 MB do vídeo
e o envelope multipart. Sem essa configuração, o Next corta o corpo em 10 MB.
Isso não remove limites do provedor de compartilhamento: para o Quick Tunnel,
prefira até 95 MB por envio. Arquivos maiores podem ser enviados por localhost;
o cliente pode continuar usando a revisão pública. A Cloudflare documenta
[100 MB por requisição nos planos Free/Pro](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/4xx-client-error/error-413/).

Os rascunhos da revisão ficam apenas no navegador, separados pelo link e versão,
e são removidos após um envio confirmado. Trocar a versão não transfere o texto
para outro vídeo. Se o armazenamento estiver bloqueado, o rascunho é mantido
somente enquanto a página estiver aberta. Em computador compartilhado, considere
usar janela privada; comentários enviados são visíveis a quem possui o link.

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
- `npm run test:mvp -- --check-forms`: abre o servidor isolado para conferir login
  e cadastro de projeto pelo navegador, com conta e cliente de teste exibidos no
  terminal. Não envie vídeos nesse modo. Pressione Enter para encerrar e limpar o banco.
- `npm run test:mvp -- --check-review --production`: compila produção e prepara
  duas versões e comentários exclusivos de teste para conferência visual da revisão.
  Pressione Enter para apagar apenas os vídeos e banco isolados.
- `npm run test:mvp -- --production`: executa a suíte integrada na compilação de produção.

O teste de conversão inclui H.264, HEVC de 10 bits, WebM/VP9 e ProRes sem áudio.
O teste integrado envia um MP4 válido acima de 10 MB para impedir a regressão
de truncamento do corpo pelo Proxy.
O vídeo propositalmente inválido gera um log de erro esperado.
Os testes integrados também verificam seleção de cliente por ID, nomes de clientes
duplicados e recuperação de acesso com invalidação das sessões e do código utilizado.

Roteiro manual: cadastre cliente e projeto; envie um vídeo; abra o link em janela
anônima; marque um instante e envie comentário; no painel altere o status; no
link clique em Atualizar status; clique na minutagem e confira o trecho; desative
o link e confirme que novos acessos são negados.

## Publicação e limites

### Compartilhamento gratuito com Cloudflare Quick Tunnel

Para uma apresentação do MVP, execute `npm run share` na pasta do projeto.
O comando compila a versão de produção em `.next-public`, inicia o servidor
na porta local 3001 e abre um endereço HTTPS temporário da Cloudflare.
O acesso deve estar configurado antes de executar o comando.

O cliente oficial `cloudflared` precisa estar em `.local/cloudflared.exe`
no Windows; para outro local, defina `CLOUDFLARED_PATH`. Baixe pela
[página oficial](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/).
O executável, os dados e o endereço atual não são enviados ao GitHub.

Abra o **endereço público** exibido no terminal, entre na sua conta e copie os
links de revisão por essa página. Links copiados em localhost continuam locais.
Clientes e vídeos permanecem no computador. O site só funciona enquanto o PC,
a internet e os processos estiverem ativos; Ctrl+C encerra o compartilhamento.
Ao executar novamente, o endereço muda e os links públicos devem ser atualizados.
O servidor de desenvolvimento da porta 3000 pode continuar sendo usado localmente.

Não foi contratado plano pago. O Quick Tunnel é destinado a testes e não tem
garantia de disponibilidade. Consulte as
[limitações oficiais](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/).

O MVP pode ser disponibilizado temporariamente pelo Quick Tunnel acima, mas
**não possui hospedagem permanente**. Links com localhost só funcionam no
computador que executa o servidor. Nenhum serviço pago
foi contratado e nenhuma conta externa foi criada.

Para publicar: escolher hospedagem Node com HTTPS e disco persistente, configurar
backups e uma origem confiável, revisar autenticação e limites de abuso para a
internet e verificar licenças do FFmpeg/codecs na distribuição pretendida.
Ambientes serverless de curta duração exigem armazenamento e fila de conversão
externos; não basta enviar esta instalação para uma função serverless.

Veja [CHANGELOG.md](CHANGELOG.md) para as entregas e limitações conhecidas.

### Implantação preparada no Render

O repositório contém `Dockerfile` e `render.yaml`. A implantação usa um servidor
Node Linux com FFmpeg, executa as migrations antes de iniciar e mantém banco,
credenciais e vídeos no disco `/var/data`. `/health` verifica a conexão com o banco.
Nenhum dado local, senha ou vídeo é incluído na imagem Docker.

1. Crie uma conta no Render e conecte o GitHub.
2. Em New > Blueprint, selecione este repositório e a branch `master`.
3. Confira os recursos pagos antes de criar: `0.5c-512mb` e disco de 5 GB.
   Preço base verificado em 17/09/2026: US$ 7 + US$ 1,25/mês, antes de impostos,
   tráfego excedente e outros recursos. Esse plano inicial exige verificar os
   vídeos de teste: conversões e uploads grandes podem exceder os 512 MB de RAM.
4. Aguarde o deploy e o health check. O Render gera o domínio HTTPS.
5. No Shell do serviço, como usuário `node` (`gosu node npm run auth:prepare`
   se o Shell iniciar como root), execute `npm run auth:prepare` e abra o link
   secreto exibido para configurar o acesso. A senha deve ser escolhida pelo editor.
6. Confira login, criação de cliente/projeto, upload e revisão pelo link público.

`RENDER_EXTERNAL_URL` é usado para links e validação de origem HTTPS. Para outro
provedor ou domínio próprio, defina `APP_URL` com a origem pública exata.
Os deploys automáticos estão desligados para evitar atualizações sem conferência.

A instalação online começa com uma base vazia. Para migrar os testes locais,
pare os servidores, faça backup e transfira por canal privado o banco para
`/var/data/dev.db`, `.local` para `/var/data/auth` e os uploads para
`/var/data/uploads`, preservando IDs e permissões do usuário `node`.
Não envie os arquivos de autenticação ao GitHub. A imagem precisa de build no
Docker/Render; a compilação local do Next não valida sozinha o contêiner Linux.

Fontes: [Docker](https://render.com/docs/docker),
[discos persistentes](https://render.com/docs/disks) e
[preços](https://render.com/pricing).
