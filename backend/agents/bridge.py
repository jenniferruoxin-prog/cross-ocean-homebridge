"""Bridge agent: rewrites a student's message for their parents, or explains a parent's message.

Works in both directions and adapts tone to the parents' language and culture,
using the family profile the student saved.
"""

from functools import cache

from pydantic_ai import Agent, ModelRetry, RunContext
from pydantic_ai.usage import UsageLimits

import usage_log
from agents.checks import clean, not_english
from config import PROMPTS, build_model
from models import BridgeReply, BridgeRequest, BridgeResponse, FamilyProfile, HistoryItem

# One reply normally takes a single model request; these stop a runaway loop or a huge prompt.
LIMITS = UsageLimits(request_limit=3, total_tokens_limit=20_000)


@cache
def bridge_agent() -> Agent[BridgeRequest, BridgeReply]:
    agent = Agent(
        build_model(),
        deps_type=BridgeRequest,
        output_type=BridgeReply,
        # Static text first and always identical, so the provider can cache it across calls.
        instructions=(PROMPTS / "bridge.md").read_text(encoding="utf-8")
        + "\n\n"
        + (PROMPTS / "parent_communication_guide.md").read_text(encoding="utf-8"),
        retries=2,
    )

    @agent.output_validator
    def user_can_read_it(ctx: RunContext[BridgeRequest], out: BridgeReply) -> BridgeReply:
        # Language guard: chat history in another language can pull explanations away from English.
        if user_language(ctx.deps) == "English":
            wrong = not_english(
                [
                    out.message_to_send_meaning,
                    out.their_message_translated,
                    *out.reading_between_lines,
                    *out.watch_outs,
                    *(a.meaning for a in out.optional_additions),
                ]
            )
            if wrong:
                usage_log.guard("bridge", "language")
                raise ModelRetry(f"Every field except message_to_send and optional_additions[].text must be in English. These are not: {wrong}")
        return out

    return agent


def user_language(req: BridgeRequest) -> str:
    p = req.profile
    return p.student_language if req.direction.endswith("_parents") else p.parent_language


def profile_block(p: FamilyProfile) -> str:
    return (
        "<family_profile>\n"
        f"Student name: {p.student_name or 'not given'}\n"
        f"Student calls their parents: {p.parent_names}\n"
        f"Parents' language: {p.parent_language}\n"
        f"Student's language: {p.student_language}\n"
        f"Parents' home country: {p.home_country}\n"
        f"Student's school: {p.school or 'not given'}\n"
        f"Student time zone: {p.student_timezone}\n"
        f"Parents' time zone: {p.parent_timezone}\n"
        f"Family notes from the student: {p.family_notes or 'none'}\n"
        "</family_profile>"
    )


# Old messages only give context, so each one is shortened to keep the prompt (and cost) small.
HISTORY_CHARS = 500


def history_block(history: list[HistoryItem]) -> str:
    if not history:
        return ""
    lines = []
    for h in history:
        who = "STUDENT → PARENTS" if h.writer == "student" else "PARENTS → STUDENT"
        text = " ".join(h.text.split())
        if len(text) > HISTORY_CHARS:
            text = text[:HISTORY_CHARS] + "…"
        lines.append(f"[{h.time}] {who}: {text}")
    return "<conversation_history>\n" + "\n".join(lines) + "\n</conversation_history>\n\n"


TASKS = {
    "to_parents": "Rewrite the student's draft below for their parents.",
    "from_parents": "Explain the parents' message below to the student and suggest a reply.",
    "to_child": "Rewrite the parent's draft below for their child.",
    "from_child": "Explain the child's message below to the parent and suggest a reply.",
}


def build_prompt(req: BridgeRequest) -> str:
    p = req.profile
    student_is_user = req.direction.endswith("_parents")
    user, user_lang, other_lang = (
        ("STUDENT", p.student_language, p.parent_language)
        if student_is_user
        else ("PARENT", p.parent_language, p.student_language)
    )
    tag = "draft" if req.direction.startswith("to_") else "received_message"
    return (
        f"{profile_block(p)}\n\n"
        f"{history_block(req.history)}"
        f"TASK: {req.direction}. {TASKS[req.direction]}\n"
        f"USER: {user}\nUSER LANGUAGE: {user_lang}\nOTHER LANGUAGE: {other_lang}\n\n"
        f"<{tag}>\n{req.text}\n</{tag}>\n\n"
        # Stated last because Chinese/Hindi history or messages can pull the model into the wrong language.
        f"LANGUAGE CHECK: write message_to_send and optional_additions[].text in {other_lang}. "
        f"Write every other field (their_message_translated, message_to_send_meaning, reading_between_lines, "
        f"optional_additions[].meaning, watch_outs) in {user_lang}."
    )


async def run_bridge(req: BridgeRequest) -> BridgeResponse:
    result = await bridge_agent().run(build_prompt(req), deps=req, usage_limits=LIMITS)
    usage = usage_log.record("bridge", result.usage)
    return BridgeResponse(reply=clean(result.output), usage=usage)
