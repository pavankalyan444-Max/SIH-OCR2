# Legal Metrology Inspection - AI/CV Module (Member 3)

AI-powered OCR and field extraction system for packaged commodity inspection under the Legal Metrology (Packaged Commodities) Rules, 2011.

## Overview

This module extracts packaging declarations from product images using PaddleOCR, including:
- MRP (Maximum Retail Price)
- Net Quantity (weight/volume)
- Manufacturer / Packer / Importer details
- Country of Origin
- Manufacturing / Expiry Dates
- Product Name
- Product Category classification

**NEW in v2.0**: Three-image architecture (Front, Back, Side views) with multi-image fusion.

## Features

1. **OCR Engine** - PaddleOCR (PP-OCRv6) via PaddleX pipeline
2. **Image Quality Check** - Blur, brightness, resolution, edge detection (per image)
3. **Field Extraction** - Regex/keyword-based parsing of declarations
4. **Product Category** - Keyword heuristic classification (food, beverage, personal_care, household)
5. **Confidence Levels** - HIGH (≥0.90), MEDIUM (0.60-0.90), LOW (<0.60)
6. **Evidence Tracking** - Bounding boxes, source image, confidence per field
7. **Multi-Image Fusion** - Combines information from front, back, and side views
8. **Conflict Detection** - Flags fields with different values across views
9. **FastAPI Endpoint** - REST API for integration + Web UI
10. **Web Frontend** - Simple HTML/CSS/JS interface for three-image upload

## Installation

### Prerequisites
- Python 3.12 (recommended)
- Windows/Linux/macOS

### Setup

```bash
# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/macOS

# Install dependencies
pip install -r requirements.txt
```

The first run will download PaddleOCR models (~200MB) automatically.

## Project Structure

```
member3_ai/
├── ocr_engine.py          # PaddleOCR wrapper
├── image_quality.py       # Quality checks (blur, brightness, resolution)
├── field_extractor.py     # Declaration field extraction
├── category.py            # Product category classification
├── confidence.py          # Confidence level mapping
├── evidence.py            # Bounding box visualization
├── pipeline.py            # Main inspection pipeline (single + multi-image)
├── multi_image.py         # Multi-image fusion logic
├── api.py                 # FastAPI endpoint + static file serving
├── static/
│   ├── index.html         # Web UI
│   ├── style.css          # Styles
│   └── app.js             # Frontend logic
├── test_data/             # Sample test images
├── evidence/              # Generated evidence images
├── output/                # Output directory
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Usage

### Python API - Single Image (Existing)

```python
from pipeline import create_pipeline
import cv2

# Create pipeline
pipeline = create_pipeline()

# Load image
image = cv2.imread("product.jpg")

# Run inspection
result = pipeline.inspect_image(image, source_name="product.jpg")

# Access results
print(f"Category: {result['category']}")
print(f"MRP: {result['fields']['mrp']['value']}")
print(f"Net Qty: {result['fields']['net_quantity']['value']} {result['fields']['net_quantity']['unit']}")
```

### Python API - Three Images (NEW)

```python
from pipeline import create_pipeline
import cv2

# Create pipeline
pipeline = create_pipeline()

# Load three views
front = cv2.imread("front.jpg")
back = cv2.imread("back.jpg")
side = cv2.imread("side.jpg")

# Run multi-image inspection
result = pipeline.inspect_product(front, back, side,
    front_name="front.jpg", back_name="back.jpg", side_name="side.jpg")

# Access fused results
print(f"Category: {result['category']}")
print(f"MRP: {result['fields']['mrp']['value']}")
print(f"MRP Sources: {result['fields']['mrp']['sources']}")
print(f"Net Qty: {result['fields']['net_quantity']['value']} {result['fields']['net_quantity']['unit']}")
```

### FastAPI Server

```bash
# Start server
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

The server will be available at:
- **Web UI**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Web UI

1. Open http://localhost:8000 in your browser
2. Upload **Front View**, **Back View**, and **Side View** images
3. Click **INSPECT PRODUCT**
4. View extracted information, quality checks, and evidence

### API Endpoints

#### POST /inspect/image (Single Image - Existing)

Input: `multipart/form-data` with `file` field (image)

Response: Single-image inspection result

#### POST /inspect/product (Three Images - NEW)

Input: `multipart/form-data` with three fields:
- `front_image` - Front view image
- `back_image` - Back view image  
- `side_image` - Side view image

All three images are **required**.

Response: Fused multi-image inspection result

```json
{
  "success": true,
  "category": "food",
  "fields": {
    "product_name": {
      "value": "ABC Biscuits",
      "confidence": 0.94,
      "level": "HIGH",
      "status": "FOUND",
      "sources": [
        {"image": "front.jpg", "box": [...], "confidence": 0.94, "level": "HIGH"}
      ]
    },
    "mrp": {
      "value": "50",
      "confidence": 0.97,
      "level": "HIGH",
      "status": "FOUND",
      "sources": [
        {"image": "front.jpg", "box": [...], "confidence": 0.97, "level": "HIGH"}
      ]
    },
    "net_quantity": {
      "value": "200",
      "unit": "g",
      "confidence": 0.96,
      "level": "HIGH",
      "status": "FOUND",
      "sources": [
        {"image": "side.jpg", "box": [...], "confidence": 0.96, "level": "HIGH"}
      ]
    },
    "manufacturer": {
      "value": "ABC Foods Ltd",
      "confidence": 0.91,
      "level": "HIGH",
      "status": "FOUND",
      "sources": [
        {"image": "back.jpg", "box": [...], "confidence": 0.91, "level": "HIGH"}
      ]
    },
    "packer": null,
    "importer": null,
    "country_of_origin": {
      "value": "India",
      "confidence": 0.93,
      "level": "HIGH",
      "status": "FOUND",
      "sources": [
        {"image": "back.jpg", "box": [...], "confidence": 0.93, "level": "HIGH"}
      ]
    },
    "date": {
      "value": "08/2026",
      "confidence": 0.92,
      "level": "HIGH",
      "status": "FOUND",
      "sources": [
        {"image": "side.jpg", "box": [...], "confidence": 0.92, "level": "HIGH"}
      ]
    },
    "brand": null
  },
  "quality": {
    "front": {"status": "GOOD", "reasons": [], "metrics": {...}},
    "back": {"status": "GOOD", "reasons": [], "metrics": {...}},
    "side": {"status": "GOOD", "reasons": [], "metrics": {...}}
  },
  "raw_ocr": {
    "front": [...],
    "back": [...],
    "side": [...]
  },
  "evidence": {
    "front": {"original": "...", "ocr": "...", "fields": "..."},
    "back": {"original": "...", "ocr": "...", "fields": "..."},
    "side": {"original": "...", "ocr": "...", "fields": "..."}
  },
  "images": {
    "front": "front.jpg",
    "back": "back.jpg",
    "side": "side.jpg"
  }
}
```

## Multi-Image Fusion Logic

The system processes each image independently through the full pipeline (Quality → OCR → Field Extraction), then fuses results:

### Field Fusion Rules

For each field (mrp, net_quantity, manufacturer, etc.):

1. **No candidates** (field not found in any image) → `null`
2. **Single candidate** (found in one image) → Use that value with source evidence
3. **Multiple candidates, SAME value** → Use value, combine sources, use highest confidence
4. **Multiple candidates, DIFFERENT values** → **CONFLICT** - return all candidates with sources, do NOT auto-resolve

### Conflict Example

Front image: `MRP = 50` (confidence 0.92)
Back image: `MRP = 60` (confidence 0.91)

Result:
```json
{
  "mrp": {
    "value": null,
    "confidence": null,
    "level": null,
    "status": "CONFLICT",
    "candidates": [
      {"value": "50", "source": "front.jpg", "confidence": 0.92, "level": "HIGH", "box": [...]},
      {"value": "60", "source": "back.jpg", "confidence": 0.91, "level": "HIGH", "box": [...]}
    ]
  }
}
```

### Category Fusion

Category is determined by majority vote across all three images' OCR text.

### Quality Per Image

Each image gets independent quality assessment:
```json
{
  "quality": {
    "front": {"status": "GOOD", "reasons": [], "metrics": {...}},
    "back": {"status": "BAD", "reasons": ["Image blurry"], "metrics": {...}},
    "side": {"status": "GOOD", "reasons": [], "metrics": {...}}
  }
}
```

Processing continues for GOOD images. Only fails if ALL THREE are BAD.

## Evidence Tracking

Every field knows exactly which image produced it:

```json
"sources": [
  {"image": "front.jpg", "box": [[x1,y1],...], "confidence": 0.97, "level": "HIGH"},
  {"image": "back.jpg", "box": [[x1,y1],...], "confidence": 0.91, "level": "HIGH"}
]
```

Annotated evidence images saved to `evidence/`:
- `{view}_original.jpg` - Original image
- `{view}_ocr.jpg` - OCR bounding boxes
- `{view}_fields.jpg` - Extracted field boxes with labels

## Running Tests

```bash
# Test OCR engine
python -c "from ocr_engine import create_ocr_engine; e = create_ocr_engine(); print('OK')"

# Test image quality
python image_quality.py

# Test field extraction
python field_extractor.py

# Test category classification
python category.py

# Test confidence levels
python confidence.py

# Test evidence drawing
python evidence.py

# Test multi-image fusion
python multi_image.py

# Test full pipeline (single image)
python pipeline.py

# Test FastAPI
python -m uvicorn api:app --host 0.0.0.0 --port 8000
# Then in browser: http://localhost:8000
```

### Multi-Image Test Example

Create test images with distributed fields:

**front.jpg**: "ABC Biscuits", "MRP ₹50"
**back.jpg**: "Manufactured by ABC Foods Ltd", "Country of Origin: India"
**side.jpg**: "Net Quantity 200 g", "MFD 08/2026"

Expected fused result:
- Product Name: ABC Biscuits (from front)
- MRP: ₹50 (from front)
- Manufacturer: ABC Foods Ltd (from back)
- Country: India (from back)
- Net Quantity: 200 g (from side)
- Date: 08/2026 (from side)

### Conflict Test

**front.jpg**: "MRP ₹50"
**back.jpg**: "MRP ₹60"

Expected: MRP status = CONFLICT with both candidates preserved.

## Supported Declaration Patterns

### MRP
- `MRP ₹50`, `MRP Rs. 50`, `MRP Rs 50`, `M.R.P. ₹50`, `MAXIMUM RETAIL PRICE Rs 50`

### Net Quantity
- `Net Qty: 200 g`, `Net Quantity 200g`, `Net Wt 500 g`, `Net Weight: 1 kg`, `Net Volume 500 ml`
- Units: mg, g, kg, ml, l, litre, liter

### Manufacturer/Packer/Importer
- `Manufactured by ABC Ltd`, `Manufacturer: ABC Ltd`
- `Packed by XYZ Ltd`, `Packer: XYZ Ltd`
- `Imported by DEF Ltd`, `Importer: DEF Ltd`

### Country of Origin
- `Country of Origin: India`, `Made in India`

### Dates
- `MFD 08/2026`, `Mfg: 08/2026`, `MFD 12/08/2026`, `Packed on 12/08/2026`

## Configuration

### Quality Thresholds (image_quality.py)
```python
QUALITY_THRESHOLDS = {
    "min_width": 640,
    "min_height": 480,
    "min_blur_score": 50.0,
    "min_brightness": 40.0,
    "max_brightness": 220.0,
    "min_edge_ratio": 0.001,
}
```

### OCR Thresholds (pipeline.py)
```python
create_pipeline(
    text_det_thresh=0.1,      # Detection confidence threshold
    text_det_box_thresh=0.1   # Box confidence threshold
)
```

### Confidence Levels (confidence.py)
```python
HIGH:    confidence >= 0.90
MEDIUM:  0.60 <= confidence < 0.90
LOW:     confidence < 0.60
```

## Known Limitations

1. **No legal decisions** - This module only extracts information; compliance checking is done by another module
2. **Prototype confidence scores** - Not mathematically calibrated probabilities
3. **Keyword-based category** - No ML classifier; uses heuristic keyword matching
4. **Heuristic image quality** - Thresholds are prototype values, not legally defined
5. **Three static images only** - No video, 360-degree, or 3D reconstruction
6. **CPU inference** - Optimized for laptop CPU; GPU support available but not configured
7. **English/Hindi text** - Primary language support; other languages may need model changes
8. **Offline after setup** - Requires internet only for initial model download
9. **Conflict not auto-resolved** - Requires human review when values differ across views

## What's NOT Implemented (Intentionally Postponed)

- Video processing / frame extraction
- 360-degree scanning / multi-view fusion (beyond 3 static views)
- Legal Metrology rules engine (Rule 6, Rule 7, etc.)
- FSSAI validation / license verification
- Unit sale price calculation
- Font size / legal compliance checks
- Database / persistence layer
- LLM-based extraction
- Custom model training
- Docker containerization

## Architecture Notes

### Three-Image Architecture

This system uses **three static images** representing different views of the SAME product:
- **Front View** - Typically product name, brand, MRP
- **Back View** - Typically manufacturer, country, ingredients, nutrition
- **Side View** - Typically net quantity, dates, batch info

**This is NOT:**
- 360-degree video scanning
- 3D reconstruction
- Multi-frame video processing

### Separation of Concerns

| Module | Responsibility |
|--------|----------------|
| This AI/CV Module | Extract declarations, provide evidence |
| Legal Rule Engine (separate) | Check compliance (MRP format, net qty units, etc.) |

Example:
- Our module: `"MRP = ₹50"`
- Legal module: `"Is the MRP declaration compliant per Rule 6?"`

## License

Smart India Hackathon 2024 - Team Project