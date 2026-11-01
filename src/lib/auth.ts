/**
 * Autenticação com três credenciais fixas (fictícias, para a aula) e cabeçalhos CORS das rotas /api.
 *
 * Reproduz o que um fornecedor real costuma entregar no painel:
 * - Client ID: identifica a conta (qual restaurante). Vai no cabeçalho X-Client-Id.
 * - API Key: identifica o aplicativo que está chamando. Vai no cabeçalho X-Api-Key.
 * - API Secret: a senha desse aplicativo; só no servidor, nunca no navegador.
 *   Vai em Authorization: Bearer <secret>.
 */

export const CREDENCIAIS = {
  clientId: "vila-tempero",
  apiKey: "vt_key_aulao2026",
  apiSecret: "vt_secret_7f3a9c2e",
} as const;

export const CABECALHOS_CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Client-Id, X-Api-Key",
  "Access-Control-Max-Age": "86400",
};

/** Resposta JSON com CORS liberado. */
export function responderJson(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...CABECALHOS_CORS,
    },
  });
}

/** Resposta para o preflight (OPTIONS). Não exige credenciais. */
export function responderOptions(): Response {
  return new Response(null, { status: 204, headers: CABECALHOS_CORS });
}

/**
 * Confere as três credenciais. Retorna null se tudo estiver certo, ou a resposta 401 pronta,
 * dizendo qual credencial faltou ou está errada (ajuda a achar o erro em sala).
 */
export function verificarCredenciais(request: Request): Response | null {
  const clientId = request.headers.get("x-client-id")?.trim() ?? "";
  const apiKey = request.headers.get("x-api-key")?.trim() ?? "";
  const autorizacao = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(autorizacao);
  const secret = match ? match[1].trim() : "";

  if (!clientId) return responderJson({ erro: "Falta o cabeçalho X-Client-Id" }, 401);
  if (clientId !== CREDENCIAIS.clientId) return responderJson({ erro: "X-Client-Id inválido" }, 401);
  if (!apiKey) return responderJson({ erro: "Falta o cabeçalho X-Api-Key" }, 401);
  if (apiKey !== CREDENCIAIS.apiKey) return responderJson({ erro: "X-Api-Key inválida" }, 401);
  if (!secret) return responderJson({ erro: "Falta o cabeçalho Authorization: Bearer <API Secret>" }, 401);
  if (secret !== CREDENCIAIS.apiSecret) return responderJson({ erro: "API Secret inválido" }, 401);
  return null;
}

/** Mantido por compatibilidade com o nome antigo. */
export const verificarToken = verificarCredenciais;
