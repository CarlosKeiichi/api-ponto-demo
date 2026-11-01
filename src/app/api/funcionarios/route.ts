import { FUNCIONARIOS } from "@/lib/dados";
import { responderJson, responderOptions, verificarToken } from "@/lib/auth";

export async function GET(request: Request) {
  const naoAutorizado = verificarToken(request);
  if (naoAutorizado) return naoAutorizado;

  return responderJson(FUNCIONARIOS);
}

export async function OPTIONS() {
  return responderOptions();
}
