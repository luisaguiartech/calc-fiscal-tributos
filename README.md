# Calc Fiscal Tributos

Hub tributário para cálculo de **IRPF 2025/2026** (Pessoa Física) e **Locação Residencial** com IBS/CBS e multas.

## Funcionalidades

- **IRPF Geral** — cálculo mensal e anual com tabela progressiva 2025, dedução de dependentes e descontos
- **Regra 2026** — simulação da isenção até R$ 5.000/mês com alíquota reduzida progressiva
- **Locação / Aluguéis** — Carnê-Leão + IBS/CBS conforme LC 214/2025
- **Penalidades** — multas Locador (75%/150%), Locatário (20%), Imobiliária (3%) — Lei 9.430/96
- **Validação de entrada** — destaca visualmente valores negativos

## Tecnologias

HTML5 + CSS3 + JavaScript (vanilla). Sem dependências externas.

## Estrutura

```
calc-fiscal-tributos/
├── index.html          # Estrutura da página
├── style.css           # Estilos visuais
└── calculadora.js      # Lógica de cálculos e eventos
```

## Uso

Abra o `index.html` em qualquer navegador moderno. Os cálculos são atualizados em tempo real conforme os valores são alterados.

## Base legal

- **IRPF 2025**: Lei 15.191/2025 e tabela progressiva mensal da Receita Federal
- **IRPF 2026**: Proposta de isenção até R$ 5.000/mês (valores ilustrativos até regulamentação final)
- **IBS/CBS**: LC 214/2025
- **Multas**: Lei 9.430/96

> **Aviso:** Os cálculos são estimativas para planejamento. Não substituem contador ou declaração oficial.
