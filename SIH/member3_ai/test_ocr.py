import os
os.environ['FLAGS_use_onednn'] = '0'
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'

import paddle
paddle.set_flags({'FLAGS_use_onednn': False})

from paddlex import create_pipeline
import cv2
import numpy as np

# Try with explicit engine config to disable MKLDNN
pipeline = create_pipeline(
    'OCR',
    device='cpu',
    engine_config={
        'enable_mkldnn': False,
        'disable_mkldnn': True,
        'run_mode': 'paddle',
        'enable_new_ir': False,
        'delete_pass': ['mkldnn_pass']
    }
)

img = np.zeros((100, 300, 3), dtype=np.uint8)
img[:] = (255, 255, 255)
cv2.putText(img, 'MRP Rs. 50', (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)

result = pipeline.predict(img)
print('Result type:', type(result))
for r in result:
    print('Result item:', type(r))
    if hasattr(r, 'keys'):
        for k, v in r.items():
            print(f'  {k}: {v}')
    else:
        print(f'  {r}')