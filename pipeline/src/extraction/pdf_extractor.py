import re
import fitz  # PyMuPDF


FRENCH_COMMON_WORDS = {
    "le", "la", "les", "de", "du", "des", "un", "une",
    "et", "est", "en", "au", "aux", "par", "sur", "dans",
    "que", "qui", "se", "il", "elle", "ils", "elles",
    "loi", "article", "décret", "code", "droit",
}


class PdfExtractor:
    def extract_text(self, pdf_path: str) -> str:
        doc = fitz.open(pdf_path)
        pages = []
        for page in doc:
            pages.append(page.get_text())
        doc.close()
        return "\n".join(pages)

    def quality_score(self, text: str) -> float:
        if not text or not text.strip():
            return 0.0

        # Alpha ratio: proportion of alphabetic characters
        total_chars = len(text)
        alpha_chars = sum(1 for c in text if c.isalpha())
        alpha_ratio = alpha_chars / total_chars if total_chars > 0 else 0.0

        # Average word length (good text: 3-12 chars per word)
        words = text.split()
        if not words:
            return 0.0
        avg_word_len = sum(len(w) for w in words) / len(words)
        word_len_score = 1.0 if 3 <= avg_word_len <= 12 else max(0.0, 1.0 - abs(avg_word_len - 7.5) / 10)

        # French common words presence
        words_lower = {w.lower().strip(".,;:!?\"'()[]{}") for w in words}
        french_hits = len(words_lower & FRENCH_COMMON_WORDS)
        french_score = min(1.0, french_hits / 5)

        # Combined score
        score = (alpha_ratio * 0.4) + (word_len_score * 0.3) + (french_score * 0.3)
        return round(min(1.0, max(0.0, score)), 4)

    def clean(self, text: str) -> str:
        # Collapse multiple whitespace/newlines into single spaces or newlines
        # First normalise line endings
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        # Collapse multiple blank lines into a single newline
        text = re.sub(r"\n{3,}", "\n\n", text)
        # Collapse multiple spaces/tabs on the same line
        text = re.sub(r"[ \t]+", " ", text)
        # Strip leading/trailing whitespace per line
        lines = [line.strip() for line in text.split("\n")]
        text = "\n".join(lines)
        return text.strip()
