from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os

# We will use the standard google-genai library as the official recommendation
from google import genai
from google.genai import types

# Initialize FastAPI app
app = FastAPI(title="Spilia Retreat AI Chat Backend (Multi-Tenant)")

# Add CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://zagos09.github.io", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client
# It will automatically pick up GEMINI_API_KEY from environment
try:
    client = genai.Client()
except Exception as e:
    # Handle environment where API key might not be set yet
    client = None
    print(f"Warning: Gemini Client not initialized. Make sure GEMINI_API_KEY is set. Error: {e}")

# Multi-Tenant Knowledge Base / System Instructions
# This allows the single backend to serve multiple clients by mapping tenant_id to a system prompt.
TENANT_CONFIGS = {
    "spilia_retreat": {
        "name": "Spilia Retreat",
        "system_instruction": (
            "You are the virtual concierge for Spilia Retreat, a luxury beachfront villa in Kamares, Sifnos, Greece. "
            "You should be polite, elegant, warm, and helpful. Keep responses concise and formatting clean. "
            "Key facts: "
            "1. Location: Kamares, Sifnos, Greece (300m from Kamares Beach). "
            "2. Accommodations: 'Villa — Beach Front' (sleeps 6, 3 bedrooms) and 'One-Bedroom Villa' (sleeps 2). "
            "3. Amenities: Direct sea access, private terraces, free WiFi, A/C, kitchenette, luxury bathrooms. "
            "4. Host: Alex. "
            "5. Contact: hello@spiliaretreat.gr or +30 228 403 3100. "
            "6. Booking: Best rates are available by booking direct. "
            "If asked questions outside the scope of the property, politely deflect."
        )
    },
    # Future clients can be added here
    # "another_hotel": { ... }
}

# Request Models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    tenant_id: str
    message: str
    history: Optional[List[Message]] = []

class ChatResponse(BaseModel):
    response: str
    tenant_id: str

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Client not configured. Missing GEMINI_API_KEY.")

    if req.tenant_id not in TENANT_CONFIGS:
        raise HTTPException(status_code=404, detail=f"Tenant '{req.tenant_id}' not found.")

    tenant = TENANT_CONFIGS[req.tenant_id]
    
    # Format history for Gemini
    formatted_history = []
    for msg in req.history:
        # Map our roles to Gemini roles
        gemini_role = "user" if msg.role == "user" else "model"
        formatted_history.append(
            types.Content(role=gemini_role, parts=[types.Part.from_text(text=msg.content)])
        )

    try:
        # Create a chat session
        # Using the recommended gemini-2.5-pro or flash depending on the need.
        # User specified "Gemini 3.1" (which might be a placeholder for latest), we will use gemini-2.5-flash as default fast model.
        chat = client.chats.create(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                system_instruction=tenant["system_instruction"],
                temperature=0.7,
            )
        )
        
        # We need to prime the chat with history if any, however google.genai chats.create doesn't take history directly in this version
        # Let's use the explicit generate_content with contents array
        
        contents = formatted_history.copy()
        contents.append(
            types.Content(role="user", parts=[types.Part.from_text(text=req.message)])
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=tenant["system_instruction"],
                temperature=0.7,
            )
        )

        return ChatResponse(
            response=response.text,
            tenant_id=req.tenant_id
        )

    except Exception as e:
        print(f"Error calling Gemini: {e}")
        raise HTTPException(status_code=500, detail="Error generating response from AI.")

@app.get("/health")
def health_check():
    return {"status": "ok", "gemini_configured": client is not None}
