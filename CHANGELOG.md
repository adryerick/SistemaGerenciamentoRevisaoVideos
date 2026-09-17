# Histórico de entregas

## 2026-09-17 — Diagnóstico de login e preparação da hospedagem

- Login verifica a sessão recebida pelo navegador antes de entrar no dashboard; diferencia bloqueio de cookies de credenciais recusadas e faz navegação completa após o sucesso.
- Opção Mostrar senha e identificação estável dos campos para conferir preenchimento automático.
- Docker Linux com FFmpeg, migrations na inicialização, execução do servidor como usuário node e armazenamento persistente para SQLite, autenticação e vídeos.
- Blueprint do Render com disco de 5 GB, verificação `/health` e deploys automáticos desligados.
- Domínio público configurável para cookies HTTPS, links de configuração/recuperação e validação de origem atrás do proxy da hospedagem.
- Publicação ainda depende de conta conectada, aprovação do custo e conferência do primeiro deploy. O acesso no Opera depende de validação pelo usuário com as credenciais atuais.

## 2026-09-17 — Correções de cadastro e recuperação de acesso

- Corrigido o formulário que exibia um cliente selecionado, mas enviava o nome vazio após o carregamento da página.
- Vínculo de projetos por ID do cliente, com nome e e-mail no seletor para distinguir cadastros de mesmo nome.
- Formulário aguarda o servidor, mantém os campos em caso de falha e impede envios durante o salvamento.
- Recuperação local por link secreto de uso único com validade de 30 minutos; preserva o editor e seus dados, rotaciona a senha e invalida as sessões anteriores.
- Testes de regressão para cadastro, seleção de cliente, recuperação, token inválido e revogação de sessões; modo isolado de conferência visual dos formulários.
- Validação: 20 testes aprovados, checagem integrada adicional de recuperação, lint e build de produção. No navegador: login, criação com cliente pré-selecionado e preservação dos campos após falha de conexão.

## 2026-09-16 — Fechamento funcional do MVP local

- Login real para um editor por instalação, configuração inicial protegida por código local, senha com scrypt, cookie assinado, expiração e logout.
- Proteção de páginas, APIs administrativas e URLs diretas de uploads. O link do cliente não concede acesso ao painel.
- Edição de nome, descrição e status do projeto, sem resolver solicitações automaticamente.
- Revisão pública com uma versão selecionada, comentários por versão e atualização de status.
- Captura da minutagem pelo player e navegação de volta ao trecho no painel e no link público.
- Validação de comentários e timestamps nas duas APIs, filtros de status e mensagens de erro inline.
- Progresso real a partir das solicitações resolvidas; remoção do fallback fictício para projeto inexistente.
- Mensagem do player inclui diagnóstico de configuração do navegador, após confirmação do problema de aceleração no Opera.
- Testes automatizados de autenticação, validações, progresso, codecs e fluxo integrado com banco isolado.
- Documentação de instalação, backup, testes, limites e próximos requisitos de hospedagem.

## Entrega anterior — Compatibilidade de vídeo

- Conversão de novos uploads para H.264/AAC e faststart, limite de 250 MB e reprodução por trechos.
- Testes com H.264, HEVC de 10 bits, VP9, ProRes e arquivos inválidos.

## Antes de uma publicação para clientes externos

- Escolher hospedagem e domínio/HTTPS com disco persistente ou armazenamento externo.
- Configurar backup, recuperação de acesso e limitação de abuso compartilhada.
- Avaliar autenticação gerenciada, múltiplos editores e revogação individual de sessões se o escopo crescer.
- Conferir o fluxo visual e reprodução nos navegadores/dispositivos do público-alvo.
