"""Code-level checks shared by agents' output validators."""

import re

_LATIN = re.compile(r"[A-Za-z]")
_LETTER = re.compile(r"\w", re.UNICODE)
_DIGIT_OR_UNDERSCORE = re.compile(r"[\d_]")


_BR = re.compile(r"<\s*br\s*/?\s*>", re.IGNORECASE)
_PARA = re.compile(r"<\s*/?\s*p\s*>", re.IGNORECASE)
_TAG = re.compile(r"</?[a-zA-Z][^<>]{0,40}>")
_MANY_BLANK = re.compile(r"\n{3,}")


def plain(text: str) -> str:
    """The app shows plain text, but the model sometimes writes HTML line breaks (<br>) or tags. Convert them."""
    text = _BR.sub("\n", text)
    text = _PARA.sub("\n\n", text)
    text = _TAG.sub("", text)
    return _MANY_BLANK.sub("\n\n", text).strip()


def clean(value):
    """Applies plain() to every string inside a model output (nested models and lists included)."""
    from pydantic import BaseModel

    if isinstance(value, str):
        return plain(value)
    if isinstance(value, list):
        return [clean(v) for v in value]
    if isinstance(value, BaseModel):
        return value.model_copy(update={k: clean(getattr(value, k)) for k in type(value).model_fields})
    return value


def not_english(texts: list[str]) -> list[str]:
    """Returns the texts that are mostly non-Latin script. Used when a field must be in English.

    Placeholders and quotes may contain other scripts, so a text only fails if less than half of
    its letters are Latin.
    """
    bad = []
    for t in texts:
        letters = [c for c in t if _LETTER.match(c) and not _DIGIT_OR_UNDERSCORE.match(c)]
        if len(letters) >= 4 and sum(bool(_LATIN.match(c)) for c in letters) < len(letters) / 2:
            bad.append(t)
    return bad


# The model sometimes guesses the child's gender from their name ("她"). In Chinese the neutral written
# form "Ta" is common, so a single "她/他" in text for the parent becomes "Ta". "他们/她们/其他" are kept.
_GENDERED_ZH = re.compile(r"(?<!其)[她他](?![们們])")


def neutral_zh(text: str) -> str:
    return _GENDERED_ZH.sub("Ta", text)
