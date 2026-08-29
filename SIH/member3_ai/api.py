"""
FastAPI endpoint for Legal Metrology Inspection.

POST /inspect/image - Upload single image for inspection
POST /inspect/product - Upload three images (front, back, side) for product inspection
"""

import os
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import cv2
import numpy as np

from pipeline import InspectionAI, create_pipeline


# Create FastAPI app
app = FastAPI(
    title="Legal Metrology Inspection API",
    description="AI-powered inspection for packaged commodities under Legal Metrology Rules",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Global pipeline instance
_pipeline: Optional[InspectionAI] = None


def get_pipeline() -> InspectionAI:
    """Get or create the global pipeline instance."""
    global _pipeline
    if _pipeline is None:
        _pipeline = create_pipeline(
            text_det_thresh=0.1,
            text_det_box_thresh=0.1
        )
    return _pipeline


@app.on_event("startup")
async def startup_event():
    """Initialize pipeline on startup."""
    get_pipeline()


@app.get("/")
async def root():
    """Serve the frontend webpage."""
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "message": "Legal Metrology Inspection API",
        "version": "2.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/inspect/image")
async def inspect_image(
    file: UploadFile = File(...)
):
    """
    Inspect an uploaded package image (single image).
    
    Args:
        file: Image file (multipart/form-data)
        
    Returns:
        JSON inspection result
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image"
        )
    
    # Read file content
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read file: {str(e)}"
        )
    
    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Empty file"
        )
    
    # Convert to OpenCV image
    try:
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(
                status_code=400,
                detail="Failed to decode image. Supported formats: JPEG, PNG, BMP, TIFF"
            )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image format: {str(e)}"
        )
    
    # Run inspection
    try:
        pipeline = get_pipeline()
        result = pipeline.inspect_image(image, source_name=file.filename)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inspection failed: {str(e)}"
        )
    
    return JSONResponse(content=result)


@app.post("/inspect/product")
async def inspect_product(
    front_image: UploadFile = File(...),
    back_image: UploadFile = File(...),
    side_image: UploadFile = File(...)
):
    """
    Inspect a product from three views (front, back, side).
    
    Args:
        front_image: Front view image file
        back_image: Back view image file
        side_image: Side view image file
        
    Returns:
        JSON fused inspection result
    """
    # Validate all files are images
    for label, file in [("front", front_image), ("back", back_image), ("side", side_image)]:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"{label.capitalize()} image must be an image file"
            )
    
    # Read all file contents
    images = {}
    for label, file in [("front", front_image), ("back", back_image), ("side", side_image)]:
        try:
            contents = await file.read()
            if not contents:
                raise HTTPException(
                    status_code=400,
                    detail=f"{label.capitalize()} image is empty"
                )
            nparr = np.frombuffer(contents, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to decode {label} image. Supported formats: JPEG, PNG, BMP, TIFF"
                )
            images[label] = (image, file.filename or f"{label}.jpg")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid {label} image format: {str(e)}"
            )
    
    # Run multi-image inspection
    try:
        pipeline = get_pipeline()
        result = pipeline.inspect_product(
            front_image=images["front"][0],
            back_image=images["back"][0],
            side_image=images["side"][0],
            front_name=images["front"][1],
            back_name=images["back"][1],
            side_name=images["side"][1]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inspection failed: {str(e)}"
        )
    
    return JSONResponse(content=result)


@app.post("/inspect/image/file")
async def inspect_image_file(
    image_path: str
):
    """
    Inspect an image file from server filesystem.
    (For testing purposes - not for production use)
    """
    if not os.path.exists(image_path):
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {image_path}"
        )
    
    try:
        pipeline = get_pipeline()
        result = pipeline.inspect_image_file(image_path)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inspection failed: {str(e)}"
        )
    
    return JSONResponse(content=result)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)