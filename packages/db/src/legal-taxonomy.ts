type DisciplineRule = {
  disciplineName: string;
  patterns: string[];
};

const DISCIPLINE_RULES: DisciplineRule[] = [
  { disciplineName: "Etica e Estatuto da OAB", patterns: ["etica", "estatuto da oab", "ordem dos advogados", "tribunal de etica", "conselho seccional", "sociedade de advogados", "honorarios advocaticios"] },
  { disciplineName: "Filosofia do Direito", patterns: ["filosofia do direito", "locke", "hobbes", "rousseau", "kelsen", "hart", "dworkin", "jusnaturalismo", "positivismo juridico"] },
  { disciplineName: "Direito Constitucional", patterns: ["constitucional", "constituicao federal", "cf/88", "cf 88"] },
  { disciplineName: "Direito Administrativo", patterns: ["administrativo", "licitacao", "improbidade", "servidor publico"] },
  { disciplineName: "Direito Civil", patterns: ["civil", "obrigacoes", "contratos", "responsabilidade civil", "sucessoes", "familia"] },
  { disciplineName: "Processo Civil", patterns: ["processo civil", "processual civil", "cpc", "cumprimento de sentenca", "tutela provisoria"] },
  { disciplineName: "Direito Penal", patterns: ["penal", "crime", "crimes", "ilicito penal", "dosimetria"] },
  { disciplineName: "Processo Penal", patterns: ["processo penal", "processual penal", "cpp", "inquerito", "prova penal"] },
  { disciplineName: "Direito Tributario", patterns: ["tributario", "tributaria", "ctn", "credito tributario", "obrigacao tributaria"] },
  { disciplineName: "Direito do Trabalho", patterns: ["trabalho", "trabalhista", "clt", "relacao de emprego"] },
  { disciplineName: "Processo do Trabalho", patterns: ["processo do trabalho", "processual do trabalho", "rito sumarissimo"] },
  { disciplineName: "Direitos Humanos", patterns: ["direitos humanos", "pacto de san jose", "convencao americana"] },
  { disciplineName: "Direito Internacional", patterns: ["direito internacional", "mercosul", "onu", "tratado internacional", "convencao de viena", "corte interamericana"] },
  { disciplineName: "Direito Empresarial", patterns: ["empresarial", "empresa", "falencia", "recuperacao judicial", "societario"] },
  { disciplineName: "Direito do Consumidor", patterns: ["consumidor", "cdc", "relacao de consumo", "fornecedor"] },
  { disciplineName: "Estatuto da Crianca e do Adolescente", patterns: ["eca", "crianca e adolescente", "medida socioeducativa", "conselho tutelar"] },
  { disciplineName: "Direito Previdenciario", patterns: ["previdenciario", "seguridade social", "beneficios previdenciarios"] },
  { disciplineName: "Direito Financeiro", patterns: ["financeiro", "orcamento publico", "responsabilidade fiscal"] },
  { disciplineName: "Direito Eleitoral", patterns: ["eleitoral", "partido politico", "inelegibilidade", "propaganda eleitoral"] },
  { disciplineName: "Direito Ambiental", patterns: ["ambiental", "meio ambiente", "licenciamento ambiental"] }
];

export const DEFAULT_PCI_LEGAL_CATEGORIES = [
  "oab-ordem-dos-advogados-do-brasil",
  "tribunal-de-justica",
  "ministerio-publico",
  "defensoria-publica",
  "procuradoria",
  "direito-constitucional",
  "direito-administrativo",
  "direito-civil",
  "direito-processual-civil",
  "direito-penal",
  "direito-processual-penal",
  "direito-tributario",
  "direito-do-trabalho",
  "direito-processual-do-trabalho"
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function titleizeCategorySlug(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function inferLegalDiscipline(input: {
  section?: string | null;
  categorySlug?: string | null;
  title?: string | null;
  cargo?: string | null;
  statement?: string | null;
  lawTags?: string[] | null;
}) {
  const haystacks = [input.section, input.categorySlug?.replace(/-/g, " "), input.title, input.cargo, input.statement, ...(input.lawTags ?? [])]
    .map((value) => normalize(value ?? ""))
    .filter(Boolean);

  for (const rule of DISCIPLINE_RULES) {
    if (rule.patterns.some((pattern) => haystacks.some((value) => value.includes(normalize(pattern))))) {
      return {
        disciplineName: rule.disciplineName,
        matchedBy: rule.patterns.find((pattern) => haystacks.some((value) => value.includes(normalize(pattern)))) ?? rule.disciplineName
      };
    }
  }

  if (input.section?.trim()) {
    return {
      disciplineName: input.section.trim(),
      matchedBy: "section"
    };
  }

  return {
    disciplineName: "Conhecimentos Juridicos",
    matchedBy: input.categorySlug ? titleizeCategorySlug(input.categorySlug) : "fallback"
  };
}
