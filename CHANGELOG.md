# Histórico de entregas

## 2026-09-18 — Revisão final de usabilidade e validação

- Cadastro e edição de clientes aguardam a confirmação, bloqueiam envios repetidos e preservam os campos em falhas, com mensagem no formulário.
- API de clientes valida JSON, nome e e-mail sem gerar erro interno para entradas inválidas.
- Editor adaptado para celular com navegação horizontal, filtros flexíveis, tabela rolável e modais limitados à altura da tela.
- Seleção de versão válida após o primeiro upload em segundo plano ou remoção de uma versão.
- Revisão ainda sem vídeo acompanha novidades e permite verificar a chegada da primeira versão.
- Campo de revisão mostra o endereço completo para copiar manualmente; orientação específica para endereço local e sessão expirada.
- Vídeo público reutiliza a validação de caminho por projeto e a mesma transmissão parcial do editor.
- Modo `--check-empty-review` cria uma instalação descartável para testar o primeiro upload visualmente.
- Validação: 34 testes aprovados em produção, lint e build; regressões de entradas inválidas de clientes, seleção de versão e chegada do primeiro vídeo.

## 2026-09-17 — Prévia visual dos projetos

- Cartões de projetos e dashboard mostram uma miniatura real da versão mais recente, sem transmitir o vídeo inteiro.
- Miniaturas JPEG leves, geradas sob demanda para vídeos novos ou já existentes, com fallback para clips curtos.
- Cache privado derivado e API protegida pela sessão e propriedade do projeto; sem migração do banco.
- Clique na prévia abre os detalhes; projetos sem vídeo e falhas de imagem têm indicação própria.
- Testes de seleção da última versão, caminho seguro, JPEG, cache e acesso negado sem sessão ou fora do projeto.
- Validação: 31 testes aprovados em produção, lint e build; imagem carregada nos cartões de Projetos e Dashboard em instalação isolada, console sem erros.

## 2026-09-17 — Fechamento das melhorias de experiência do MVP

- Comparação lado a lado em editor e cliente; troca de versão mantém o instante e limita vídeos mais curtos ao final.
- Prioridades e checklist persistidos no banco, ordenação de ajustes em aberto e filtros por prioridade/status.
- Alertas dentro do site para novidades em versões, respostas e status, com consulta somente em páginas visíveis.
- Fila durável de conversão com worker único, limite de três envios ativos, estado de preparo, falhas, novas tentativas e descarte.
- Recebimento confirmado antes da conversão; editor pode sair da página após a confirmação. Versão só aparece ao terminar.
- Backups SQLite consistentes, vídeos, autenticação e originais da fila; cópias manuais ou diárias com manifesto de completude.
- Compartilhamento e contêiner iniciam o worker; diretório privado persistente separado dos arquivos públicos.
- Testes de fila real, retomada, falhas, prioridades, alertas, permissões e integridade do backup com dados isolados.
- Hospedagem permanente e endereço estável continuam fora do Quick Tunnel temporário escolhido para a apresentação.
- Validação: 29 testes aprovados em produção, build e lint; sincronização visual dos dois players, troca de versão preservando 00:01 e console sem erros.

## 2026-09-17 — Conversas, aprovação e linha do tempo

- Editor e cliente podem responder a cada solicitação, sem misturar a conversa com novos ajustes.
- Nome opcional do cliente em comentários, respostas e aprovação; papel do editor definido pela sessão, não pelo formulário.
- Aprovação registrada por versão e permitida somente na última versão, sem solicitações em aberto nela. Não conclui automaticamente o projeto.
- Novo upload começa em revisão; novos ajustes e reabertura de solicitações invalidam a aprovação da versão afetada.
- Marcadores numerados e clicáveis no player, com minutagem, cores por status e botões alternativos para instantes sobrepostos.
- Migration aditiva preserva os dados existentes; testes integrados usam banco e vídeos isolados.
- Identidade informada pelo link não é verificada; aprovação não equivale a assinatura digital.
- Validação: 26 testes aprovados em produção, build e lint; conferência visual do marcador em 00:01 e envio de resposta em base isolada.

## 2026-09-17 — Captura de minutagem na revisão do cliente

- Player consulta o estado nativo do vídeo e acompanha metadados, reprodução e recarregamento, em vez de depender exclusivamente do primeiro evento loadedmetadata.
- Vídeos em cache ou carregados antes da hidratação não deixam o botão de marcar permanentemente bloqueado.
- Clique pausa o vídeo, captura o instante real e leva ao comentário; antes dos metadados, exibe uma orientação de carregamento.
- Testes de captura em zero e em instante fracionário, estado carregado em cache e remoção das assinaturas de eventos.
- Conferência visual em produção isolada: instante 00:01 preenchido, vídeo pausado, foco no comentário e botão funcional após recarregar; console sem erros.

## 2026-09-17 — Correção do upload e experiência de revisão

- Reproduzido o erro de envio incompleto com MP4 acima de 10 MB; identificado o truncamento padrão do corpo no Next Proxy.
- Buffer de 260 MB para o limite de 250 MB com envelope multipart; validação antecipada de Content-Length excessivo.
- Progresso real do transporte, etapa de preparação, confirmação de publicação e mensagens de sessão, conexão, timeout e recusa de tamanho pelo gateway.
- Arquivo selecionado preservado em falhas; orientação para arquivos grandes no compartilhamento gratuito.
- Revisão responsiva com vídeo e formulário lado a lado no desktop, filtros por status e contagem de solicitações resolvidas.
- Rascunhos locais separados por link e versão, restauração sem conflito de hidratação e limpeza após envio confirmado.
- Player com indicação de carregamento do trecho e botão de nova tentativa em falhas.
- Corrigida também a reprodução do editor em produção: vídeos enviados após o build são servidos por API autenticada com suporte a Range, sem depender do inventário estático da pasta public.
- Regressão integrada com upload real acima de 10 MB, conversão e leitura parcial; modo isolado de conferência visual com duas versões e execução de testes em produção.
- Validação final: 21 testes aprovados também em produção, checagem integrada de recuperação, lint e build. Conferência no navegador: rascunho restaurado, isolamento entre versões, comentário enviado e filtro de resolvidos; nenhum erro no console.

## 2026-09-17 — Compartilhamento gratuito do MVP

- Comando `npm run share` compila uma versão de produção separada, inicia na porta 3001 e gera um link HTTPS com Cloudflare Quick Tunnel.
- Domínio temporário configurado automaticamente para login, cookies e validação de origem; redirecionamentos usam o endereço público.
- Encerramento limitado aos processos criados pelo comando; mantém o desenvolvimento local na porta 3000.
- Documentação de uso, endereço temporário e necessidade de manter o computador ligado. Nenhum plano de hospedagem pago foi contratado.
- Conferência pelo endereço público: login e health check HTTP 200, API privada sem sessão HTTP 401 e envio de origem externa HTTP 403. Build e lint aprovados.

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
