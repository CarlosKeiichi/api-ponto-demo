/**
 * Gerador de dados fictícios de ponto do restaurante Vila Tempero.
 *
 * Tudo aqui é função pura: não há banco, arquivo, rede nem Math.random.
 * A mesma data sempre produz exatamente a mesma saída, porque todas as
 * escolhas (quem atrasou, quem faltou, quem fez hora extra, os minutos de
 * variação de cada batida) derivam de um hash determinístico da data.
 */

export type Funcao = "Salão" | "Cozinha" | "Caixa" | "Bar" | "Entregador";

export interface Funcionario {
  id: string;
  nome: string;
  cpf: string;
  funcao: Funcao;
  telefone: string;
}

/** Turno escalado para o dia: só almoço, só jantar ou o dia inteiro (os dois). */
export type Turno = "almoco" | "jantar" | "inteiro";

export interface Marcacao {
  cpf: string;
  data: string;
  entrada: string | null;
  saida_intervalo: string | null;
  volta_intervalo: string | null;
  saida: string | null;
}

export interface Escalado {
  funcionario: Funcionario;
  turno: Turno;
}

export interface SituacoesDoDia {
  /** Entrada 20 a 30 minutos depois do início do turno. */
  atrasado: Funcionario | null;
  /** Sem nenhum registro no dia. */
  faltou: Funcionario | null;
  /** Saída 45 a 60 minutos depois do fim do turno (ou 23:59 se o turno termina à noite). */
  horaExtra: Funcionario | null;
  /** true quando a hora extra caiu em quem encerra no jantar e a saída foi limitada a 23:59. */
  horaExtraLimitada: boolean;
}

export const RESTAURANTE = "Vila Tempero";

export const TURNOS = {
  almoco: { nome: "Almoço", inicio: "11:00", fim: "15:30" },
  jantar: { nome: "Jantar", inicio: "18:00", fim: "23:30" },
} as const;

/** Horários planejados de batida (5 minutos de folga em relação ao turno). */
const PLANEJADO = {
  entradaAlmoco: "10:55",
  saidaAlmoco: "15:35",
  entradaJantar: "17:55",
  saidaJantar: "23:35",
} as const;

/** Variação máxima, em minutos, para quem está em situação normal. */
const JITTER_MINUTOS = 5;

export const FUNCIONARIOS: Funcionario[] = [
  { id: "f01", nome: "Ana Souza", cpf: "12345678901", funcao: "Salão", telefone: "(11) 91234-0001" },
  { id: "f02", nome: "Bruno Lima", cpf: "23456789012", funcao: "Cozinha", telefone: "(11) 91234-0002" },
  { id: "f03", nome: "Carla Mendes", cpf: "34567890123", funcao: "Caixa", telefone: "(11) 91234-0003" },
  { id: "f04", nome: "Diego Alves", cpf: "45678901234", funcao: "Cozinha", telefone: "(11) 91234-0004" },
  { id: "f05", nome: "Elaine Costa", cpf: "56789012345", funcao: "Salão", telefone: "(11) 91234-0005" },
  { id: "f06", nome: "Fábio Rocha", cpf: "67890123456", funcao: "Bar", telefone: "(11) 91234-0006" },
  { id: "f07", nome: "Gabriela Nunes", cpf: "78901234567", funcao: "Salão", telefone: "(11) 91234-0007" },
  { id: "f08", nome: "Henrique Dias", cpf: "89012345678", funcao: "Entregador", telefone: "(11) 91234-0008" },
];

const ESCALA_TER_QUI: Record<string, Turno> = {
  f01: "inteiro",
  f02: "inteiro",
  f03: "almoco",
  f04: "jantar",
  f06: "jantar",
  f08: "jantar",
};

const ESCALA_SEX_SAB: Record<string, Turno> = {
  f01: "jantar",
  f02: "inteiro",
  f03: "almoco",
  f04: "inteiro",
  f05: "jantar",
  f06: "jantar",
  f07: "inteiro",
  f08: "jantar",
};

const ESCALA_DOM: Record<string, Turno> = {
  f01: "almoco",
  f03: "almoco",
  f04: "almoco",
  f05: "inteiro",
  f07: "almoco",
  f08: "almoco",
};

/** Escala semanal fixa, indexada por dia da semana (0 = domingo ... 6 = sábado). Segunda fechado. */
export const ESCALA_SEMANAL: Record<number, Record<string, Turno>> = {
  0: ESCALA_DOM,
  1: {},
  2: ESCALA_TER_QUI,
  3: ESCALA_TER_QUI,
  4: ESCALA_TER_QUI,
  5: ESCALA_SEX_SAB,
  6: ESCALA_SEX_SAB,
};

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

// ---------------------------------------------------------------------------
// Hash determinístico
// ---------------------------------------------------------------------------

/** FNV-1a 32 bits com mistura final (fmix32 do Murmur3) para espalhar bem os bits baixos. */
function hash32(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Inteiro determinístico no intervalo [min, max], derivado da semente. */
function inteiroEntre(semente: string, min: number, max: number): number {
  return min + (hash32(semente) % (max - min + 1));
}

/** Escolhe um item da lista de forma determinística a partir da semente. */
function escolher<T>(semente: string, lista: T[]): T {
  return lista[hash32(semente) % lista.length];
}

// ---------------------------------------------------------------------------
// Datas e horários
// ---------------------------------------------------------------------------

const REGEX_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

function paraUtc(data: string): Date | null {
  const m = REGEX_DATA.exec(data);
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) {
    return null;
  }
  return d;
}

/** true se a string é uma data real no formato YYYY-MM-DD. */
export function dataValida(data: string): boolean {
  return paraUtc(data) !== null;
}

function formatarData(d: Date): string {
  const ano = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(d.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Dia da semana (0 = domingo ... 6 = sábado). Lança erro se a data for inválida. */
export function diaDaSemana(data: string): number {
  const d = paraUtc(data);
  if (!d) throw new Error(`Data inválida: ${data}`);
  return d.getUTCDay();
}

export function adicionarDias(data: string, dias: number): string {
  const d = paraUtc(data);
  if (!d) throw new Error(`Data inválida: ${data}`);
  d.setUTCDate(d.getUTCDate() + dias);
  return formatarData(d);
}

/** Quantidade de dias do período, contando inicio e fim (inclusivo). */
export function diasNoPeriodo(inicio: string, fim: string): number {
  const a = paraUtc(inicio);
  const b = paraUtc(fim);
  if (!a || !b) throw new Error("Data inválida");
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function paraHora(minutos: number): string {
  const limitado = Math.max(0, Math.min(23 * 60 + 59, minutos));
  const h = String(Math.floor(limitado / 60)).padStart(2, "0");
  const m = String(limitado % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// ---------------------------------------------------------------------------
// Escala e situações plantadas
// ---------------------------------------------------------------------------

/** Quem trabalha na data e em qual turno, na ordem dos ids (f01, f02, ...). Vazio se fechado. */
export function escalaDoDia(data: string): Escalado[] {
  const escala = ESCALA_SEMANAL[diaDaSemana(data)] ?? {};
  return FUNCIONARIOS.filter((f) => f.id in escala).map((f) => ({
    funcionario: f,
    turno: escala[f.id],
  }));
}

/**
 * Sorteia (deterministicamente) as três situações do dia entre quem está escalado.
 *
 * Ordem: primeiro a hora extra, preferindo quem encerra no almoço para que a
 * saída estendida nunca passe da meia-noite; depois o atraso; depois a falta.
 * As três pessoas são sempre distintas.
 */
export function situacoesDoDia(data: string): SituacoesDoDia {
  const escala = escalaDoDia(data);
  if (escala.length === 0) {
    return { atrasado: null, faltou: null, horaExtra: null, horaExtraLimitada: false };
  }

  const soAlmoco = escala.filter((e) => e.turno === "almoco");
  const candidatosExtra = soAlmoco.length > 0 ? soAlmoco : escala;
  const horaExtra = escolher(`${data}|hora-extra`, candidatosExtra);

  const semExtra = escala.filter((e) => e !== horaExtra);
  const atrasado = escolher(`${data}|atrasado`, semExtra);

  const semExtraNemAtraso = semExtra.filter((e) => e !== atrasado);
  const faltou = escolher(`${data}|faltou`, semExtraNemAtraso);

  return {
    atrasado: atrasado.funcionario,
    faltou: faltou.funcionario,
    horaExtra: horaExtra.funcionario,
    horaExtraLimitada: horaExtra.turno !== "almoco",
  };
}

// ---------------------------------------------------------------------------
// Marcações
// ---------------------------------------------------------------------------

/** Marcações de um dia. Quem faltou não aparece. Segunda (fechado) retorna []. */
export function gerarMarcacoesDoDia(data: string): Marcacao[] {
  const escala = escalaDoDia(data);
  if (escala.length === 0) return [];

  const situacoes = situacoesDoDia(data);
  const marcacoes: Marcacao[] = [];

  for (const { funcionario, turno } of escala) {
    if (funcionario.id === situacoes.faltou?.id) continue;

    const comJitter = (campo: string, planejado: string): string =>
      paraHora(
        paraMinutos(planejado) +
          inteiroEntre(`${data}|${funcionario.cpf}|${campo}`, -JITTER_MINUTOS, JITTER_MINUTOS),
      );

    let entrada: string;
    let saidaIntervalo: string | null = null;
    let voltaIntervalo: string | null = null;
    let saida: string;

    if (turno === "inteiro") {
      entrada = comJitter("entrada", PLANEJADO.entradaAlmoco);
      saidaIntervalo = comJitter("saida_intervalo", PLANEJADO.saidaAlmoco);
      voltaIntervalo = comJitter("volta_intervalo", PLANEJADO.entradaJantar);
      saida = comJitter("saida", PLANEJADO.saidaJantar);
    } else if (turno === "almoco") {
      entrada = comJitter("entrada", PLANEJADO.entradaAlmoco);
      saida = comJitter("saida", PLANEJADO.saidaAlmoco);
    } else {
      entrada = comJitter("entrada", PLANEJADO.entradaJantar);
      saida = comJitter("saida", PLANEJADO.saidaJantar);
    }

    if (funcionario.id === situacoes.atrasado?.id) {
      const inicioTurno = turno === "jantar" ? TURNOS.jantar.inicio : TURNOS.almoco.inicio;
      entrada = paraHora(
        paraMinutos(inicioTurno) + inteiroEntre(`${data}|${funcionario.cpf}|atraso`, 20, 30),
      );
    }

    if (funcionario.id === situacoes.horaExtra?.id) {
      if (turno === "almoco") {
        saida = paraHora(
          paraMinutos(TURNOS.almoco.fim) +
            inteiroEntre(`${data}|${funcionario.cpf}|hora-extra`, 45, 60),
        );
      } else {
        // Turno termina 23:30; 45 a 60 minutos depois cruzaria a meia-noite, então limita a 23:59.
        saida = "23:59";
      }
    }

    marcacoes.push({
      cpf: funcionario.cpf,
      data,
      entrada,
      saida_intervalo: saidaIntervalo,
      volta_intervalo: voltaIntervalo,
      saida,
    });
  }

  return marcacoes;
}

/** Marcações de todos os dias do período (inclusivo), em ordem de data e de id. */
export function gerarMarcacoesDoPeriodo(inicio: string, fim: string): Marcacao[] {
  const total = diasNoPeriodo(inicio, fim);
  const marcacoes: Marcacao[] = [];
  for (let i = 0; i < total; i++) {
    marcacoes.push(...gerarMarcacoesDoDia(adicionarDias(inicio, i)));
  }
  return marcacoes;
}
