import { FUNCIONARIOS } from "@/lib/dados";
import { responderJson, responderOptions, verificarCredenciais } from "@/lib/auth";

export async function GET(request: Request) {
  const naoAutorizado = verificarCredenciais(request);
  if (naoAutorizado) return naoAutorizado;

  return responderJson(FUNCIONARIOS);
}

export async function OPTIONS() {
  return responderOptions();
}
