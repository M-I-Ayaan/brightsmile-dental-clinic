"""
STEP 2 OF RAG: the actual pipeline, built as a LangGraph graph.

LangGraph models the chatbot as a STATE MACHINE:
  - STATE = a dict that gets passed from node to node, each node can read
    from it and add new keys to it.
  - NODES = plain Python functions. Each one does one job.
  - EDGES = the wiring that says which node runs after which.

Our graph has 3 nodes, run in a straight line:

    retrieve  ->  route_expert  ->  generate

  1. retrieve      : turns the user's question into a vector, searches Chroma
                      for the most similar chunks (the actual price/service info).
  2. route_expert   : looks at what was retrieved and decides which dentist
                      the patient should see (this is the "determine specific
                      expert" part your teacher asked for).
  3. generate       : asks the LLM to write the final answer, but ONLY using
                      the retrieved chunks as its source of truth — this is
                      what stops the price from "varying every time".
"""

import os
import sys
from typing import TypedDict, List
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_core.documents import Document
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langgraph.graph import StateGraph, START, END

load_dotenv()

PERSIST_DIR = "chroma_db"
COLLECTION_NAME = "dental_services"


# ---- 1. Define the shared State ----------------------------------------
class ChatState(TypedDict):
    question: str
    context: List[Document]
    expert: str
    expert_reason: str
    answer: str


# ---- 2. Set up the models we reuse across nodes -------------------------
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
llm = ChatGoogleGenerativeAI(model="gemini-flash-lite-latest", temperature=0.2)

vector_store = Chroma(
    collection_name=COLLECTION_NAME,
    embedding_function=embeddings,
    persist_directory=PERSIST_DIR,
)
retriever = vector_store.as_retriever(search_kwargs={"k": 3})


# ---- 3. Node: retrieve ---------------------------------------------------
def retrieve(state: ChatState) -> dict:
    docs = retriever.invoke(state["question"])
    return {"context": docs}


# ---- 4. Node: route_expert ------------------------------------------------
class ExpertRecommendation(BaseModel):
    specialist: str = Field(description="Name and role of the recommended dentist, e.g. 'Dr. Michael Chen (Oral Surgeon)'")
    reason: str = Field(description="One short sentence on why this specialist fits the question")


router_llm = llm.with_structured_output(ExpertRecommendation)


def route_expert(state: ChatState) -> dict:
    context_text = "\n\n".join(doc.page_content for doc in state["context"])
    prompt = (
        "Based ONLY on the clinic info below, recommend which specialist the "
        "patient should see for their question. If the info doesn't name one, "
        "say 'Dr. Emily Carter (General Dentist)' for a general checkup first.\n\n"
        f"Clinic info:\n{context_text}\n\nPatient question: {state['question']}"
    )
    result = router_llm.invoke(prompt)
    return {"expert": result.specialist, "expert_reason": result.reason}


# ---- 5. Node: generate -----------------------------------------------------
def extract_text(content) -> str:
    """Gemini 3.x sometimes returns content as a list of blocks (text +
    reasoning signature) instead of a plain string — pull just the text out."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in content
        )
    return str(content)


def generate(state: ChatState) -> dict:
    context_text = "\n\n".join(doc.page_content for doc in state["context"])
    prompt = (
        "You are the BrightSmile Dental Clinic assistant. Answer the patient's "
        "question using ONLY the clinic info below — do not invent prices or "
        "services that aren't listed. Quote the exact ₹ price range from the "
        "info. Keep the answer short and friendly (3-5 sentences), then end "
        f"with a line recommending {state['expert']} ({state['expert_reason']}).\n\n"
        f"Clinic info:\n{context_text}\n\nPatient question: {state['question']}"
    )
    response = llm.invoke(prompt)
    return {"answer": extract_text(response.content)}


# ---- 6. Wire the graph together --------------------------------------------
def build_graph():
    graph = StateGraph(ChatState)
    graph.add_node("retrieve", retrieve)
    graph.add_node("route_expert", route_expert)
    graph.add_node("generate", generate)

    graph.add_edge(START, "retrieve")
    graph.add_edge("retrieve", "route_expert")
    graph.add_edge("route_expert", "generate")
    graph.add_edge("generate", END)

    return graph.compile()


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")  # so the ₹ symbol prints correctly on Windows
    if not os.getenv("GOOGLE_API_KEY"):
        raise SystemExit("GOOGLE_API_KEY is not set. Copy .env.example to .env and paste your key in.")
    app = build_graph()
    result = app.invoke({"question": "My tooth has been throbbing for two days, what should I do and how much will it cost?"})
    print("\nRecommended specialist:", result["expert"])
    print("\nAnswer:\n", result["answer"])
