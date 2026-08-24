"""
STEP 3: the chat interface.

Runs a tiny intake "survey" first (like a real clinic's front desk would ask),
then lets you ask dental questions in a loop. Each question goes through the
LangGraph pipeline defined in graph.py: retrieve -> route_expert -> generate.

Run with:
    python chat.py
"""

import os
import sys
from dotenv import load_dotenv
from graph import build_graph

load_dotenv()


def run_intake_survey():
    print("=== BrightSmile Dental Clinic — Quick Intake ===")
    name = input("Your name: ").strip()
    concern = input("What's the main concern today (e.g. tooth pain, whitening, checkup)? ").strip()
    urgency = input("Is this urgent / painful right now? (yes/no): ").strip().lower()

    print(f"\nThanks {name}! Let's find the right info and specialist for you.\n")

    # Fold the survey answers into the first question so the graph's
    # retrieval step has real context to search with.
    opener = f"{concern}."
    if urgency.startswith("y"):
        opener += " This is urgent and currently painful."
    return opener


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # so the ₹ symbol prints correctly on Windows
    if not os.getenv("GOOGLE_API_KEY"):
        raise SystemExit("GOOGLE_API_KEY is not set. Copy .env.example to .env and paste your key in.")

    app = build_graph()
    first_question = run_intake_survey()
    question = first_question

    while True:
        result = app.invoke({"question": question})
        print(f"\nRecommended specialist: {result['expert']}  ({result['expert_reason']})")
        print(f"\nBrightSmile Assistant: {result['answer']}\n")

        question = input("Ask another question (or type 'exit'): ").strip()
        if question.lower() in {"exit", "quit", ""}:
            print("Thanks for visiting BrightSmile Dental Clinic!")
            break


if __name__ == "__main__":
    main()
