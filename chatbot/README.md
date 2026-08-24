# BrightSmile RAG Chatbot

A small chatbot that answers dental questions using **RAG (Retrieval-Augmented
Generation)** so prices and service info stay consistent, instead of an LLM
guessing/hallucinating a different number each time.

## How it works (the 3 files that matter)

| File | What it does |
|---|---|
| `data/services_pricing.md` | The "source of truth" — our real service list & ₹ prices. |
| `ingest.py` | Splits that file into chunks, embeds them, saves them to a local vector DB (Chroma). Run once. |
| `graph.py` | The LangGraph pipeline: `retrieve -> route_expert -> generate`. This is the chatbot's brain. |
| `chat.py` | The command-line chat loop you actually run. |

### The core idea (RAG)
1. **Chunk** the knowledge base into small self-contained pieces (one per service).
2. **Embed** each chunk into a vector (numbers representing meaning) and store it.
3. When a user asks something, embed *their question* the same way and find the
   chunks whose vectors are closest (**retrieval**).
4. Hand only those chunks to the LLM and say "answer using ONLY this text"
   (**generation**) — so the ₹ price it quotes is always the one from your file,
   never invented.

### The LangGraph part
`graph.py` defines a `StateGraph` — think of it as a flowchart:

```
START -> retrieve -> route_expert -> generate -> END
```

Each node is a plain Python function that reads/writes a shared `state` dict.
`route_expert` is the "determine specific expert" step your teacher wants —
it looks at the retrieved chunks (which already list a `Recommended Specialist`
per service) and asks the LLM to pick the right dentist for the question.

## Setup

```bash
cd chatbot
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Get a **free** Gemini API key at https://aistudio.google.com/apikey, then:

```bash
copy .env.example .env
```

Open `.env` and paste your key in place of `paste-your-gemini-api-key-here`.

## Run it

```bash
python ingest.py   # builds the vector database (run once, or after editing data/services_pricing.md)
python chat.py      # start chatting
```

## Ideas to extend this (good next learning steps)
- Add more `.md` files to `data/` (e.g. FAQs, insurance policy) and re-run `ingest.py`.
- Make the intake survey branch — e.g. if `urgency == yes`, add a LangGraph
  conditional edge straight to an "emergency" node.
- Swap the CLI in `chat.py` for a small Flask/FastAPI server + the dental
  website's front end, so it's a real web chat widget.
- Add a `memory`/chat history so follow-up questions ("how long does that take?")
  know what "that" refers to.
