#!/usr/bin/env python3
"""
Extract text from an image-based (scanned) PDF that has a 2-column layout.

Requirements:
    pip install pdf2image pytesseract pillow --break-system-packages

    System dependencies (these are NOT pip packages):
        - poppler-utils  (provides pdftoppm/pdftocairo, used by pdf2image)
        - tesseract-ocr  (the OCR engine used by pytesseract)

    Debian/Ubuntu:
        sudo apt-get install poppler-utils tesseract-ocr

    macOS (Homebrew):
        brew install poppler tesseract

Usage:
    python pdf_ocr_2col.py input.pdf -o output.txt
    python pdf_ocr_2col.py input.pdf -o output.txt --dpi 300 --split 0.5
    python pdf_ocr_2col.py input.pdf -o output.txt --lang eng
"""

import argparse
import sys

from pdf2image import convert_from_path
from PIL import Image
import pytesseract

# REPLACE YOUR TESSERACT AND POPPLER HERE
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
POPPLER_PATH = r"C:\Program Files\poppler-26.02.0\Library\bin"

def split_columns(image: Image.Image, split_ratio: float, gutter: int):
    #Split a page image into left and right column images.
    width, height = image.size
    mid = int(width * split_ratio)

    left_box = (0, 0, max(mid - gutter, 0), height)
    right_box = (min(mid + gutter, width), 0, width, height)

    left_col = image.crop(left_box)
    right_col = image.crop(right_box)
    return left_col, right_col


def preprocess(image: Image.Image) -> Image.Image:
    """Light preprocessing to help OCR accuracy: grayscale + upscale if small."""
    image = image.convert("L")  # grayscale
    return image


def ocr_pdf_two_column(
    pdf_path: str,
    dpi: int = 300,
    split_ratio: float = 0.5,
    gutter: int = 15,
    lang: str = "eng",
    tesseract_config: str = "--psm 6",
) -> str:
    """Run OCR over every page of a 2-column PDF and return the full text."""
    print(f"Rendering '{pdf_path}' to images at {dpi} DPI...", file=sys.stderr)
    pages = convert_from_path(pdf_path, dpi=dpi, poppler_path=POPPLER_PATH)

    all_text = []
    for page_num, page_image in enumerate(pages, start=1):
        print(f"OCR'ing page {page_num}/{len(pages)}...", file=sys.stderr)

        left_col, right_col = split_columns(page_image, split_ratio, gutter)

        left_text = pytesseract.image_to_string(
            preprocess(left_col), lang=lang, config=tesseract_config
        )
        right_text = pytesseract.image_to_string(
            preprocess(right_col), lang=lang, config=tesseract_config
        )

        page_text = (
            f"\n----- Page {page_num} (left column) -----\n"
            f"{left_text.strip()}\n"
            f"\n----- Page {page_num} (right column) -----\n"
            f"{right_text.strip()}\n"
        )
        all_text.append(page_text)

    return "\n".join(all_text)


def main():
    parser = argparse.ArgumentParser(
        description="OCR a 2-column, image-based PDF into plain text."
    )
    parser.add_argument("pdf_path", help="Path to the input PDF")
    parser.add_argument(
        "-o", "--output", default="output.txt", help="Path to write extracted text"
    )
    parser.add_argument(
        "--dpi", type=int, default=300, help="Rendering resolution (default: 300)"
    )
    parser.add_argument(
        "--split",
        type=float,
        default=0.5,
        help="Fraction of page width where the column boundary is (default: 0.5)",
    )
    parser.add_argument(
        "--gutter",
        type=int,
        default=15,
        help="Pixels to trim on each side of the column boundary (default: 15)",
    )
    parser.add_argument(
        "--lang", default="eng", help="Tesseract language code (default: eng)"
    )
    args = parser.parse_args()

    text = ocr_pdf_two_column(
        args.pdf_path,
        dpi=args.dpi,
        split_ratio=args.split,
        gutter=args.gutter,
        lang=args.lang,
    )

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(text)

    print(f"Done. Extracted text written to '{args.output}'", file=sys.stderr)


if __name__ == "__main__":
    main()