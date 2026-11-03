/**
 * Monitor virtual da página da aula.
 *
 * A página de apoio manda a dúvida do aluno para cá; este servidor chama a API da Anthropic com a
 * chave guardada na variável de ambiente ANTHROPIC_API_KEY (nunca no navegador) e devolve a resposta.
 *
 * Variáveis de ambiente (Vercel):
 * - ANTHROPIC_API_KEY  obrigatória; a chave da conta do Carlos em console.anthropic.com.
 * - AJUDA_MODELO       opcional; padrão claude-sonnet-5-5.
 * - AJUDA_SENHA        opcional; valor esperado no cabeçalho X-Aula (padrão oficina-0411).
 * - AJUDA_LIMITE_HORA  opcional; pedidos por IP por hora (padrão 30).
 */

import { CONTEXTO_AULA } from "@/lib/aula-contexto";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Aula",
  "Access-Control-Max-Age": "86400",
};

const MODELO = process.env.AJUDA_MODELO ?? "claude-sonnet-5-5";
const SENHA_AULA = process.env.AJUDA_SENHA ?? "oficina-0411";
const LIMITE_HORA = Number(process.env.AJUDA_LIMITE_HORA ?? 30);
const TAMANHO_MAXIMO_PERGUNTA = 2500;
const HISTORICO_MAXIMO = 8;

const INSTRUCOES = `Você é o monitor virtual da "Oficina de IA · Do problema à solução", uma aula de uma tarde em que donos de restaurante constroem um sistema de escala de funcionários com IA. Quem pergunta é um aluno, dono de restaurante, sem formação técnica, no meio da aula, com pressa.

Como responder:
- Português do Brasil, direto, sem jargão. No máximo 8 linhas. Procedimento vira lista numerada curta.
- Nomeie botões e menus exatamente como aparecem na tela (em inglês quando a tela é em inglês: Create repository, Deploy, Continue with GitHub).
- Se a pessoa colar um erro, diga em uma frase qual é a causa provável, em qual peça ou entrega ela está, e o que clicar ou colar em seguida.
- Use só o que está no contexto da aula abaixo. Se a dúvida sair do roteiro ou você não tiver certeza, diga isso em uma frase e oriente: "levante a mão que o Carlos vai até você".
- Lembre as regras da cota quando fizer sentido: uma correção por mensagem na IA, com o erro colado inteiro; duas correções sem resolver, levante a mão; ninguém mexe no esforço nem no modelo.
- Nunca peça nem repita chaves, senhas ou tokens. Se a pessoa colar uma Secret key, avise para não compartilhar e siga sem ela.
- Não escreva código novo nem prompts fora dos prompts da aula: se precisar de código, a pessoa pede ao Claude Code com uma correção única.
- Sem travessões; use vírgula, dois-pontos e ponto final.

Contexto da aula:
${CONTEXTO_AULA}`;

type Mensagem = { papel: "aluno" | "monitor"; texto: string };

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CORS },
  });
}

// Limite simples por IP, em memória (vale por instância; basta para uma turma).
const pedidosPorIp = new Map<string, number[]>();
function passouDoLimite(ip: string): boolean {
  const agora = Date.now();
  const recentes = (pedidosPorIp.get(ip) ?? []).filter((t) => agora - t < 60 * 60 * 1000);
  if (recentes.length >= LIMITE_HORA) {
    pedidosPorIp.set(ip, recentes);
    return true;
  }
  recentes.push(agora);
  pedidosPorIp.set(ip, recentes);
  return false;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  if ((request.headers.get("x-aula") ?? "") !== SENHA_AULA) {
    return json({ erro: "Este monitor só responde pela página da aula." }, 403);
  }

  const chave = process.env.ANTHROPIC_API_KEY;
  if (!chave) {
    return json({ erro: "ANTHROPIC_API_KEY não está configurada na Vercel. Levante a mão." }, 500);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
  if (passouDoLimite(ip)) {
    return json({ erro: "Muitas perguntas seguidas. Espere um pouco ou levante a mão." }, 429);
  }

  let corpo: { pergunta?: string; etapa?: string; historico?: Mensagem[] } = {};
  try {
    corpo = await request.json();
  } catch {
    return json({ erro: "Pedido inválido." }, 400);
  }

  const pergunta = (corpo.pergunta ?? "").toString().trim().slice(0, TAMANHO_MAXIMO_PERGUNTA);
  if (!pergunta) return json({ erro: "Escreva a dúvida ou cole o erro." }, 400);

  const etapa = (corpo.etapa ?? "").toString().trim().slice(0, 80);
  const historico = Array.isArray(corpo.historico)
    ? corpo.historico
        .filter((m) => m && (m.papel === "aluno" || m.papel === "monitor") && typeof m.texto === "string")
        .slice(-HISTORICO_MAXIMO)
    : [];

  const mensagens = [
    ...historico.map((m) => ({
      role: m.papel === "aluno" ? "user" : "assistant",
      content: m.texto.slice(0, TAMANHO_MAXIMO_PERGUNTA),
    })),
    {
      role: "user",
      content: etapa ? `[Etapa em que estou: ${etapa}]\n${pergunta}` : pergunta,
    },
  ];

  // Mensagens precisam alternar; se o histórico terminou em "aluno", junta com a pergunta atual.
  const alternadas: { role: string; content: string }[] = [];
  for (const m of mensagens) {
    const ultima = alternadas[alternadas.length - 1];
    if (ultima && ultima.role === m.role) ultima.content += "\n\n" + m.content;
    else alternadas.push({ ...m });
  }
  if (alternadas[0]?.role !== "user") alternadas.shift();

  try {
    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": chave,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 700,
        system: INSTRUCOES,
        messages: alternadas,
      }),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text().catch(() => "");
      console.error("Anthropic respondeu", resposta.status, detalhe.slice(0, 300));
      return json({ erro: "O monitor virtual não conseguiu responder agora. Levante a mão." }, 502);
    }

    const dados = (await resposta.json()) as { content?: { type: string; text?: string }[] };
    const texto = (dados.content ?? [])
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join("\n")
      .trim();

    return json({ resposta: texto || "Não consegui responder. Levante a mão." });
  } catch (erro) {
    console.error("Falha ao chamar a Anthropic", erro);
    return json({ erro: "O monitor virtual está fora do ar. Levante a mão." }, 502);
  }
}
