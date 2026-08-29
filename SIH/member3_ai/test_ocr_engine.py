import cv2
import numpy as np
from ocr_engine import OCREngine

# Create engine with debug
engine = OCREngine(text_det_thresh=0.1, text_det_box_thresh=0.1)

# Create test image
img = np.zeros((400, 600, 3), dtype=np.uint8)
img[:] = (255, 255, 255)
cv2.putText(img, 'MRP Rs. 50', (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 0), 3)
cv2.putText(img, 'Net Qty: 200 g', (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 0), 3)
cv2.putText(img, 'Mfd 08/2026', (50, 300), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 0), 3)

print("Image shape:", img.shape)
print("Image dtype:", img.dtype)

# Test the internal prediction
image_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
print("RGB shape:", image_rgb.shape)

results = list(engine.pipeline.predict(
    image_rgb,
    text_det_thresh=engine.text_det_thresh,
    text_det_box_thresh=engine.text_det_box_thresh,
    use_doc_orientation_classify=engine.use_doc_orientation_classify,
    use_doc_unwarping=engine.use_doc_unwarping,
    use_textline_orientation=engine.use_textline_orientation
))

print("Raw results:", results)
print("Number of results:", len(results))

if results:
    result = results[0]
    print("Result type:", type(result))
    print("rec_texts:", getattr(result, 'rec_texts', 'NOT FOUND'))
    print("rec_scores:", getattr(result, 'rec_scores', 'NOT FOUND'))
    print("rec_polys:", getattr(result, 'rec_polys', 'NOT FOUND'))
    print("rec_boxes:", getattr(result, 'rec_boxes', 'NOT FOUND'))
    print("dt_polys:", getattr(result, 'dt_polys', 'NOT FOUND'))

# Now test run_ocr
print("\n--- Testing run_ocr ---")
ocr_results = engine.run_ocr(img)
print("OCR Results:")
for r in ocr_results:
    print(f"  Text: '{r['text']}', Confidence: {r['confidence']:.4f}, Box: {r['box']}")