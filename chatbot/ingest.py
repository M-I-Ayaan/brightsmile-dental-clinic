"""
STEP 1 OF RAG: "Ingestion"

This script reads our knowledge base file (data/services_pricing.md),
splits it into small self-contained CHUNKS, turns each chunk into a vector
(a list of numbers that captures its meaning) using an EMBEDDING model, and
saves those vectors into a local vector database (Chroma).

Why chunks instead of dumping the whole file into the prompt every time?
- Cheaper & faster: only the 2-3 relevant chunks get sent to the LLM, not
  the whole document.
- More accurate: the LLM is grounded in the exact retrieved text, so prices
  stay consistent instead of the model "remembering" a different number
  each time it's asked.

Run this ONCE (or whenever data/services_pricing.md changes):
    python ingest.py
"""

import os
from dotenv import load_dotenv
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

load_dotenv()

DATA_FILE = os.path.join("data", "services_pricing.md")
PERSIST_DIR = "chroma_db"
COLLECTION_NAME = "dental_services"


def load_and_chunk():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        raw_text = f.read()

    # 1st pass: split on markdown headers ("## Service Name") so each chunk
    # stays a complete, self-contained service entry (name + price + specialist).
    header_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=[("##", "service_name")]
    )
    header_chunks = header_splitter.split_text(raw_text)

    # 2nd pass: safety net — if any section is still too long, break it down
    # further so each chunk stays small enough for accurate retrieval.
    char_splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=50)
    final_chunks = char_splitter.split_documents(header_chunks)

    print(f"Loaded {len(header_chunks)} sections -> split into {len(final_chunks)} chunks.")
    return final_chunks


def build_vector_store(chunks):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=COLLECTION_NAME,
        persist_directory=PERSIST_DIR,
    )
    print(f"Saved {len(chunks)} chunks into Chroma at ./{PERSIST_DIR}")
    return vector_store


if __name__ == "__main__":
    if not os.getenv("GOOGLE_API_KEY"):
        raise SystemExit(
            "GOOGLE_API_KEY is not set. Copy .env.example to .env and paste your key in."
        )
    chunks = load_and_chunk()
    build_vector_store(chunks)
