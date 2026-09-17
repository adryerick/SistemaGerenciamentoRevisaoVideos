# Histórico de entregas

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
