# LexNexus Brand Direction

## 1. Strategic Positioning

LexNexus deve parecer a fusao entre:

- uma plataforma de questoes extremamente funcional
- um ecossistema educacional modular e comercialmente forte
- uma marca juridica premium, confiavel e tecnologica

Objetivo de percepcao:

- autoridade juridica e educacional
- tecnologia aplicada ao estudo
- foco, organizacao e performance
- confianca e sofisticacao
- progresso visivel do aluno

## 2. O que o mercado forte tem em comum

Padroes observados nas grandes plataformas brasileiras do segmento:

- promessa direta na primeira dobra
- CTA principal acima da linha de rolagem
- estrutura modular por produtos e jornadas
- estudo organizado por edital, carreira ou objetivo
- teoria, pratica e tecnologia aparecendo como um mesmo sistema
- dashboards, simulados, comentarios e metricas como prova de profundidade
- forte contraste entre conteudo informacional e area de acao

Como a LexNexus traduz isso:

- menos cara de cursinho genrico
- mais cara de produto SaaS premium para educacao juridica
- maior precisao visual para leitura de densidade informacional

Referencias oficiais analisadas:

- Estrategia Concursos
- Gran Cursos
- QConcursos
- Direcao Concursos

## 3. Brand Pillars

### Juridico premium

- base escura institucional
- tipografia forte e precisa
- espacamento elegante
- cartoes limpos e maduros

### Edtech moderna

- gradientes frios controlados
- blocos modulares
- dashboards com hierarquia forte
- filtros elegantes

### Alta conversao

- hero com proposta objetiva
- CTA primario e secundario sempre claros
- beneficios escaneaveis
- planos com comparacao instantanea
- pontos de valor repetidos com consistencia

## 4. Visual System

### Palette

- `--brand-primary`: `#091224`
- `--brand-primary-strong`: `#040914`
- `--brand-accent`: `#2AB7FF`
- `--brand-accent-strong`: `#0097F0`
- `--brand-secondary`: `#7A5CFF`
- `--brand-secondary-strong`: `#5D3ED8`
- `--brand-page`: `#F4F7FC`
- `--brand-page-strong`: `#EDF2FB`
- `--brand-heading`: `#091224`
- `--brand-text`: `#1F2D42`
- `--brand-muted`: `#66758F`

Logica da paleta:

- azul escuro para autoridade
- ciano para tecnologia e acao
- violeta para diferenciar a assinatura visual
- fundos claros para alta legibilidade

### Typography

- base: `Plus Jakarta Sans`
- display: `Sora`

Uso:

- headlines: `Sora` com tracking negativo e alto contraste
- corpo: `Plus Jakarta Sans`
- dashboards, filtros, numeros e tabelas: `Plus Jakarta Sans`
- metricas: peso alto e blocos curtos

### Shape and Depth

- paineis: radius `30px`
- cards: radius `24px`
- chips e pills: radius total
- sombras: leves e amplas, sem efeito pesado
- bordas: suaves, transluidas, com leitura premium

## 5. Design System Base

### Componentes principais

- `BrandLogo`
- `BrandMark`
- `brand-panel`
- `brand-card`
- `brand-card-dark`
- `brand-card-light`
- `brand-stat-card`
- `brand-button`
- `brand-button-secondary`
- `brand-badge`
- `brand-sidebar-link`
- `brand-icon-chip`
- `PageHeader`
- `MetricCard`
- `SectionTabs`
- `StatusPill`
- `ProgressBar`
- `EmptyState`

### Regras de composicao

- sempre combinar uma area de leitura ampla com uma area de decisao ou CTA
- evitar mais de 4 niveis de destaque na mesma secao
- cada card deve ter:
  - titulo
  - camada secundaria
  - status/metadado
  - CTA ou proximo passo quando fizer sentido

### Comportamento visual

- cards informacionais: fundos claros e contorno suave
- cards de acao: base escura com texto claro e contraste alto
- filtros: pills arredondadas com leitura de estado ativo
- metricas: numeros grandes e label curto

## 6. Homepage Wireframe

### 1. Header premium

- logo oficial
- navegacao curta
- CTA de entrada
- CTA de cadastro

### 2. Hero principal

- headline muito forte
- subheadline objetiva
- busca principal
- CTA primario
- CTA secundario
- mockup de produto

### 3. Sinais de autoridade

- modulo integrado
- camadas de estudo
- leitura 360 do desempenho
- ecossistema unico

### 4. Beneficios

- estudo guiado
- questoes comentadas
- analytics
- tecnologia de revisao

### 5. Produtos

- assinatura
- banco de questoes
- trilhas
- simulados
- materiais
- mentoria

### 6. Oportunidades

- cards por carreira
- status
- faixa salarial
- resumo da trilha
- CTA

### 7. Especialistas

- autoridade por carreira
- curadoria juridica
- performance educacional

### 8. Metodologia

- diagnostico
- teoria + pratica
- revisao
- evolucao visivel

### 9. Planos

- comparacao simples
- CTA principal por plano
- plano destaque

### 10. CTA final

- promessa final
- dois CTAs

### 11. Footer institucional

- plataforma
- preparacao
- institucional

## 7. Logged Area Wireframe

### Dashboard principal

- PageHeader com resumo do dia
- painel lateral com contexto de marca
- metricas principais
- grade semanal de estudo
- recomendacoes inteligentes
- metas da semana
- progresso por disciplina
- historico recente

### Outras telas

- banco de questoes:
  - filtros poderosos
  - resumo lateral
  - lista de questoes com comentarios
- cronograma:
  - semana em blocos
  - plano por prova
  - estado das revisoes
- analytics:
  - disciplina
  - acuracia
  - historico
  - leitura de decisoes
- biblioteca:
  - disciplina
  - viewer
  - versoes
  - progresso

## 8. Microcopy

### Headlines

- "A plataforma que faz o aluno sentir que esta evoluindo de verdade."
- "Seu cockpit de estudo juridico orientado por sinais."
- "Tudo o que as plataformas fortes do setor tem em comum, reorganizado com mais precisao."
- "Oferta com contraste alto, beneficio claro e leitura instantanea."

### Subheads

- "O que ler, o que praticar, o que revisar e onde ajustar a rota."
- "UX de alta escaneabilidade para quem estuda serio."
- "Teoria, pratica e memoria trabalhando no mesmo eixo."

### CTAs

- "Montar minha preparacao"
- "Criar conta gratis"
- "Explorar por dentro"
- "Ver trilha"
- "Abrir questoes"
- "Assinar agora"
- "Revisar agora"

## 9. Tailwind / Next.js Implementation Notes

- manter tokens globais em `apps/web/app/globals.css`
- preservar logo oficial em `apps/web/public/brand/lexnexus-logo-official.png`
- usar `brand-card-dark` para areas de alta acao
- usar `brand-card` para areas editoriais e explicativas
- usar `MetricCard` para todos os numeros importantes
- evitar texto corrido longo nas secoes de marketing
- priorizar layout em grid e cards modulares

## 10. Guardrails

Evitar:

- excesso de gradiente
- caixas demais na mesma dobra
- promessas infladas sem prova
- excesso de texto institucional
- cara de template generico

Buscar:

- autoridade
- controle
- conversao
- sensacao de produto valioso
- progresso visivel
