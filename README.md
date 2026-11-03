# API de ponto de demonstração · Vila Tempero

API fictícia de controle de ponto, feita para uso em aula com donos e gestores de restaurante. Simula o sistema de ponto do restaurante inventado **Vila Tempero**, que abre de terça a domingo em dois turnos (Almoço 11:00 às 15:30, Jantar 18:00 às 23:30). Segunda é folga coletiva.

Não existe banco de dados. As marcações são geradas na hora por uma função determinística a partir da data pedida: a mesma data sempre devolve o mesmo resultado, então toda a turma vê os mesmos números.

Nomes, CPFs e telefones são inventados e não correspondem a pessoas reais.

## Como rodar localmente

Pré-requisito: Node.js 20 ou mais recente.

```bash
npm install
npm run dev
```

Abra http://localhost:3000. A página inicial documenta a API; as rotas ficam em `/api/...`.

Para testar a build de produção:

```bash
npm run build
npm run start
```

## Como publicar na Vercel

1. Suba este repositório para o GitHub (ou GitLab/Bitbucket).
2. Na Vercel, clique em **Add New Project**, importe o repositório e confirme. O framework Next.js é detectado automaticamente.
3. Não é preciso configurar nenhuma variável de ambiente.
4. Ao terminar, a Vercel entrega uma URL do tipo `https://seu-projeto.vercel.app`. Use essa URL no lugar de `https://SEU-DOMINIO` nos exemplos abaixo.

## Autenticação

Como num fornecedor de verdade, todas as rotas em `/api` exigem três credenciais (fictícias, só para a aula):

| Credencial | O que identifica | Onde vai | Valor |
| --- | --- | --- | --- |
| Client ID | A conta (qual restaurante) | cabeçalho `X-Client-Id` | `vila-tempero` |
| API Key | O aplicativo que chama (identificação pública) | cabeçalho `X-Api-Key` | `vt_key_aulao2026` |
| API Secret | A senha do aplicativo (só no servidor) | `Authorization: Bearer` | `vt_secret_7f3a9c2e` |

```
X-Client-Id: vila-tempero
X-Api-Key: vt_key_aulao2026
Authorization: Bearer vt_secret_7f3a9c2e
```

Se uma credencial faltar ou estiver errada, a resposta é `401` e o corpo diz qual foi, por exemplo `{"erro":"X-Api-Key inválida"}`.

Todas as respostas da API liberam CORS (`Access-Control-Allow-Origin: *`, métodos GET e OPTIONS, cabeçalhos Authorization, X-Client-Id e X-Api-Key), então dá para chamar direto do navegador, de planilhas, do n8n ou de qualquer ferramenta.

## Endpoints

### GET /api/funcionarios

Lista os 8 funcionários.

```bash
curl -H "X-Client-Id: vila-tempero" -H "X-Api-Key: vt_key_aulao2026" \
  -H "Authorization: Bearer vt_secret_7f3a9c2e" \
  "https://SEU-DOMINIO/api/funcionarios"
```

Resposta (resumida):

```json
[
  {
    "id": "f01",
    "nome": "Ana Souza",
    "cpf": "12345678901",
    "funcao": "Salão",
    "telefone": "(11) 91234-0001"
  },
  {
    "id": "f02",
    "nome": "Bruno Lima",
    "cpf": "23456789012",
    "funcao": "Cozinha",
    "telefone": "(11) 91234-0002"
  }
]
```

### GET /api/marcacoes

Marcações de ponto de um dia ou de um período.

- `?data=YYYY-MM-DD`: um único dia.
- `?inicio=YYYY-MM-DD&fim=YYYY-MM-DD`: período inclusivo, no máximo 31 dias.

```bash
curl -H "X-Client-Id: vila-tempero" -H "X-Api-Key: vt_key_aulao2026" \
  -H "Authorization: Bearer vt_secret_7f3a9c2e" \
  "https://SEU-DOMINIO/api/marcacoes?data=2026-11-04"

curl -H "X-Client-Id: vila-tempero" -H "X-Api-Key: vt_key_aulao2026" \
  -H "Authorization: Bearer vt_secret_7f3a9c2e" \
  "https://SEU-DOMINIO/api/marcacoes?inicio=2026-11-01&fim=2026-11-30"
```

Resposta (resumida):

```json
[
  {
    "cpf": "23456789012",
    "data": "2026-11-20",
    "entrada": "10:52",
    "saida_intervalo": "15:34",
    "volta_intervalo": "17:55",
    "saida": "23:35"
  },
  {
    "cpf": "34567890123",
    "data": "2026-11-20",
    "entrada": "10:59",
    "saida_intervalo": null,
    "volta_intervalo": null,
    "saida": "16:21"
  }
]
```

Erros, sempre com status `400`:

| Situação | Corpo |
| --- | --- |
| Faltam parâmetros | `{"erro":"Informe data ou inicio e fim"}` |
| Período maior que 31 dias | `{"erro":"Período máximo de 31 dias"}` |
| Data inexistente ou fora do formato | `{"erro":"Data inválida, use o formato YYYY-MM-DD"}` |
| `fim` anterior a `inicio` | `{"erro":"fim deve ser igual ou posterior a inicio"}` |

### Campos de uma marcação

| Campo | Significado |
| --- | --- |
| `cpf` | CPF do funcionário, só números. Serve para cruzar com `/api/funcionarios`. |
| `data` | Dia da marcação, YYYY-MM-DD. |
| `entrada` | Primeira batida do dia, "HH:MM". |
| `saida_intervalo` | Saída para o intervalo entre turnos. Só para quem trabalha o dia inteiro; senão `null`. |
| `volta_intervalo` | Retorno do intervalo. Só para quem trabalha o dia inteiro; senão `null`. |
| `saida` | Última batida do dia, "HH:MM". |

Cada objeto é um funcionário que bateu ponto naquele dia. Quem faltou não aparece. Segunda devolve lista vazia.

## Escala semanal

Horários planejados de batida: entrada 5 minutos antes do turno e saída 5 minutos depois (10:55 e 15:35 no almoço, 17:55 e 23:35 no jantar). "Dia inteiro" é almoço mais jantar, com saída e volta do intervalo.

| Id | Nome | Função | Terça a quinta | Sexta e sábado | Domingo |
| --- | --- | --- | --- | --- | --- |
| f01 | Ana Souza | Salão | Dia inteiro | Jantar | Almoço |
| f02 | Bruno Lima | Cozinha | Dia inteiro | Dia inteiro | Folga |
| f03 | Carla Mendes | Caixa | Almoço | Almoço | Almoço |
| f04 | Diego Alves | Cozinha | Jantar | Dia inteiro | Almoço |
| f05 | Elaine Costa | Salão | Folga | Jantar | Dia inteiro |
| f06 | Fábio Rocha | Bar | Jantar | Jantar | Folga |
| f07 | Gabriela Nunes | Salão | Folga | Dia inteiro | Almoço |
| f08 | Henrique Dias | Entregador | Jantar | Jantar | Almoço |

## Situações plantadas

Em todo dia de funcionamento existem exatamente três situações, sempre em três pessoas diferentes, escolhidas de forma determinística a partir da data:

- **Um atraso**: entrada de 20 a 30 minutos depois do início do turno (por exemplo 11:25 ou 18:22).
- **Uma falta**: a pessoa estava escalada, mas não tem nenhum registro no dia.
- **Uma hora extra**: saída de 45 a 60 minutos depois do fim do turno. Para nunca passar da meia-noite, a hora extra cai sempre em alguém que encerra no almoço (saída por volta de 16:25).

Todos os outros registros ficam dentro de 5 minutos do horário planejado.

## Funcionários

| Id | Nome | Função | CPF | Telefone |
| --- | --- | --- | --- | --- |
| f01 | Ana Souza | Salão | 12345678901 | (11) 91234-0001 |
| f02 | Bruno Lima | Cozinha | 23456789012 | (11) 91234-0002 |
| f03 | Carla Mendes | Caixa | 34567890123 | (11) 91234-0003 |
| f04 | Diego Alves | Cozinha | 45678901234 | (11) 91234-0004 |
| f05 | Elaine Costa | Salão | 56789012345 | (11) 91234-0005 |
| f06 | Fábio Rocha | Bar | 67890123456 | (11) 91234-0006 |
| f07 | Gabriela Nunes | Salão | 78901234567 | (11) 91234-0007 |
| f08 | Henrique Dias | Entregador | 89012345678 | (11) 91234-0008 |

## Estrutura do código

- `src/lib/dados.ts`: funcionários, escala semanal e gerador determinístico das marcações (funções puras, sem I/O).
- `src/lib/auth.ts`: verificação das três credenciais e cabeçalhos CORS.
- `src/app/api/funcionarios/route.ts`: rota GET /api/funcionarios.
- `src/app/api/marcacoes/route.ts`: rota GET /api/marcacoes.
- `src/app/page.tsx`: página inicial com a documentação.

## Monitor virtual da aula (`/api/ajuda`)

Rota usada pela página de apoio da oficina: recebe a dúvida do aluno e responde com a API da Anthropic,
usando o contexto da aula em `src/lib/aula-contexto.ts`. A chave fica só no servidor.

Variáveis de ambiente na Vercel:

| Variável | Obrigatória | Para quê |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | sim | chave da conta Anthropic (console.anthropic.com) |
| `AJUDA_MODELO` | não | modelo; padrão `claude-sonnet-5-5` |
| `AJUDA_SENHA` | não | valor esperado no cabeçalho `X-Aula`; padrão `oficina-0411` |
| `AJUDA_LIMITE_HORA` | não | pedidos por IP por hora; padrão 30 |

Depois de criar a variável, faça um Redeploy. Pedido: `POST /api/ajuda` com cabeçalho `X-Aula` e corpo
`{"pergunta": "...", "etapa": "Peça 3", "historico": [{"papel":"aluno","texto":"..."},{"papel":"monitor","texto":"..."}]}`.
Resposta: `{"resposta": "..."}`. Para desligar depois da aula, apague a `ANTHROPIC_API_KEY` na Vercel.
