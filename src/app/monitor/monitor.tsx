"use client";

/**
 * Monitor virtual da Oficina de IA: chat simples que manda a dúvida (e um print, se houver)
 * para /api/ajuda. Roda na mesma origem da API, então não depende de CORS nem de CSP de terceiros.
 */

import { useEffect, useRef, useState } from "react";

const SENHA_AULA = "oficina-0411";
const ETAPAS = [
  "Antes de tudo (dupla, e-mail, GitHub, IA plugada)",
  "Peça 1 · GitHub e template",
  "Peça 2 · Plugar o GitHub na IA",
  "Peça 3 · Supabase",
  "Peça 4 · Vercel",
  "Entrega 1 · Prompt 1",
  "Entrega 2 · Prompts 2 e 3",
  "Entrega 3 · API de ponto",
  "Revisão",
];

type Mensagem = { papel: "aluno" | "monitor" | "erro"; texto: string; imagem?: string };
type Imagem = { tipo: string; base64: string; dataUrl: string };

const BOAS_VINDAS =
  "Travou em alguma tela? Diga em que etapa você está e cole o erro inteiro, ou mande um print. Não cole chaves nem senhas. Se a resposta não resolver, levante a mão que o Carlos vai até você.";

function reduzirImagem(arquivo: File): Promise<Imagem> {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader();
    leitor.onerror = () => rejeitar(new Error("não li o arquivo"));
    leitor.onload = () => {
      const im = new Image();
      im.onerror = () => rejeitar(new Error("imagem inválida"));
      im.onload = () => {
        const max = 1400;
        const esc = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * esc);
        c.height = Math.round(im.height * esc);
        c.getContext("2d")?.drawImage(im, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL("image/jpeg", 0.85);
        resolver({ tipo: "image/jpeg", base64: dataUrl.split(",")[1], dataUrl });
      };
      im.src = String(leitor.result);
    };
    leitor.readAsDataURL(arquivo);
  });
}

export function Monitor() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([{ papel: "monitor", texto: BOAS_VINDAS }]);
  const [texto, setTexto] = useState("");
  const [etapa, setEtapa] = useState("");
  const [imagem, setImagem] = useState<Imagem | null>(null);
  const [enviando, setEnviando] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens, enviando]);

  async function receberArquivo(arquivo: File | null | undefined) {
    if (!arquivo || !arquivo.type.startsWith("image/")) return;
    try {
      setImagem(await reduzirImagem(arquivo));
    } catch {
      setMensagens((m) => [...m, { papel: "erro", texto: "Não consegui ler esse print. Tente outro arquivo." }]);
    }
  }

  function colar(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const itens = e.clipboardData?.items ?? [];
    for (let i = 0; i < itens.length; i++) {
      if (itens[i].type.startsWith("image/")) {
        e.preventDefault();
        void receberArquivo(itens[i].getAsFile());
        return;
      }
    }
  }

  async function perguntar() {
    const pergunta = texto.trim();
    if (!pergunta && !imagem) return;
    if (/sb_secret_|sk-ant-|vt_secret_/.test(pergunta)) {
      setMensagens((m) => [...m, { papel: "erro", texto: "Tem uma chave secreta no texto. Apague antes de enviar: chaves nunca saem do seu computador." }]);
      return;
    }
    const imagemEnviada = imagem;
    const historico = mensagens
      .filter((m) => m.papel !== "erro")
      .slice(1)
      .slice(-8)
      .map((m) => ({ papel: m.papel, texto: m.texto }));

    setMensagens((m) => [...m, { papel: "aluno", texto: pergunta || "(print)", imagem: imagemEnviada?.dataUrl }]);
    setTexto("");
    setImagem(null);
    if (arquivoRef.current) arquivoRef.current.value = "";
    setEnviando(true);

    try {
      const r = await fetch("/api/ajuda", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Aula": SENHA_AULA },
        body: JSON.stringify({
          pergunta,
          etapa,
          historico,
          imagem: imagemEnviada ? { tipo: imagemEnviada.tipo, base64: imagemEnviada.base64 } : null,
        }),
      });
      const d = (await r.json().catch(() => ({}))) as { resposta?: string; erro?: string };
      if (!r.ok || !d.resposta) {
        setMensagens((m) => [...m, { papel: "erro", texto: d.erro || "O monitor virtual não respondeu. Levante a mão." }]);
      } else {
        setMensagens((m) => [...m, { papel: "monitor", texto: d.resposta! }]);
      }
    } catch {
      setMensagens((m) => [...m, { papel: "erro", texto: "Sem conexão com o monitor virtual. Levante a mão." }]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mon">
      <header className="mon-cab">
        <div>
          <p className="mon-tag">Oficina de IA · Do problema à solução</p>
          <h1>Monitor virtual</h1>
          <p className="mon-sub">Responde pelo roteiro da aula. Dúvida que ele não resolver: a dupla, depois levante a mão.</p>
        </div>
      </header>

      <div className="mon-msgs">
        {mensagens.map((m, i) => (
          <div key={i} className={"mon-msg " + m.papel}>
            {m.texto}
            {m.imagem ? <img src={m.imagem} alt="print enviado" /> : null}
          </div>
        ))}
        {enviando ? <div className="mon-msg monitor">Pensando...</div> : null}
        <div ref={fimRef} />
      </div>

      <form
        className="mon-form"
        onSubmit={(e) => {
          e.preventDefault();
          void perguntar();
        }}
      >
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onPaste={colar}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void perguntar();
          }}
          placeholder="Descreva a dúvida, cole a mensagem de erro ou cole um print (Ctrl+V)"
          rows={3}
        />
        <div className="mon-anexo">
          <label>
            Anexar print
            <input ref={arquivoRef} type="file" accept="image/*" onChange={(e) => void receberArquivo(e.target.files?.[0])} />
          </label>
          {imagem ? (
            <span className="mon-previa">
              <img src={imagem.dataUrl} alt="print anexado" />
              <span>print anexado</span>
              <button type="button" aria-label="Remover print" onClick={() => setImagem(null)}>
                ×
              </button>
            </span>
          ) : null}
        </div>
        <div className="mon-linha">
          <select value={etapa} onChange={(e) => setEtapa(e.target.value)}>
            <option value="">Em que etapa você está?</option>
            {ETAPAS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <button type="submit" disabled={enviando}>
            Perguntar
          </button>
        </div>
        <p className="mon-nota">Não cole chaves nem senhas. O print é lido pela IA e não fica guardado.</p>
      </form>
    </div>
  );
}
