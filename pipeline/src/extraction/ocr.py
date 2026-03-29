import subprocess
import tempfile
import os
from pathlib import Path

from .pdf_extractor import PdfExtractor

QUALITY_THRESHOLD = 0.4
REVIEW_THRESHOLD = 0.6


class OcrPipeline:
    def __init__(self):
        self.pdf_extractor = PdfExtractor()

    def _run_tesseract(self, pdf_path: str) -> str:
        """Convert PDF pages to images and run Tesseract OCR."""
        try:
            import fitz  # PyMuPDF
        except ImportError:
            return ""

        doc = fitz.open(pdf_path)
        all_text = []

        with tempfile.TemporaryDirectory() as tmpdir:
            for page_num, page in enumerate(doc):
                # Render page to image at 300 DPI
                mat = fitz.Matrix(300 / 72, 300 / 72)
                pix = page.get_pixmap(matrix=mat)
                img_path = os.path.join(tmpdir, f"page_{page_num:04d}.png")
                pix.save(img_path)

                # Run tesseract on the image
                out_path = os.path.join(tmpdir, f"page_{page_num:04d}_ocr")
                result = subprocess.run(
                    ["tesseract", img_path, out_path, "-l", "fra+eng", "--psm", "1"],
                    capture_output=True,
                    timeout=60,
                )
                txt_file = out_path + ".txt"
                if result.returncode == 0 and os.path.exists(txt_file):
                    with open(txt_file, "r", encoding="utf-8", errors="replace") as f:
                        all_text.append(f.read())

        doc.close()
        return "\n".join(all_text)

    def process(self, pdf_path: str) -> dict:
        """
        Process a PDF file and return extracted text with quality metadata.

        Returns a dict with:
          - text: str
          - method: str ("direct" | "ocr" | "failed")
          - quality: float (0-1)
          - needs_review: bool
        """
        # Step 1: Try direct text extraction
        try:
            text = self.pdf_extractor.extract_text(pdf_path)
            text = self.pdf_extractor.clean(text)
            quality = self.pdf_extractor.quality_score(text)

            if quality >= QUALITY_THRESHOLD:
                return {
                    "text": text,
                    "method": "direct",
                    "quality": quality,
                    "needs_review": quality < REVIEW_THRESHOLD,
                }
        except Exception:
            text = ""
            quality = 0.0

        # Step 2: Fallback to Tesseract OCR
        try:
            ocr_text = self._run_tesseract(pdf_path)
            ocr_text = self.pdf_extractor.clean(ocr_text)
            ocr_quality = self.pdf_extractor.quality_score(ocr_text)

            if ocr_quality > quality:
                return {
                    "text": ocr_text,
                    "method": "ocr",
                    "quality": ocr_quality,
                    "needs_review": ocr_quality < REVIEW_THRESHOLD,
                }
        except Exception:
            pass

        # If we have any text from direct extraction, return it even if low quality
        if text:
            return {
                "text": text,
                "method": "direct",
                "quality": quality,
                "needs_review": True,
            }

        return {
            "text": "",
            "method": "failed",
            "quality": 0.0,
            "needs_review": True,
        }
