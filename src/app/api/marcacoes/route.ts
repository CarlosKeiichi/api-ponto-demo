import type { NextRequest } from "next/server";
import {
  dataValida,
  diasNoPeriodo,
  gerarMarcacoesDoDia,
  gerarMarcacoesDoPeriodo,
} from "@/lib/dados";
import { responderJson, responderOptions, verificarCredenciais } from "@/lib/auth";

const PERIODO_MAXIMO_DIAS = 31;

export async function GET(request: NextRequest) {
  const naoAutorizado = verificarCredenciais(request);
  if (naoAutorizado) return naoAutorizado;

  const params = request.nextUrl.searchParams;
  const data = params.get("data");
  const inicio = params.get("inicio");
  const fim = params.get("fim");

  if (data) {
    if (!dataValida(data)) {
      return responderJson({ erro: "Data inválida, use o formato YYYY-MM-DD" }, 400);
    }
    return responderJson(gerarMarcacoesDoDia(data));
  }

  if (inicio && fim) {
    if (!dataValida(inicio) || !dataValida(fim)) {
      return responderJson({ erro: "Data inválida, use o formato YYYY-MM-DD" }, 400);
    }
    const total = diasNoPeriodo(inicio, fim);
    if (total < 1) {
      return responderJson({ erro: "fim deve ser igual ou posterior a inicio" }, 400);
    }
    if (total > PERIODO_MAXIMO_DIAS) {
      return responderJson({ erro: "Período máximo de 31 dias" }, 400);
    }
    return responderJson(gerarMarcacoesDoPeriodo(inicio, fim));
  }

  return responderJson({ erro: "Informe data ou inicio e fim" }, 400);
}

export async function OPTIONS() {
  return responderOptions();
}
