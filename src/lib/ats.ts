const STOP = new Set(
  `a o as os um uma uns umas de do da dos das em no na nos nas por pelo pela pelos pelas para pra com sem sob sobre entre e ou mas que se como mais menos muito muita muitos muitas seu sua seus suas nosso nossa nossos nossas voce você vocês ele ela eles elas isso isto esse essa este esta aquele aquela ser estar ter haver sera será é são foi era sao estao está estão tem têm temos ao aos à às já também tambem onde quando qual quais quem cada todo toda todos todas outro outra outros outras mesmo mesma bem boa bom bons boas vaga vagas empresa empresas buscamos procuramos profissional candidato candidata requisitos requisito desejavel desejável diferencial diferenciais responsabilidades atividades conhecimento conhecimentos experiencia experiência experiências area área áreas time equipe trabalho trabalhar oferecemos beneficios benefícios local horario horário anos ano nível nivel forte fortes capacidade habilidade habilidades etc vários varios várias the and or of to in for with on at by an is are be as from our your you we will this that it`
    .split(/\s+/),
);

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-zà-ÿ0-9+#.\-]{2,}/gi) || [])
    .map((t) => t.replace(/^[.\-]+|[.\-]+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t) && !STOP.has(norm(t)) && !/^\d+$/.test(t));
}

export function extractKeywords(job: string, max = 30): string[] {
  const toks = tokens(job);
  const freq = new Map<string, { n: number; label: string }>();
  const add = (k: string, w: number) => {
    const key = norm(k);
    const cur = freq.get(key);
    freq.set(key, { n: (cur?.n ?? 0) + w, label: cur?.label ?? k });
  };
  toks.forEach((t) => add(t, t.length > 3 ? 1 : 0.5));
  for (let i = 0; i < toks.length - 1; i++) {
    const bi = `${toks[i]} ${toks[i + 1]}`;
    if (job.toLowerCase().includes(bi)) add(bi, 0);
  }
  // keep bigrams that repeat
  const list = [...freq.entries()]
    .map(([k, v]) => ({ k, ...v }))
    .filter((x) => (x.k.includes(" ") ? countOcc(norm(job), x.k) >= 2 : true))
    .map((x) => ({ ...x, n: x.k.includes(" ") ? countOcc(norm(job), x.k) * 1.5 : x.n }))
    .sort((a, b) => b.n - a.n);
  const out: string[] = [];
  for (const x of list) {
    if (out.length >= max) break;
    if (out.some((o) => norm(o).includes(x.k) || x.k.includes(norm(o)))) continue;
    out.push(x.label);
  }
  return out;
}

function countOcc(hay: string, needle: string) {
  return hay.split(needle).length - 1;
}

export type Analysis = {
  score: number;
  found: string[];
  missing: string[];
  suggestions: string[];
};

export function analyze(job: string, resume: string): Analysis {
  const kws = extractKeywords(job);
  const r = norm(resume);
  const found = kws.filter((k) => r.includes(norm(k)));
  const missing = kws.filter((k) => !r.includes(norm(k)));
  const score = kws.length ? Math.round((found.length / kws.length) * 100) : 0;
  const s: string[] = [];
  if (missing.length)
    s.push(
      `Se você realmente tem experiência com ${missing.slice(0, 5).join(", ")}, mencione esses termos exatamente como aparecem na vaga.`,
    );
  if (!/resumo|perfil|objetivo|sobre/i.test(resume))
    s.push("Adicione um resumo profissional curto no topo, usando termos da vaga.");
  if (!/habilidades|compet[eê]ncias|skills/i.test(resume))
    s.push("Crie uma seção \"Habilidades\" listando suas competências reais.");
  if (!/\d/.test(resume)) s.push("Inclua números e resultados (ex: prazos, volumes, percentuais) quando forem verdadeiros.");
  if (/[│┃■●◆★✓]/.test(resume)) s.push("Evite símbolos e caracteres especiais: muitos ATS não conseguem lê-los.");
  s.push("Use títulos de seção padrão: Resumo, Experiência, Formação, Habilidades.");
  s.push("Evite tabelas, colunas e imagens — o ATS lê melhor texto simples.");
  return { score, found, missing, suggestions: s };
}

const SECTION_MAP: [RegExp, string][] = [
  [/^(resumo|perfil|objetivo|sobre( mim)?|summary)/i, "RESUMO PROFISSIONAL"],
  [/^(experi[eê]ncias?( profissional| profissionais)?|hist[oó]rico profissional|experience)/i, "EXPERIÊNCIA PROFISSIONAL"],
  [/^(forma[cç][aã]o( acad[eê]mica)?|educa[cç][aã]o|escolaridade|education)/i, "FORMAÇÃO ACADÊMICA"],
  [/^(habilidades|compet[eê]ncias|skills|conhecimentos)/i, "HABILIDADES"],
  [/^(cursos|certifica[cç](ões|oes)|certificados)/i, "CURSOS E CERTIFICAÇÕES"],
  [/^(idiomas|languages)/i, "IDIOMAS"],
];

/** Reorganiza o currículo em formato ATS. Nunca adiciona informação nova:
 * apenas normaliza títulos, remove símbolos e destaca palavras-chave já presentes. */
export function rewriteResume(resume: string, a: Analysis): string {
  const lines = resume
    .replace(/\t/g, " ")
    .split(/\r?\n/)
    .map((l) => l.replace(/[│┃■●◆★✓►▪•·\u2022\-–—*]+\s*/g, (m, o) => (o === 0 || /^\s*$/.test(l.slice(0, o)) ? "- " : " ")).replace(/\s+/g, " ").trim());
  const out: string[] = [];
  let hasSkills = false;
  for (const l of lines) {
    if (!l) {
      if (out[out.length - 1] !== "") out.push("");
      continue;
    }
    const clean = l.replace(/[:\-]+$/, "").trim();
    const m = clean.length < 45 ? SECTION_MAP.find(([re]) => re.test(clean)) : undefined;
    if (m) {
      if (m[1] === "HABILIDADES") hasSkills = true;
      if (out.length && out[out.length - 1] !== "") out.push("");
      out.push(m[1]);
      continue;
    }
    out.push(l);
  }
  if (a.found.length) {
    const block = ["", hasSkills ? "PALAVRAS-CHAVE RELEVANTES PARA A VAGA" : "HABILIDADES", a.found.join(" | ")];
    out.push(...block);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export type HistoryItem = { id: string; date: string; score: number; jobPreview: string };
const KEY = "jobmatch-history";
export const loadHistory = (): HistoryItem[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
export const saveHistory = (item: HistoryItem) => {
  localStorage.setItem(KEY, JSON.stringify([item, ...loadHistory()].slice(0, 10)));
};
