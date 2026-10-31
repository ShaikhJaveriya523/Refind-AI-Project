from fastapi.openapi.utils import get_openapi
from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
import torch
import io

app = FastAPI(title="ReFind AI Image Matching Service")
app.openapi_version = "3.0.2"

MODEL_NAME = "openai/clip-vit-base-patch32"

device = "cuda" if torch.cuda.is_available() else "cpu"

print("Loading CLIP AI model...")

model = CLIPModel.from_pretrained(MODEL_NAME)
processor = CLIPProcessor.from_pretrained(MODEL_NAME)

model.to(device)
model.eval()

print("CLIP AI model loaded successfully!")



def get_image_embedding(image):
    image = image.convert("RGB")

    inputs = processor(
        images=image,
        return_tensors="pt"
    ).to(device)

    with torch.no_grad():
        image_features = model.get_image_features(**inputs)

    # Handle different Transformers versions
    if hasattr(image_features, "pooler_output"):
        image_features = image_features.pooler_output
    elif hasattr(image_features, "image_embeds"):
        image_features = image_features.image_embeds

    image_features = image_features / image_features.norm(
        dim=-1,
        keepdim=True
    )

    return image_features


def compare_images(lost_image, found_image):
    lost_embedding = get_image_embedding(lost_image)
    found_embedding = get_image_embedding(found_image)

    similarity = torch.nn.functional.cosine_similarity(
        lost_embedding,
        found_embedding
    )

    score = similarity.item()

    return round(score * 100, 2)


# SINGLE API ENDPOINT
@app.post("/compare")
async def compare_item_images(
    lost_image: UploadFile = File(..., description="Upload lost item image"),
    found_image: UploadFile = File(..., description="Upload found item image")
):
    try:
        lost_contents = await lost_image.read()
        found_contents = await found_image.read()

        lost_img = Image.open(
            io.BytesIO(lost_contents)
        ).convert("RGB")

        found_img = Image.open(
            io.BytesIO(found_contents)
        ).convert("RGB")

        similarity_score = compare_images(
            lost_img,
            found_img
        )

        
        MATCH_THRESHOLD = 80

        is_match = similarity_score >= MATCH_THRESHOLD

        return {
            "success": True,
            "is_match": is_match,
            "similarity_score": similarity_score,
            "message": (
                "Possible matching items found"
                if is_match
                else "No strong image match found"
            )
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Image comparison failed: {str(e)}"
        )

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version="0.1.0",
        routes=app.routes,
    )

    schema = openapi_schema["components"]["schemas"]

    for model_schema in schema.values():
        properties = model_schema.get("properties", {})

        for field_name in ["lost_image", "found_image"]:
            if field_name in properties:
                properties[field_name]["format"] = "binary"

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi
