import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { analyze, rewriteResume, loadHistory, saveHistory, type Analysis, type HistoryItem } from "@/lib/ats";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JobMatch ATS — Passe pela triagem automática" },
      { name: "description", content: "Compare seu currículo com a vaga, veja o percentual de match e gere uma versão ATS friendly sem inventar nada." },
      { property: "og:title", content: "JobMatch ATS — Passe pela triagem automática" },
      { property: "og:description", content: "Compare seu currículo com a vaga e gere uma versão ATS friendly, sem inventar experiências." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type Step = "home" | "input" | "result" | "resume";

function GoldenRule({ compact }: { compact?: boolean }) {
  return (
    <div role="note" className="flex gap-3 rounded-lg border border-warning/30 bg-warning-soft p-4 text-sm text-foreground">
      <span aria-hidden className="mt-0.5 text-lg leading-none">⚠️</span>
      <p>
        <strong>Regra de ouro:</strong> melhoramos a forma como você se apresenta, mas{" "}
        <strong>nunca inventamos experiências, cargos, formações ou habilidades</strong>
        {compact ? "." : " que você não possui. Inclua só termos que são verdade para você."}
      </p>
    </div>
  );
}

const btn = "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = `${btn} bg-primary text-primary-foreground hover:bg-primary/90`;
const btnOutline = `${btn} border border-border bg-card text-foreground hover:bg-secondary`;

function Steps({ step }: { step: Step }) {
  const all: [Step, string][] = [["input", "Entrada"], ["result", "Análise"], ["resume", "Currículo"]];
  const idx = all.findIndex(([s]) => s === step);
  return (
    <ol className="flex items-center gap-2 text-xs font-medium">
      {all.map(([s, l], i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full ${i <= idx ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{i + 1}</span>
          <span className={i <= idx ? "text-foreground" : "text-muted-foreground"}>{l}</span>
          {i < all.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
        </li>
      ))}
    </ol>
  );
}

function App() {
  const [step, setStep] = useState<Step>("home");
  const [job, setJob] = useState("");
  const [resume, setResume] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [final, setFinal] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => setHistory(loadHistory()), []);
  useEffect(() => window.scrollTo({ top: 0 }), [step]);

  const runAnalysis = () => {
    const a = analyze(job, resume);
    setResult(a);
    saveHistory({ id: crypto.randomUUID(), date: new Date().toISOString(), score: a.score, jobPreview: job.trim().slice(0, 80) });
    setHistory(loadHistory());
    setStep("result");
  };

  const exportPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 50, width = doc.internal.pageSize.getWidth() - margin * 2, pageH = doc.internal.pageSize.getHeight();
    let y = margin;
    for (const raw of final.split("\n")) {
      const isTitle = raw.length > 0 && raw === raw.toUpperCase() && /[A-ZÀ-Ú]/.test(raw) && raw.length < 50;
      doc.setFont("helvetica", isTitle ? "bold" : "normal");
      doc.setFontSize(isTitle ? 12 : 10.5);
      const wrapped = raw ? doc.splitTextToSize(raw, width) : [""];
      for (const w of wrapped) {
        if (y > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(w, margin, y);
        y += isTitle ? 18 : 15;
      }
    }
    doc.save("curriculo-ats.pdf");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(final);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <button onClick={() => setStep("home")} className="text-lg font-bold tracking-tight text-primary">
            JobMatch <span className="text-foreground">ATS</span>
          </button>
          {step !== "home" && <Steps step={step} />}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {step === "home" && (
          <section className="mx-auto max-w-3xl py-10 text-center">
            <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Otimizador de currículos</span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              JobMatch ATS — <span className="text-primary">Passe pela triagem automática</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Muitas empresas usam sistemas ATS que filtram currículos por palavras-chave antes de um recrutador ler. Bons candidatos são descartados só pelo formato. Descubra o seu match com a vaga e ajuste seu currículo.
            </p>
            <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
              {[["1", "Cole a vaga e o currículo"], ["2", "Veja o % de match e o que falta"], ["3", "Exporte a versão ATS friendly"]].map(([n, t]) => (
                <div key={n} className="rounded-xl border border-border bg-card p-5">
                  <div className="text-2xl font-bold text-primary">{n}</div>
                  <div className="mt-1 text-sm font-medium">{t}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep("input")} className={`${btnPrimary} mt-10 px-8 py-4 text-base`}>Começar Análise →</button>
            <div className="mx-auto mt-10 max-w-2xl text-left"><GoldenRule /></div>
            {history.length > 0 && (
              <div className="mx-auto mt-10 max-w-2xl text-left">
                <h2 className="text-sm font-semibold text-muted-foreground">Análises recentes</h2>
                <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
                  {history.slice(0, 5).map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                      <span className="truncate text-muted-foreground">{h.jobPreview || "Vaga sem título"}</span>
                      <span className="shrink-0 font-semibold text-primary">{h.score}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {step === "input" && (
          <section>
            <h1 className="text-3xl font-bold tracking-tight">Entrada de dados</h1>
            <p className="mt-2 text-muted-foreground">Copie e cole os textos completos. Quanto mais detalhes, melhor a análise.</p>
            <div className="mt-6"><GoldenRule compact /></div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {([["Cole aqui a descrição da vaga", job, setJob, "Ex: Buscamos Analista de Dados com experiência em SQL, Power BI..."], ["Cole aqui o seu currículo atual", resume, setResume, "Ex: Maria Silva\nResumo\nAnalista com 3 anos de experiência..."]] as const).map(([label, val, set, ph]) => (
                <label key={label} className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">{label}</span>
                  <textarea value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                    className="min-h-[380px] resize-y rounded-xl border border-input bg-card p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring" />
                  <span className="text-xs text-muted-foreground">{val.trim().split(/\s+/).filter(Boolean).length} palavras</span>
                </label>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-between gap-3">
              <button onClick={() => setStep("home")} className={btnOutline}>← Voltar</button>
              <button onClick={runAnalysis} disabled={job.trim().length < 30 || resume.trim().length < 30} className={btnPrimary}>Analisar Match</button>
            </div>
          </section>
        )}

        {step === "result" && result && (
          <section>
            <h1 className="text-3xl font-bold tracking-tight">Resultado da análise</h1>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-6 lg:col-span-1">
                <div className="text-sm font-semibold text-muted-foreground">Match com a vaga</div>
                <div className={`mt-2 text-6xl font-extrabold ${result.score >= 70 ? "text-success" : result.score >= 40 ? "text-primary" : "text-destructive"}`}>{result.score}%</div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
                  <div className={`h-full rounded-full transition-all duration-700 ${result.score >= 70 ? "bg-success" : result.score >= 40 ? "bg-primary" : "bg-destructive"}`} style={{ width: `${result.score}%` }} />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {result.score >= 70 ? "Ótimo! Seu currículo está bem alinhado." : result.score >= 40 ? "Bom começo — dá para melhorar." : "Seu currículo precisa de ajustes para esta vaga."}
                </p>
              </div>
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="font-semibold">Palavras-chave encontradas <span className="text-muted-foreground">({result.found.length})</span></h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.found.length ? result.found.map((k) => <span key={k} className="rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">✓ {k}</span>) : <span className="text-sm text-muted-foreground">Nenhuma ainda.</span>}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="font-semibold">Palavras-chave faltantes <span className="text-muted-foreground">({result.missing.length})</span></h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.missing.length ? result.missing.map((k) => <span key={k} className="rounded-full bg-destructive-soft px-3 py-1 text-xs font-medium text-destructive">✕ {k}</span>) : <span className="text-sm text-muted-foreground">Nenhuma — excelente!</span>}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Só adicione ao currículo os termos que correspondem a algo que você realmente sabe ou fez.</p>
                </div>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold">Sugestões de melhoria</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {result.suggestions.map((s) => <li key={s} className="flex gap-2"><span className="text-primary">→</span>{s}</li>)}
              </ul>
            </div>
            <div className="mt-6"><GoldenRule compact /></div>
            <div className="mt-8 flex flex-wrap justify-between gap-3">
              <button onClick={() => setStep("input")} className={btnOutline}>← Editar textos</button>
              <button onClick={() => { setFinal(rewriteResume(resume, result)); setStep("resume"); }} className={btnPrimary}>Gerar Currículo ATS Friendly</button>
            </div>
          </section>
        )}

        {step === "resume" && (
          <section>
            <h1 className="text-3xl font-bold tracking-tight">Currículo ajustado</h1>
            <p className="mt-2 text-muted-foreground">Reorganizamos títulos, removemos símbolos que o ATS não lê e destacamos as palavras-chave que você já possui. Revise e edite à vontade.</p>
            <div className="mt-6"><GoldenRule /></div>
            <textarea value={final} onChange={(e) => setFinal(e.target.value)}
              className="mt-6 min-h-[520px] w-full resize-y rounded-xl border border-input bg-card p-6 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring" />
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={exportPdf} className={btnPrimary}>Exportar em PDF</button>
              <button onClick={copy} className={btnOutline}>{copied ? "Copiado ✓" : "Copiar Texto"}</button>
              <button onClick={() => { setResult(null); setStep("input"); }} className={`${btnOutline} sm:ml-auto`}>Voltar e Refazer Análise</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
