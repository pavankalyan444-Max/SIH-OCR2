import requests
import json

# Test all test images
test_images = ['good.jpg', 'blurry.jpg', 'dark.jpg', 'bright.jpg', 'lowres.jpg']

for img_name in test_images:
    print(f'\n=== Testing {img_name} ===')
    with open(f'test_data/{img_name}', 'rb') as f:
        files = {'file': (img_name, f, 'image/jpeg')}
        response = requests.post('http://localhost:8000/inspect/image', files=files)
        result = response.json()
        print(f'Success: {result["success"]}')
        print(f'Quality: {result["quality"]["status"]}')
        if result['quality']['reasons']:
            print(f'Reasons: {result["quality"]["reasons"]}')
        print(f'Category: {result["category"]}')
        for field, value in result['fields'].items():
            if value:
                print(f'  {field}: {value["value"]} (conf: {value["confidence"]:.2f}, level: {value["level"]})')