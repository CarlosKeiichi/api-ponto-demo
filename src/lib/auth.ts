/**
 * Autenticação por token fixo e cabeçalhos CORS das rotas /api.
 */

export const TOKEN = "DEMO-AULAO-2026";

export const CABECALHOS_CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
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

/** Resposta para o preflight (OPTIONS). Não exige token. */
export function responderOptions(): Response {
  return new Response(null, { status: 204, headers: CABECALHOS_CORS });
}

/**
 * Confere o cabeçalho `Authorization: Bearer <token>`.
 * Retorna null se estiver correto, ou a resposta 401 pronta para devolver.
 */
export function verificarToken(request: Request): Response | null {
  const cabecalho = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(cabecalho);
  if (!match || match[1].trim() !== TOKEN) {
    return responderJson({ erro: "Token inválido" }, 401);
  }
  return null;
}
