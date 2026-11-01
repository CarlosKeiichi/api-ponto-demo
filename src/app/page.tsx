import {
  DIAS_SEMANA,
  ESCALA_SEMANAL,
  FUNCIONARIOS,
  RESTAURANTE,
  TURNOS,
  gerarMarcacoesDoDia,
  type Turno,
} from "@/lib/dados";
import { TOKEN } from "@/lib/auth";

const BASE_URL = "https://SEU-DOMINIO";
const DATA_EXEMPLO = "2026-11-20";

const NOME_TURNO: Record<Turno, string> = {
  almoco: "Almoço",
  jantar: "Jantar",
  inteiro: "Dia inteiro",
};

function Curl({ caminho }: { caminho: string }) {
  return (
    <pre>
      <code>{`curl -H "Authorization: Bearer ${TOKEN}" \\\n  "${BASE_URL}${caminho}"`}</code>
    </pre>
  );
}

function Json({ valor }: { valor: unknown }) {
  return (
    <pre>
      <code>{JSON.stringify(valor, null, 2)}</code>
    </pre>
  );
}

export default function Pagina() {
  const exemploFuncionarios = FUNCIONARIOS.slice(0, 2);
  const exemploMarcacoes = gerarMarcacoesDoDia(DATA_EXEMPLO).slice(0, 3);

  // Dias de abertura em ordem terça, quarta, ..., domingo.
  const diasAbertos = [2, 3, 4, 5, 6, 0];

  return (
    <main>
      <h1>API de ponto de demonstração · {RESTAURANTE}</h1>
      <p className="subtitulo">
        Dados fictícios de controle de ponto para uso em aula. Nenhuma pessoa ou empresa real.
      </p>

      <h2>O que é</h2>
      <p>
        Esta API simula o sistema de ponto do restaurante fictício <strong>{RESTAURANTE}</strong>,
        que abre de terça a domingo em dois turnos: Almoço ({TURNOS.almoco.inicio} às{" "}
        {TURNOS.almoco.fim}) e Jantar ({TURNOS.jantar.inicio} às {TURNOS.jantar.fim}). Segunda
        é folga coletiva e não tem marcações.
      </p>
      <p>
        Não existe banco de dados: as marcações são geradas na hora, a partir da data pedida, por
        uma função determinística. A mesma data sempre devolve exatamente o mesmo resultado, então
        todo mundo na aula vê os mesmos números.
      </p>

      <h2>Autenticação</h2>
      <p>
        Todas as rotas em <code>/api</code> exigem o cabeçalho abaixo. Sem ele, ou com token
        errado, a resposta é <code>401</code> com o corpo{" "}
        <code>{`{"erro":"Token inválido"}`}</code>.
      </p>
      <pre>
        <code>{`Authorization: Bearer ${TOKEN}`}</code>
      </pre>
      <p>
        As respostas liberam CORS (<code>Access-Control-Allow-Origin: *</code>), então dá para
        chamar direto do navegador, de planilhas, do n8n ou de qualquer ferramenta.
      </p>

      <h2>Endpoints</h2>

      <h3>GET /api/funcionarios</h3>
      <p>Lista os 8 funcionários cadastrados.</p>
      <Curl caminho="/api/funcionarios" />
      <p>Resposta (resumida aos dois primeiros):</p>
      <Json valor={exemploFuncionarios} />

      <h3>GET /api/marcacoes</h3>
      <p>Marcações de ponto de um dia ou de um período. Aceita duas formas de consulta:</p>
      <ul>
        <li>
          <code>?data=YYYY-MM-DD</code>: um único dia.
        </li>
        <li>
          <code>?inicio=YYYY-MM-DD&amp;fim=YYYY-MM-DD</code>: período inclusivo, no máximo 31
          dias.
        </li>
      </ul>
      <Curl caminho={`/api/marcacoes?data=${DATA_EXEMPLO}`} />
      <p>Resposta (resumida aos três primeiros registros):</p>
      <Json valor={exemploMarcacoes} />
      <p>Erros possíveis, sempre com status <code>400</code>:</p>
      <ul>
        <li>
          <code>{`{"erro":"Informe data ou inicio e fim"}`}</code> quando faltam parâmetros.
        </li>
        <li>
          <code>{`{"erro":"Período máximo de 31 dias"}`}</code> quando o período passa de 31
          dias.
        </li>
        <li>
          <code>{`{"erro":"Data inválida, use o formato YYYY-MM-DD"}`}</code> quando a data não
          existe ou está em outro formato.
        </li>
      </ul>

      <h2>Significado dos campos</h2>
      <dl>
        <dt>
          <code>cpf</code>
        </dt>
        <dd>CPF do funcionário, só números. Use-o para cruzar com a lista de funcionários.</dd>
        <dt>
          <code>data</code>
        </dt>
        <dd>Dia da marcação, no formato YYYY-MM-DD.</dd>
        <dt>
          <code>entrada</code>
        </dt>
        <dd>Primeira batida do dia, no formato <code>HH:MM</code>.</dd>
        <dt>
          <code>saida_intervalo</code> e <code>volta_intervalo</code>
        </dt>
        <dd>
          Saída e retorno do intervalo entre os turnos. Só existem para quem trabalha o dia
          inteiro; para quem faz um turno só, vêm como <code>null</code>.
        </dd>
        <dt>
          <code>saida</code>
        </dt>
        <dd>Última batida do dia, no formato <code>HH:MM</code>.</dd>
      </dl>
      <p>
        Cada objeto representa um funcionário que bateu ponto naquele dia. Quem faltou simplesmente
        não aparece na lista.
      </p>

      <h2>Escala semanal</h2>
      <p>
        A escala é fixa. Horários planejados de batida: entrada 5 minutos antes do turno e saída 5
        minutos depois (10:55 e 15:35 no almoço, 17:55 e 23:35 no jantar).
      </p>
      <table>
        <thead>
          <tr>
            <th>Funcionário</th>
            {diasAbertos.map((d) => (
              <th key={d}>{DIAS_SEMANA[d]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FUNCIONARIOS.map((f) => (
            <tr key={f.id}>
              <td>{f.nome}</td>
              {diasAbertos.map((d) => {
                const turno = ESCALA_SEMANAL[d][f.id];
                return <td key={d}>{turno ? NOME_TURNO[turno] : "Folga"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Situações plantadas</h2>
      <p>
        Em todo dia de funcionamento existem exatamente três situações para a turma encontrar,
        sempre em três pessoas diferentes, escolhidas de forma determinística a partir da data:
      </p>
      <ul>
        <li>
          <strong>Um atraso</strong>: entrada de 20 a 30 minutos depois do início do turno (por
          exemplo 11:25 ou 18:22).
        </li>
        <li>
          <strong>Uma falta</strong>: a pessoa estava escalada, mas não tem nenhum registro no dia.
        </li>
        <li>
          <strong>Uma hora extra</strong>: saída de 45 a 60 minutos depois do fim do turno. Para
          nunca passar da meia-noite, a hora extra cai sempre em alguém que encerra no almoço
          (saída por volta de 16:25).
        </li>
      </ul>
      <p>
        Todos os outros registros ficam dentro de 5 minutos do horário planejado. Como a geração
        é determinística, a mesma data sempre devolve as mesmas situações, nas mesmas pessoas.
      </p>

      <h2>Funcionários</h2>
      <table>
        <thead>
          <tr>
            <th>Id</th>
            <th>Nome</th>
            <th>Função</th>
            <th>CPF</th>
            <th>Telefone</th>
          </tr>
        </thead>
        <tbody>
          {FUNCIONARIOS.map((f) => (
            <tr key={f.id}>
              <td>
                <code>{f.id}</code>
              </td>
              <td>{f.nome}</td>
              <td>{f.funcao}</td>
              <td>
                <code>{f.cpf}</code>
              </td>
              <td>{f.telefone}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="aviso">
        Nomes, CPFs e telefones são inventados para fins didáticos e não correspondem a pessoas
        reais.
      </p>

      <footer>
        Troque <code>{BASE_URL}</code> nos exemplos pelo endereço onde a API está publicada (por
        exemplo <code>http://localhost:3000</code> em desenvolvimento).
      </footer>
    </main>
  );
}
