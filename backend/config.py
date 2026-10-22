"""Shared settings: API key loading and the one model every agent uses.

The key is read from .env in the repo folder first, then from the folder one level above
(where the teaching staff keep theirs). It is never written in code.
"""

import os
from functools import cache
from pathlib import Path

os.environ.setdefault("PYDANTIC_AI_NO_BANNER", "1")

from dotenv import load_dotenv
from openai import AsyncOpenAI
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.openai import OpenAIProvider

BACKEND = Path(__file__).resolve().parent
ROOT = BACKEND.parent
PROMPTS = BACKEND / "prompts"
OUTPUT = ROOT / "output"

# load_dotenv never overrides a value that is already set, so the repo's own .env wins.
load_dotenv(ROOT / ".env")
load_dotenv(ROOT.parent / ".env")

# Course key rule: gpt-6-luna only. No fallback to any other model.
MODEL_NAME = "gpt-6-luna"
PORTKEY_BASE_URL = "https://api.portkey.ai/v1"


@cache
def build_model() -> OpenAIResponsesModel:
    api_key = os.getenv("PORTKEY_API_KEY")
    if not api_key:
        raise RuntimeError(
            "PORTKEY_API_KEY is not set. Put it in .env in this folder or in the folder one level above."
        )
    client = AsyncOpenAI(
        api_key=api_key,
        base_url=PORTKEY_BASE_URL,
        default_headers={"x-portkey-api-key": api_key},
    )
    return OpenAIResponsesModel(MODEL_NAME, provider=OpenAIProvider(openai_client=client))
