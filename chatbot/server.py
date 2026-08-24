"""
Web API for the chatbot, so the website can call it instead of the terminal.

This wraps the same LangGraph pipeline from graph.py in a tiny FastAPI app
with one endpoint: POST /chat.

On a free host like Render, the disk is wiped on every restart, so we can't
rely on chroma_db/ already being built — this checks on startup and runs
the same ingestion as ingest.py if it's missing.

Run locally with:
    uvicorn server:app --reload --port 8000
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

if not os.getenv("GOOGLE_API_KEY"):
    raise SystemExit("GOOGLE_API_KEY is not set. Copy .env.example to .env and paste your key in.")

# Build the vector store on first boot if it isn't already on disk.
chroma_dir = Path("chroma_db")
if not chroma_dir.exists() or not any(chroma_dir.iterdir()):
    from ingest import load_and_chunk, build_vector_store
    print("No vector store found — running ingestion...")
    build_vector_store(load_and_chunk())

from graph import build_graph  # noqa: E402  (must come after the ingestion check above)

app = FastAPI(title="BrightSmile Chatbot API")
graph_app = build_graph()

# Which websites are allowed to call this API from the browser.
ALLOWED_ORIGINS = [
    "https://m-i-ayaan.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    expert: str
    expert_reason: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    result = graph_app.invoke({"question": req.question})
    return {
        "answer": result["answer"],
        "expert": result["expert"],
        "expert_reason": result["expert_reason"],
    }
