import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

import pdfplumber


STOP_HEADINGS = {
    "INSTRUCOES",
    "RASCUNHO",
    "GABARITO DEFINITIVO DAS PROVAS OBJETIVAS PARA OS CARGOS DE NIVEL",
}

SECTION_SKIP_PREFIXES = (
    "TEXTO PARA AS QUESTOES",
    "CONCURSO PUBLICO",
    "CARGO:",
    "PREFEITURA",
    "VAGAS PARA",
    "WWW.PCICONCURSOS",
    "PCIMARKPCI",
)

LAW_PATTERNS = [
    re.compile(r"LEI(?: COMPLEMENTAR)?(?: FEDERAL| ESTADUAL| MUNICIPAL)?(?:\s+N[Oº.]?\s*|\s+)\d+(?:\.\d+)*(?:/\d{2,4})?"),
    re.compile(r"CONSTITUICAO FEDERAL(?: DE 1988)?"),
    re.compile(r"\bCF/?88\b"),
    re.compile(r"\bCLT\b"),
    re.compile(r"\bCPC\b"),
    re.compile(r"\bCPP\b"),
    re.compile(r"\bCP\b"),
    re.compile(r"\bCDC\b"),
    re.compile(r"\bCTN\b"),
    re.compile(r"\bECA\b"),
    re.compile(r"\bLINDB\b"),
]


def ascii_fold(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(char for char in normalized if not unicodedata.combining(char))


def clean_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def cleaned_lines(text: str) -> list[str]:
    lines = []
    for raw_line in text.splitlines():
        line = clean_spaces(raw_line)
        if not line:
            continue
        folded = ascii_fold(line).upper()
        if folded.startswith("PCIMARKPCI") or folded == "WWW.PCICONCURSOS.COM.BR":
            continue
        lines.append(line)
    return lines


def words_to_lines(words: list[dict]) -> list[str]:
    if not words:
        return []

    sorted_words = sorted(words, key=lambda item: (round(item["top"], 1), item["x0"]))
    lines: list[list[dict]] = []

    for word in sorted_words:
        if not lines:
            lines.append([word])
            continue

        previous_line = lines[-1]
        if abs(previous_line[-1]["top"] - word["top"]) <= 3:
            previous_line.append(word)
        else:
            lines.append([word])

    return [
        clean_spaces(" ".join(item["text"] for item in sorted(line, key=lambda entry: entry["x0"])))
        for line in lines
    ]


def extract_page_lines(page) -> list[str]:
    words = page.extract_words(
        use_text_flow=False,
        keep_blank_chars=False,
        x_tolerance=2,
        y_tolerance=3,
    )
    if not words:
        return []

    split_x = page.width / 2
    left_words = [word for word in words if word["x0"] < split_x]
    right_words = [word for word in words if word["x0"] >= split_x]
    return words_to_lines(left_words) + words_to_lines(right_words)


def is_section_heading(line: str) -> bool:
    folded = ascii_fold(line)
    folded_upper = folded.upper()

    if folded_upper in STOP_HEADINGS:
        return False
    if any(folded_upper.startswith(prefix) for prefix in SECTION_SKIP_PREFIXES):
        return False
    if len(line) < 4 or len(line) > 80:
        return False
    if any(char.isdigit() for char in folded):
        return False
    if any(char in line for char in '?!.[]()"\','):
        return False
    if re.match(r"^[a-eA-E]\)", folded):
        return False
    if re.match(r"^[IVXLCDMivxlcdm]+\.", folded):
        return False

    alpha_only = "".join(char for char in folded if char.isalpha())
    if not alpha_only:
        return False
    uppercase_ratio = sum(1 for char in alpha_only if char.isupper()) / len(alpha_only)
    return uppercase_ratio >= 0.9


def normalize_option_text(value: str) -> str:
    return clean_spaces(value.replace(" ,", ",").replace(" .", "."))


def infer_difficulty(statement: str, options: list[dict]) -> str:
    size = len(statement) + sum(len(option["content"]) for option in options)
    if size < 350:
        return "easy"
    if size < 900:
        return "medium"
    return "hard"


def extract_laws(statement: str, options: list[dict]) -> list[str]:
    merged = ascii_fold(" ".join([statement] + [option["content"] for option in options])).upper()
    found: list[str] = []
    for pattern in LAW_PATTERNS:
        for match in pattern.findall(merged):
            cleaned = clean_spaces(match)
            if cleaned not in found:
                found.append(cleaned)
    return found


def extract_level(pages_text: list[str]) -> str | None:
    folded = ascii_fold(" ".join(pages_text[:3])).upper()
    match = re.search(r"NIVEL\s+(FUNDAMENTAL|MEDIO|SUPERIOR|TECNICO)", folded)
    if not match:
        return None
    value = match.group(1)
    if value == "MEDIO":
        return "Medio"
    if value == "SUPERIOR":
        return "Superior"
    if value == "TECNICO":
        return "Tecnico"
    return "Fundamental"


def extract_cargo(pages_text: list[str]) -> str | None:
    for page_text in pages_text[:2]:
        match = re.search(r"CARGO:\s*(.+)", page_text)
        if match:
            return clean_spaces(match.group(1))
    return None


def parse_answer_key(answer_key_path: Path | None) -> dict[int, str]:
    if answer_key_path is None or not answer_key_path.exists():
        return {}

    with pdfplumber.open(answer_key_path) as pdf:
        text = "\n".join("\n".join(extract_page_lines(page)) for page in pdf.pages)

    matches = re.findall(r"(\d{1,3})\s*-\s*([A-E])", ascii_fold(text).upper())
    by_number: dict[int, set[str]] = {}
    for number_text, letter in matches:
        number = int(number_text)
        by_number.setdefault(number, set()).add(letter)

    return {
        number: next(iter(letters))
        for number, letters in by_number.items()
        if len(letters) == 1
    }


def parse_questions(pages_text: list[str]) -> list[dict]:
    question_pattern = re.compile(r"^(\d{1,3})\)\s*(.+)?$")
    option_pattern = re.compile(r"^([a-eA-E])\)\s*(.+)?$")
    questions: list[dict] = []
    current = None
    current_section = None

    for page_number, page_text in enumerate(pages_text, start=1):
        for line in cleaned_lines(page_text):
            if is_section_heading(line):
                current_section = line
                continue

            question_match = question_pattern.match(line)
            if question_match:
                if current:
                    questions.append(current)
                current = {
                    "number": int(question_match.group(1)),
                    "section": current_section,
                    "page": page_number,
                    "statement_parts": [question_match.group(2) or ""],
                    "options": [],
                }
                continue

            if current is None:
                continue

            option_match = option_pattern.match(line)
            if option_match:
                current["options"].append(
                    {
                        "letter": option_match.group(1).upper(),
                        "parts": [option_match.group(2) or ""],
                    }
                )
                continue

            if current["options"]:
                current["options"][-1]["parts"].append(line)
            else:
                current["statement_parts"].append(line)

    if current:
        questions.append(current)

    parsed_questions = []
    for item in questions:
        options = [
            {
                "optionLetter": option["letter"],
                "content": normalize_option_text(" ".join(option["parts"])),
            }
            for option in item["options"]
        ]
        if len(options) != 5:
            continue

        statement = normalize_option_text(" ".join(item["statement_parts"]))
        parsed_questions.append(
            {
                "number": item["number"],
                "section": item["section"],
                "page": item["page"],
                "statement": statement,
                "options": options,
                "difficulty": infer_difficulty(statement, options),
                "lawTags": extract_laws(statement, options),
            }
        )

    return parsed_questions


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--answer-key")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    answer_key_path = Path(args.answer_key) if args.answer_key else None

    sys.stdout.reconfigure(encoding="utf-8")

    with pdfplumber.open(pdf_path) as pdf:
        pages_text = ["\n".join(extract_page_lines(page)) for page in pdf.pages]

    answers = parse_answer_key(answer_key_path)
    questions = parse_questions(pages_text)

    payload = {
        "cargoDetected": extract_cargo(pages_text),
        "nivelDetected": extract_level(pages_text),
        "questionCount": len(questions),
        "answerCount": len(answers),
        "questions": [
            {
                **question,
                "correctOption": answers.get(question["number"]),
            }
            for question in questions
        ],
    }

    json.dump(payload, sys.stdout, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
