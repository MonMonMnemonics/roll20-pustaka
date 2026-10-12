import io
import json
from typing import Dict, List
from pdf2image import convert_from_path
import ollama
from PIL import Image
from pydantic import BaseModel, Field, RootModel

POPPLER_PATH = r"C:\Program Files\poppler-26.02.0\Library\bin" # REPLACE YOUR TESSERACT AND POPPLER HERE

# 1. Define schema
class MonsterComponent(BaseModel):
    name: str = Field(description="Name of the component, e.g., Antenna, Flesh, Brain")
    dc: int = Field(description="Difficulty Class (DC) numerical value")
    edible: bool = Field(description="True if edible, False otherwise")
    volatility: bool = Field(description="True if volatile, False otherwise")

class DynamicLootTable(RootModel[Dict[str, List[MonsterComponent]]]):
    pass

# Resizes and converts PIL image half to PNG bytes.
def process_image_half(image: Image.Image, max_dimension: int = 1280) -> bytes:
    
    if max(image.size) > max_dimension:
        image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
    
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()

# Splits a PIL image vertically into Left and Right halves.
def split_page_into_columns(page: Image.Image) -> tuple[Image.Image, Image.Image]:
    width, height = page.size
    mid_x = width // 2

    left_half = page.crop((0, 0, mid_x, height))
    right_half = page.crop((mid_x, 0, width, height))

    return left_half, right_half

# Sends a single column image to Ollama and returns parsed dict.
def parse_column_image(img_bytes: bytes, model_name: str = "qwen2.5vl:3b") -> dict:
    response = ollama.chat(
        model=model_name,
        messages=[
            {
                "role": "user",
                "content": (
                    "Extract the harvesting/loot table from this image column. "
                    "Identify the monster category name and set it as the top-level key, "
                    "mapping to the array of objects containing 'name', 'dc' (int), and 'edible' (bool)."
                    "capitalize the first letter of the value for name"
                    "edible or not defined by if it has small E uppercase symbol after the component name"
                    "volatility is definied by if it has explicit 'volatile' word or small V uppercase symbol after the component name"
                ),
                "images": [img_bytes],
            }
        ],
        format=DynamicLootTable.model_json_schema(),
        options={
            "temperature": 0.0,
            "num_ctx": 4096,
        },
    )
    return json.loads(response["message"]["content"])


def parse_pdf_to_json(
    pdf_path: str, model_name: str = "qwen2.5vl:3b"
) -> Dict[str, List[dict]]:
    """Converts 2-column image PDF into structured JSON."""
    pages = convert_from_path(pdf_path, dpi=300, poppler_path=POPPLER_PATH)
    combined_result: Dict[str, List[dict]] = {}

    for idx, page in enumerate(pages):
        print(f"Processing Page {idx + 1}/{len(pages)}...")
        
        left_img, right_img = split_page_into_columns(page)
        columns = [("Left", left_img), ("Right", right_img)]

        for col_name, col_image in columns:
            print(f"  └─ Parsing {col_name} Column...")
            img_bytes = process_image_half(col_image)
            
            try:
                page_data = parse_column_image(img_bytes, model_name)
                
                for creature_type, items in page_data.items():
                    key = creature_type.lower().strip()
                    if key not in combined_result:
                        combined_result[key] = []
                    combined_result[key].extend(items)
            except Exception as e:
                print(f"     [Warning] Could not parse {col_name} column: {e}")

    return combined_result


if __name__ == "__main__":
    PDF_FILE = "Heliana.pdf"  # Replace with your actual PDF path

    extracted_data = parse_pdf_to_json(PDF_FILE, "qwen2.5vl:3b") # CHANGE YOUR OLLAMA MODEL

    with open("extracted_loot.json", "w", encoding="utf-8") as f:
        json.dump(extracted_data, f, indent=4)

    print("\n--- Output saved to extracted_loot.json ---")
    print(json.dumps(extracted_data, indent=4))