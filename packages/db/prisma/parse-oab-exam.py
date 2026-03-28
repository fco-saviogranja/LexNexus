import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

import pdfplumber


HEADER_SKIP_PREFIXES = (
    "ORDEM DOS ADVOGADOS DO BRASIL",
    "CONSELHO FEDERAL DA ORDEM DOS ADVOGADOS DO BRASIL",
    "SUA PROVA",
    "INFORMACOES GERAIS",
    "TEMPO",
    "NAO SERA PERMITIDO",
    "TIPO ",
    "REALIZACAO",
)

TRAILING_STOP_MARKERS = (
    "QUESTIONARIO DE PERCEPCAO SOBRE A PROVA",
    "QUESTIONÁRIO DE PERCEPÇÃO SOBRE A PROVA",
    "ESTE QUESTIONARIO E DE PREENCHIMENTO FACULTATIVO",
    "ESTE QUESTIONÁRIO É DE PREENCHIMENTO FACULTATIVO",
    "A OAB E A FGV AGRADECEM SUA COLABORACAO",
    "A OAB E A FGV AGRADECEM SUA COLABORAÇÃO",
)

QUESTION_NUMBER_RE = re.compile(r"^\d{1,3}$")
OPTION_RE = re.compile(r"^\(([A-E])\)\s*(.+)?$")


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
    patterns = [
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
        re.compile(r"\bADCT\b"),
        re.compile(r"\bRGPS\b"),
    ]
    found: list[str] = []
    for pattern in patterns:
        for match in pattern.findall(merged):
            cleaned = clean_spaces(match)
            if cleaned not in found:
                found.append(cleaned)
    return found


def is_ignorable_line(line: str) -> bool:
    folded = ascii_fold(line).upper()
    if folded.startswith(HEADER_SKIP_PREFIXES):
        return True
    if "QUALQUER SEMELHANCA NOMINAL" in folded:
        return True
    if re.match(r"^\u2013 PAGINA \d+$", line.upper()):
        return True
    if re.match(r"^[-–] PAGINA \d+$", folded):
        return True
    if re.match(r"^\d+O EXAME (DE|DO) ORDEM UNIFICADO$", folded):
        return True
    if re.match(r"^PAGINA \d+ DE \d+$", folded):
        return True
    return False


def detect_expected_question_count(first_pages_text: list[str]) -> int | None:
    merged = ascii_fold(" ".join(first_pages_text[:2])).upper()
    match = re.search(r"CONTENDO\s+(\d{2,3})\s+\([^)]+\)\s+QUEST", merged)
    if match:
        return int(match.group(1))
    return None


def parse_questions(pages_text: list[str], expected_question_count: int | None) -> list[dict]:
    questions: list[dict] = []
    seen_numbers: set[int] = set()
    current = None
    stop_parsing = False

    for page_number, page_text in enumerate(pages_text, start=1):
        for line in cleaned_lines(page_text):
            if is_ignorable_line(line):
                continue

            number_match = QUESTION_NUMBER_RE.match(line)
            if number_match:
                question_number = int(line)
                max_questions = expected_question_count or 120
                if not 1 <= question_number <= max_questions:
                    continue

                if question_number in seen_numbers:
                    stop_parsing = True
                    break

                if current:
                    questions.append(current)
                    seen_numbers.add(current["number"])
                    if expected_question_count and len(questions) >= expected_question_count:
                        stop_parsing = True
                        break

                current = {
                    "number": question_number,
                    "page": page_number,
                    "statement_parts": [],
                    "options": [],
                }
                continue

            if current is None:
                continue

            folded = ascii_fold(line).upper()
            marker_positions = [folded.find(ascii_fold(marker).upper()) for marker in TRAILING_STOP_MARKERS if ascii_fold(marker).upper() in folded]
            if marker_positions:
                cut_at = min(position for position in marker_positions if position >= 0)
                trimmed = clean_spaces(line[:cut_at])
                if trimmed:
                    if current["options"]:
                        current["options"][-1]["parts"].append(trimmed)
                    else:
                        current["statement_parts"].append(trimmed)
                stop_parsing = True
                break

            option_match = OPTION_RE.match(line)
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

        if stop_parsing:
            break

    if current and (not expected_question_count or len(questions) < expected_question_count):
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
        if len(options) < 4:
            continue

        statement = normalize_option_text(" ".join(item["statement_parts"]))
        if len(statement) < 20:
            continue

        parsed_questions.append(
            {
                "number": item["number"],
                "page": item["page"],
                "statement": statement,
                "options": options,
                "difficulty": infer_difficulty(statement, options),
                "lawTags": extract_laws(statement, options),
            }
        )

    return parsed_questions


def parse_answer_key(answer_key_path: Path | None, proof_type: int | None, expected_question_count: int | None) -> dict[int, str]:
    if answer_key_path is None or not answer_key_path.exists():
        return {}

    with pdfplumber.open(answer_key_path) as pdf:
        pages_text = [page.extract_text() or "" for page in pdf.pages]

    answers_by_type: dict[str, dict[int, str]] = {}
    current_type = str(proof_type or 1)
    pending_numbers: list[int] = []
    max_questions = expected_question_count or 120

    for page_text in pages_text:
        for line in cleaned_lines(page_text):
            folded = ascii_fold(line).upper()

            type_match = re.search(r"PROVA TIPO\s+(\d)", folded)
            if type_match:
                current_type = type_match.group(1)
                pending_numbers = []
                continue

            proof_match = re.search(r"CADERNO DE PROVA\s+0?(\d)", folded)
            if proof_match and "GABARITO" in folded:
                current_type = proof_match.group(1)
                pending_numbers = []
                continue

            if "GABARITO" in folded and proof_type is not None and "PROVA TIPO" not in folded and "CADERNO DE PROVA" not in folded:
                current_type = str(proof_type)
                pending_numbers = []

            numbers = [int(value) for value in re.findall(r"\b\d{1,3}\b", folded) if 1 <= int(value) <= max_questions]
            letters = re.findall(r"\b([A-E])\b", folded)

            if numbers and not letters:
                pending_numbers = numbers
                continue

            if letters and pending_numbers and len(letters) == len(pending_numbers):
                bucket = answers_by_type.setdefault(current_type, {})
                for number, letter in zip(pending_numbers, letters):
                    bucket[number] = letter
                pending_numbers = []
                continue

            direct_pairs = re.findall(r"(\d{1,3})\s+([A-E])", folded)
            if direct_pairs:
                bucket = answers_by_type.setdefault(current_type, {})
                for number_text, letter in direct_pairs:
                    number = int(number_text)
                    if 1 <= number <= max_questions:
                        bucket[number] = letter

    if proof_type is not None and str(proof_type) in answers_by_type:
        return answers_by_type[str(proof_type)]

    if answers_by_type:
        first_type = next(iter(answers_by_type))
        return answers_by_type[first_type]

    return {}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--answer-key")
    parser.add_argument("--proof-type", type=int)
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    answer_key_path = Path(args.answer_key) if args.answer_key else None

    sys.stdout.reconfigure(encoding="utf-8")

    with pdfplumber.open(pdf_path) as pdf:
        pages_text = ["\n".join(extract_page_lines(page)) for page in pdf.pages]

    expected_question_count = detect_expected_question_count(pages_text)
    answers = parse_answer_key(answer_key_path, args.proof_type, expected_question_count)
    questions = parse_questions(pages_text, expected_question_count)

    payload = {
        "expectedQuestionCount": expected_question_count,
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
