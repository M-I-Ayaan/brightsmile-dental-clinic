# BrightSmile Dental Clinic

A dental clinic website with an **AI Assistant** as its main feature — a
retrieval-augmented (RAG) chatbot that answers questions about services,
₹ pricing, and which specialist to see, grounded in real clinic data instead
of guessing.

- **Live site:** https://m-i-ayaan.github.io/brightsmile-dental-clinic/
- **Chatbot API:** https://brightsmile-dental-clinic.onrender.com (FastAPI, hosted on Render)

> Demo/student project — not a real clinic.

## ✨ Main Feature: AI Assistant (RAG Chatbot)

The chatbot is the centerpiece of this project, front and center on the site
rather than tucked away:

| Feature | Specification |
|---|---|
| **Floating widget** | Fixed-position panel, bottom-right, 380×520px, glassmorphism (backdrop blur), opens/closes with a scale + fade transition |
| **Auto pop-up** | A hint bubble appears ~1.8s after page load; if not dismissed, the full chat panel auto-opens ~4.5s after load (once per browser session, via `sessionStorage`) |
| **Attention cues** | Pulsing ring animation + bouncing "AI" badge on the toggle button so the feature is immediately noticeable |
| **Hero call-to-action** | A dedicated animated button in the hero section ("Try our AI Assistant") also opens the chat panel |
| **Multiple open/close controls** | Toggle button, in-panel close (×) button, hero CTA, and clicking the hint bubble — all wired to the same open/close state |
| **Accessibility** | `aria-expanded`/`aria-hidden` state sync, keyboard-focusable controls, respects `prefers-reduced-motion` (disables the pulse/bounce animations) |

### How the RAG pipeline works

```
User question
     │
     ▼
[retrieve]  — embeds the question, does a vector similarity search against
              Chroma for the closest clinic-data chunks (services + ₹ prices)
     │
     ▼
[route_expert] — an LLM call (structured output) picks the right dentist
                  based ONLY on the retrieved chunks
     │
     ▼
[generate]  — the final answer is generated using ONLY the retrieved text
              as context, so prices stay consistent instead of the model
              guessing a different number each time
     │
     ▼
JSON response → rendered in the chat widget
```

| Layer | Tech |
|---|---|
| Orchestration | **LangGraph** (`StateGraph`: retrieve → route_expert → generate) |
| Retrieval / chaining | **LangChain** |
| LLM + embeddings | **Google Gemini** (`gemini-3.6-flash`, `gemini-embedding-001`) — free tier |
| Vector store | **Chroma** (local, chunked from `chatbot/data/services_pricing.md`) |
| Backend API | **FastAPI** + Uvicorn, CORS-restricted to the site's origin |
| Hosting | Backend on **Render** (free tier); frontend on **GitHub Pages** |

Full setup/run instructions for the chatbot are in [chatbot/README.md](chatbot/README.md).

## Website features

- Icy/glass design system with a toggleable **dark mode** (persisted, respects system preference)
- Animated hero (gradient blobs, cursor glow), glassmorphism header & cards
- "See the Transformation" — a nostalgic, keyboard-accessible before/after smile slider
- Services, doctors, testimonials, FAQ accordion, validated appointment booking form
- Accessibility: skip link, `aria-expanded` states, focus-visible outlines, `prefers-reduced-motion` support

## Tech stack

**Frontend:** HTML, CSS, vanilla JS (no framework/build step)
**Chatbot backend:** Python, FastAPI, LangChain, LangGraph, Chroma, Google Gemini API

## Credits

Designed & built by [Ayaan](https://github.com/M-I-Ayaan) with [Claude AI](https://claude.ai).
