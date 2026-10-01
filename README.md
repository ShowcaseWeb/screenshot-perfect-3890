# 🎯 JobMatch ATS — Otimizador de Currículos para Sistemas ATS

> Projeto desenvolvido como parte do desafio **Vibe Coding** da [DIO](https://www.dio.me/), explorando o uso da IA **Lovable** para construir uma aplicação web completa, do primeiro prompt até o site publicado.

**🔗 Aplicação publicada:** [https://screenshot-perfect-3890.lovable.app](https://screenshot-perfect-3890.lovable.app)

---

## 🎯 Problema que a aplicação resolve

Currículos bons são barrados por sistemas **ATS (Applicant Tracking System)** antes mesmo de chegarem às mãos de um recrutador humano. Isso acontece porque os ATS fazem uma triagem automática por **palavras-chave** e **formato**, e muitos candidatos qualificados são descartados por não saberem como estruturar o currículo da forma correta.

O **JobMatch ATS** resolve esse problema ao:
- Comparar o currículo do candidato com a descrição da vaga
- Mostrar o **percentual de match** e as **palavras-chave faltantes**
- Gerar uma **versão ajustada e ATS friendly** do currículo, pronta para exportar em PDF

---

## 🧠 Mega Prompt utilizado

O prompt foi construído em Markdown, descrevendo toda a aplicação: contexto, problema, solução, telas, fluxo, design system (shadcn/ui) e a **regra de ouro** (nunca inventar experiências).

```markdown
# JobMatch ATS — Otimizador de Currículos para Sistemas ATS

## 🎯 Contexto e Problema
Currículos bons são barrados por sistemas ATS (Applicant Tracking System) antes mesmo de chegarem às mãos de um recrutador humano...

## 💡 Solução
Criar uma aplicação web que:
1. Recebe a descrição de uma vaga
2. Recebe o currículo atual do candidato
3. Compara os dois textos e mostra: percentual de match, palavras-chave encontradas e faltantes
4. Gera uma versão ajustada e ATS friendly do currículo

## ⚠️ Regra de Ouro (obrigatória na interface)
A aplicação melhora a forma como a pessoa se apresenta, mas NUNCA inventa experiências, cargos, formações ou habilidades que o candidato não possui.

## 🖥️ Telas
- Tela 1 — Página Inicial
- Tela 2 — Entrada de Dados (vaga + currículo)
- Tela 3 — Resultado da Análise (match, palavras-chave, sugestões)
- Tela 4 — Currículo Ajustado (editar, exportar PDF, copiar)

## 🎨 Design System
- Biblioteca: shadcn/ui
- Paleta: azul escuro (#1E3A8A), cinza claro (#F3F4F6), verde (#10B981), vermelho (#EF4444)
