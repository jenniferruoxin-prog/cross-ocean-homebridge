"""Letter Explorer (parent side): reads a letter the child sent and suggests what the parent could look up.

Input is text and/or images (the browser cuts a long image into pieces and renders PDF pages to images,
because the model reads images far more accurately than image-only PDFs).
An output validator checks that every place and search idea quotes the letter, so nothing is invented.
"""

import logging
import re
from functools import cache

from pydantic_ai import Agent, BinaryContent, ModelRetry, RunContext
from pydantic_ai.usage import UsageLimits

import usage_log
from agents.bridge import profile_block
from agents.checks import clean, neutral_zh
from agents.digest import decode_photo
from config import PROMPTS, build_model
from models import ExploreReply, ExploreRequest, ExploreResponse

LIMITS = UsageLimits(request_limit=4, total_tokens_limit=80_000)
log = logging.getLogger("homebridge.explore")

# Spaces and punctuation are ignored when checking a quote, so small transcription differences do not matter.
_IGNORE = re.compile(r"[\s\W_]+", re.UNICODE)


def _norm(s: str) -> str:
    return _IGNORE.sub("", s).lower()


@cache
def letter_explorer() -> Agent[ExploreRequest, ExploreReply]:
    agent = Agent(
        build_model(),
        deps_type=ExploreRequest,
        output_type=ExploreReply,
        instructions=(PROMPTS / "letter_explorer.md").read_text(encoding="utf-8"),
        retries=3,
    )

    @agent.output_validator
    def grounded(ctx: RunContext[ExploreRequest], out: ExploreReply) -> ExploreReply:
        # Grounding guard: every suggestion must quote the letter (the transcript or the pasted text).
        source = _norm(out.transcript + " " + ctx.deps.text)
        quotes = [p.evidence for p in out.places] + [s.evidence for s in out.search_ideas]
        missing = [q for q in quotes if not _norm(q) or _norm(q) not in source]
        if missing:
            message = (
                f"These evidence quotes are not in the letter: {missing}. Copy each quote exactly from the transcript, "
                "or remove the place or idea if the letter does not mention it."
            )
            log.warning("Letter Explorer sent back: %s", message)
            usage_log.guard("letter_explorer", message)
            raise ModelRetry(message)
        return out

    return agent


def build_prompt(req: ExploreRequest) -> str:
    return (
        f"{profile_block(req.profile)}\n\n"
        f"The parent is reading a letter from their child. Images attached: {len(req.images)} "
        f"(in order, top to bottom).\n\n"
        f"<letter_text>\n{req.text.strip() or '(no text given; read it from the images)'}\n</letter_text>\n\n"
        f"LANGUAGE CHECK: write summary, places, search ideas, conversation starters and watch_outs in "
        f"{req.profile.parent_language}. Keep english_name and query_english in English."
    )


async def explore_letter(req: ExploreRequest) -> ExploreResponse:
    if not req.text.strip() and not req.images:
        raise ValueError("Add the letter as an image, a PDF, or text first.")
    images: list[BinaryContent] = [decode_photo(i.data_url) for i in req.images]
    result = await letter_explorer().run([build_prompt(req), *images], deps=req, usage_limits=LIMITS)
    out = clean(result.output)
    if req.profile.parent_language in ("Simplified Chinese", "Traditional Chinese"):
        out = neutral_pronouns(out)
    return ExploreResponse(explore=out, usage=usage_log.record("letter_explorer", result.usage))


def neutral_pronouns(out: ExploreReply) -> ExploreReply:
    fix = neutral_zh
    return out.model_copy(
        update={
            "summary": fix(out.summary),
            "places": [p.model_copy(update={"what_it_is": fix(p.what_it_is)}) for p in out.places],
            "search_ideas": [i.model_copy(update={"why": fix(i.why)}) for i in out.search_ideas],
            "conversation_starters": [fix(c) for c in out.conversation_starters],
            "watch_outs": [fix(w) for w in out.watch_outs],
        }
    )
