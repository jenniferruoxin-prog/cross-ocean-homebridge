"""Weekly Digest: two agents in a pipeline, with the student deciding in between.

1. Photo Reader (vision): one run per photo, in parallel. Reports what is visible and flags privacy risks.
2. The student unticks any photo they do not want to share (flagged photos start unticked in the UI).
3. Digest Writer (text only): writes the weekly update from the student's notes and the chosen photos.
   An output validator checks that every highlight cites a real source, so facts cannot be invented.
"""

import asyncio
import logging
import base64
import binascii
import re
from functools import cache

from pydantic_ai import Agent, BinaryContent, ModelRetry, RunContext
from pydantic_ai.usage import UsageLimits

import usage_log
from agents.bridge import profile_block
from agents.checks import clean, not_english
from config import PROMPTS, build_model
from models import (
    DigestPhoto,
    DigestReply,
    DigestRequest,
    DigestResponse,
    PhotoFacts,
    PhotoReadRequest,
    PhotoReadResponse,
    UsageInfo,
)

PHOTO_LIMITS = UsageLimits(request_limit=2, total_tokens_limit=15_000)
WRITER_LIMITS = UsageLimits(request_limit=5, total_tokens_limit=60_000)
DATA_URL = re.compile(r"^data:(image/(?:jpeg|png|webp));base64,(.+)$", re.DOTALL)
MAX_PHOTO_BYTES = 3_000_000


@cache
def photo_reader() -> Agent[None, PhotoFacts]:
    return Agent(
        build_model(),
        output_type=PhotoFacts,
        instructions=(PROMPTS / "photo_reader.md").read_text(encoding="utf-8"),
        retries=1,
    )


@cache
def digest_writer() -> Agent[DigestRequest, DigestReply]:
    agent = Agent(
        build_model(),
        deps_type=DigestRequest,
        output_type=DigestReply,
        instructions=(PROMPTS / "digest_writer.md").read_text(encoding="utf-8")
        + "\n\n"
        + (PROMPTS / "parent_communication_guide.md").read_text(encoding="utf-8"),
        retries=3,
    )

    @agent.output_validator
    def sources_are_real(ctx: RunContext[DigestRequest], out: DigestReply) -> DigestReply:
        # Fact guard: every highlight must point at the notes or a photo the student chose to share.
        included = {p.number for p in ctx.deps.photos}
        has_notes = bool(ctx.deps.notes.strip())
        bad = []
        for h in out.highlights:
            src = h.source.strip().lower()
            m = re.fullmatch(r"photo\s*(\d+)", src)
            if src == "notes" and has_notes:
                continue
            if src.startswith("background"):  # general public info about a place; the student verifies it
                continue
            if m and int(m.group(1)) in included:
                continue
            bad.append(h.source)
        bad_captions = [c.number for c in out.photo_captions if c.number not in included]
        if bad or bad_captions:
            raise retry(
                f"These sources do not exist: {bad + [f'caption for photo {n}' for n in bad_captions]}. "
                f"Valid sources are 'notes'{' (none given)' if not has_notes else ''}, 'background: <place>', and photo numbers "
                f"{sorted(included) or 'none'}. Remove any fact without a valid source from the letter and highlights."
            )
        # Length guard for "rich": a vivid letter, unless there is too little material to write one honestly.
        material = len(ctx.deps.photos) + len([ln for ln in ctx.deps.notes.splitlines() if ln.strip()])
        size, minimum, unit = letter_size(out.letter)
        if ctx.deps.style == "rich" and material >= 3 and size < minimum:
            raise retry(
                f"STYLE is rich but the letter is only {size} {unit}; write at least {minimum} {unit}. Expand each "
                "moment into its own small scene with photo details, atmosphere, and place background. Do not add "
                "personal facts that are not in the notes or photos."
            )
        # Voice guard: the student was there, so the letter must not describe the week like an outsider.
        hedges = sorted({h for h in HEDGES.findall(out.letter)})
        if hedges:
            raise retry(
                f"The letter uses observer or hedging phrases {hedges}. The student took these photos and was there: "
                "rewrite those sentences in the first person, describing directly what they saw and felt."
            )
        # Language guard: the student-facing notes must be readable by the student.
        if ctx.deps.profile.student_language == "English":
            wrong = not_english(
                [out.letter_meaning, *out.how_i_wrote_it, *out.watch_outs, *(a.meaning for a in out.optional_additions)]
            )
            if wrong:
                raise retry(
                    "letter_meaning, how_i_wrote_it, watch_outs and optional_additions[].meaning must be in English. "
                    f"These are not: {wrong}"
                )
        return out

    return agent


log = logging.getLogger("homebridge.digest")


def retry(message: str) -> ModelRetry:
    """Every guard rejection is logged, so the report can show how often each guard fires."""
    log.warning("Digest Writer sent back: %s", message)
    usage_log.guard("digest_writer", message)
    return ModelRetry(message)


# Observer/hedging phrases that make the letter sound like someone else looking at the photos.
HEDGES = re.compile(
    r"看起来|看上去|似乎|好像是|可能是|照片里能看到|照片里可以看到|照片中可以看到|从照片(?:上|里)?看"
    r"|\blooks? like\b|\bseems?\b|\bappears? to\b|\bin the photo,? you can see\b",
    re.IGNORECASE,
)

CJK = re.compile(r"[぀-ヿ㐀-鿿가-힯]")


def letter_size(text: str) -> tuple[int, int, str]:
    """Length of a letter and the "rich" minimum: characters for Chinese/Japanese/Korean, words otherwise."""
    cjk = len(CJK.findall(text))
    if cjk > len(text) / 3:
        return cjk, 400, "characters"
    return len(text.split()), 250, "words"


def decode_photo(data_url: str) -> BinaryContent:
    m = DATA_URL.match(data_url)
    if not m:
        raise ValueError("Photos must be JPEG, PNG, or WebP images.")
    try:
        data = base64.b64decode(m.group(2), validate=True)
    except binascii.Error:
        raise ValueError("A photo could not be read.")
    if len(data) > MAX_PHOTO_BYTES:
        raise ValueError("A photo is too large.")
    return BinaryContent(data=data, media_type=m.group(1))


async def read_one(photo: BinaryContent, school: str) -> tuple[PhotoFacts, UsageInfo]:
    where = f"The student studies at {school}." if school else "The student's school is not given."
    result = await photo_reader().run(
        [f"Describe this photo from the student's week. {where}", photo], usage_limits=PHOTO_LIMITS
    )
    return result.output, usage_log.record("photo_reader", result.usage)


async def read_photos(req: PhotoReadRequest) -> PhotoReadResponse:
    images = [decode_photo(p.data_url) for p in req.photos]
    results = await asyncio.gather(*(read_one(img, req.profile.school) for img in images))
    return PhotoReadResponse(
        photos=[clean(facts) for facts, _ in results],
        usage=usage_log.total([u for _, u in results]),
    )


def photo_line(p: DigestPhoto) -> str:
    f = p.facts
    parts = [f"Photo {p.number}: {f.description}", f"activity: {f.activity}", f"setting: {f.setting}", f"mood: {f.mood}"]
    if f.possible_place:
        parts.append(f"possible place: {f.possible_place}")
    if f.visual_details:
        parts.append("visual details: " + "; ".join(f.visual_details))
    if f.visible_text:
        parts.append(f"text in photo (data): {f.visible_text}")
    return " | ".join(parts)


def build_writer_prompt(req: DigestRequest) -> str:
    photos = "\n".join(photo_line(p) for p in req.photos)
    lang = req.profile
    return (
        f"{profile_block(req.profile)}\n\n"
        f"<student_notes>\n{req.notes.strip() or '(no notes)'}\n</student_notes>\n\n"
        f"<photos>\n{photos or '(no photos)'}\n</photos>\n\n"
        f"STYLE: {req.style}\n\n"
        f"LANGUAGE CHECK: write title, letter, highlights[].text, photo_captions and optional_additions[].text "
        f"in {lang.parent_language}. Write letter_meaning, how_i_wrote_it, optional_additions[].meaning and "
        f"watch_outs in {lang.student_language}."
    )


async def write_digest(req: DigestRequest) -> DigestResponse:
    result = await digest_writer().run(build_writer_prompt(req), deps=req, usage_limits=WRITER_LIMITS)
    return DigestResponse(digest=clean(result.output), usage=usage_log.record("digest_writer", result.usage))
