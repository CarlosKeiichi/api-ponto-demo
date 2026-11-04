/**
 * Contexto da Oficina de IA · Do problema à solução (04/11/2026) para o monitor virtual
 * da página da aula. Texto em português, condensado da página de apoio. Sem segredos.
 */

export const CONTEXTO_AULA = `
# A oficina
Donos de restaurante constroem, em uma tarde, um sistema de escala de funcionários no ar, usando
Claude Code na web (claude.ai/code) ou ChatGPT (Codex), um template pronto no GitHub, banco Supabase
e publicação na Vercel. Trabalham em duplas: piloto faz os passos, copiloto confere pela página e é a
reserva de cota. Quem trava: primeiro a dupla ajuda; se não resolver, levanta a mão e o Carlos vai até
a mesa. Não existem monitores humanos além do Carlos.

# Ordem das peças (Bloco 3, infraestrutura)
Peça 1 · GitHub: criar a conta (github.com/signup, código chega por e-mail, olhar o spam, Resend) e
criar a cópia do template pelo link direto github.com/new?template_owner=CarlosKeiichi&template_name=escala-template.
No formulário: ligar a chave "Include all branches" (traz as versões prontas entrega-1/2/3), nome
escala-nomedoseurestaurante (sem espaço nem acento), Public, Create repository. Depois Settings >
Collaborators > Add people para convidar a dupla. Plano B se o link não abrir: no repositório
github.com/CarlosKeiichi/escala-template, botão "Use this template" (linha de cima, ao lado de Star).
Peça 2 · Plugar o GitHub na IA. Claude: claude.ai > Configurações > (grupo Personalização) Conectores > buscar GitHub > item "Integração com o GitHub" (não os Plugins) > Conectar;
o GitHub pede para confirmar o e-mail e as permissões de repositório; escolher All repositories (ou
marcar o escala-...); depois em claude.ai/code escolher o repositório na lista. Não enviar mensagem
ainda (a cota começa a contar na primeira mensagem). ChatGPT (Codex): Configurações > Plugins > GitHub
> Conectar > entrar no GitHub e autorizar; depois escolher o escala-... no Codex.
Se o repositório não aparece na IA, nesta ordem: 1) github.com/apps/claude > Configure > All
repositories, voltar e recarregar; 2) conferir se o GitHub do navegador é a conta que criou o
repositório; 3) em 2 minutos sem resolver, a dupla assume: cria a cópia do template na conta dela e
adiciona a pessoa como colaboradora. Zip não é plano B: a IA e a Vercel trabalham a partir do GitHub.
Peça 3 · Supabase: supabase.com/dashboard > Continue with GitHub > Authorize. New project: nome escala,
Generate a password (guardar), região South America (São Paulo), Create new project (1 a 2 minutos).
Depois SQL Editor: colar o conteúdo de supabase/schema.sql (está na página com botão Copiar) e Run;
esperar "Success" (se aparecer aviso de snippets, clicar Understood). Organização na primeira vez: nome,
Personal, Free, Create organization. No New project, Security: deixar Enable Data API e Automatically expose
new tables marcadas (RLS automático pode ficar desmarcado; o SQL já liga). Botão Connect (topo) > Framework
Next.js > aba .env.local: copiar as duas linhas prontas NEXT_PUBLIC_SUPABASE_URL e
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Plano B da chave: Settings > API Keys > Publishable (sb_publishable_).
Guardar as duas num bloco de notas. Projeto grátis pausa após 7 dias sem
uso: Restore project. Se aparecer "Paused", restaurar.
Peça 4 · Vercel: vercel.com/signup > Hobby > nome > Continue with GitHub > Authorize Vercel. Depois
vercel.com/new > Add New > Project > Import no repositório escala-... > Environment Variables: colar no
campo Key as duas linhas do bloco de notas (a Vercel separa nome e valor) > botão Create Project (em
algumas contas, Deploy). O nome antigo NEXT_PUBLIC_SUPABASE_ANON_KEY também funciona no lugar de
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; o sistema aceita os dois
(1 a 2 minutos) > abrir o link escala-xxx.vercel.app. Deu certo quando a tela diz "Banco conectado.
8 funcionários e 2 turnos cadastrados". Repositório não aparece na importação: clicar em Adjust GitHub
App Permissions (ou Install) e incluir o escala-.... "Variáveis não configuradas": nome da variável com
espaço ou letra errada; apagar, colar de novo e Redeploy. "Tabelas não responderam": o SQL não rodou;
voltar ao Supabase e rodar o schema.sql.

# Entregas (Blocos 4 a 7), sempre no Claude Code ou no Codex
Regra de ouro: uma sessão nova para cada prompt numerado; cole o prompt inteiro; a IA mostra um plano
antes; a pessoa lê e responde "pode fazer". A IA escreve, testa, faz commit e push direto na branch
main; a Vercel publica sozinha em 1 a 2 minutos. Testar no notebook, no link da Vercel. Hoje a aula é toda no computador, sem celular.
Entrega 1 · Prompt 1: a escala da semana com os turnos (Almoço e Jantar), funções e funcionários de
exemplo que já estão no banco; a pessoa troca só o [nome do restaurante]. Teste guiado: na Escala,
hoje, Almoço: Ana Souza, Bruno Lima, Carla Mendes e Diego Alves; sábado, Jantar: Ana, Elaine e Gabriela
no salão, Bruno e Diego na cozinha. Cadastro de pessoas na aula só com nomes fictícios.
Entrega 2 · Prompt 2: regras de exemplo (Jantar de sexta e sábado: 3 no Salão e 2 na Cozinha; demais
turnos 2 e 1; 1 folga por semana; ninguém fecha e abre no dia seguinte) com alertas na escala; teste:
tirar a Gabriela do sábado e ver o alerta. Prompt 3: identidade visual (nome, logo em jpg ou png, cores)
em src/config/identidade.ts.
Entrega 3 · Prompt 4: tela "Conferência do dia" cruzando a escala com a API de ponto de demonstração
(Vila Tempero). Na Vercel, quatro variáveis de ambiente: PONTO_API_URL=https://api-ponto-demo.vercel.app,
PONTO_CLIENT_ID=vila-tempero, PONTO_API_KEY=vt_key_aulao2026, PONTO_API_SECRET=vt_secret_7f3a9c2e
(credenciais fictícias da aula). Depois Redeploy. A chamada à API é feita no servidor (route handler),
nunca no navegador. A API não responde a partir do Claude Code (a rede dele não alcança a internet):
isso não é erro no código; confiar em docs/api-ponto.md e docs/marcacoes-exemplo.json. Conferência de
04/11: Ana atrasada, Diego faltou, Carla hora extra, Fábio e Henrique não escalados.
Bloco 7 · Prompt 5: revisão (onde ficam os dados, nenhuma chave no código, o que falta para proteger).
Instant Rollback na Vercel para voltar uma versão. Plano B de qualquer entrega: branch pronta
entrega-1, entrega-2 ou entrega-3: no GitHub, Pull requests > New pull request, base main, compare
entrega-N > Create pull request > Merge > Confirm merge; a Vercel publica em 1 a 2 minutos.

# Regras da cota (Claude Pro)
Cota compartilhada entre chat e Claude Code, janela de 5 horas. Nada de Claude nas 5 horas antes da
aula; durante a aula só os prompts da aula; sessão nova por prompt numerado; sempre pedir o plano antes;
uma correção por mensagem, com o erro colado inteiro ("Ao abrir a tela X, aparece este erro: [erro].
Corrija só isso."); duas correções sem resolver: pedir ajuda à dupla e, se não resolver, levantar a mão;
nada fora do roteiro até o fim (ideias extras vão para a lista de casa); ninguém mexe no esforço ou no
modelo (usa o que vier selecionado).

# Segurança
Chaves e senhas nunca vão no código nem no chat: ficam em variáveis de ambiente na Vercel. A chave
Publishable do Supabase (sb_publishable_...) pode ir na Vercel como NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou ANON_KEY); a
Secret nunca. O repositório é público e não há segredo no código.

# Erros frequentes e respostas
- Código do GitHub não chega: esperar 1 minuto, olhar o spam, Resend. Nome de usuário já existe:
  acrescentar o nome do restaurante. "Your account has been flagged": criar a conta pelo 4G do
  celular (compartilhar internet com o notebook) e avisar o Carlos (ele tem conta reserva).
- Link direto do template abre sem o template selecionado: a pessoa não estava logada no GitHub.
- Template sem as branches entrega-1/2/3: a chave Include all branches ficou desligada; criar outra
  cópia com a chave ligada ou seguir sem plano B de branch.
- Supabase (ou Vercel) não abre, trava ou os botões somem: tradução automática do navegador ligada. No Chrome,
  ícone de tradução na barra de endereço, "Mostrar original" ou "Nunca traduzir este site".
- Supabase "Paused": Restore project. SQL com erro: apagar tudo no editor, colar o schema.sql de novo
  e Run. Chave errada: usar a Publishable (sb_publishable_), não a Secret.
- Vercel build falhou: abrir o log, copiar o erro inteiro e colar no Claude Code como uma correção
  única. Se persistir, puxar a branch pronta.
- Claude Code pede para aprovar o plano: responder "pode fazer". Claude Code sem o repositório: ver a
  Peça 2. Cota acabou: a dupla assume no mesmo repositório (ela é colaboradora).
`;
