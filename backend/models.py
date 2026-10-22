"""Pydantic types shared by the API and the agents."""

from typing import Literal

from pydantic import BaseModel, Field


class FamilyProfile(BaseModel):
    """What the agents know about one student's family. Saved in the browser for now."""

    student_name: str = Field("", max_length=60)
    parent_names: str = Field("Mom and Dad", max_length=60, description="How the student addresses them")
    parent_language: str = Field("Simplified Chinese", max_length=40)
    student_language: str = Field("English", max_length=40, description="Language the student reads best")
    home_country: str = Field("China", max_length=60)
    school: str = Field("", max_length=100, description="The student's university, e.g. 'Yale University'")
    student_timezone: str = Field("America/New_York", max_length=60)
    parent_timezone: str = Field("Asia/Shanghai", max_length=60)
    family_notes: str = Field(
        "", max_length=1000, description="Sensitive topics, what parents worry about, family habits"
    )


Direction = Literal["to_parents", "from_parents", "to_child", "from_child"]


class HistoryItem(BaseModel):
    """One message the family actually exchanged (what the other side saw). Kept in the browser."""

    time: str = Field(max_length=40)
    writer: Literal["student", "parent"]
    text: str = Field(max_length=3000)


MAX_HISTORY = 8


class BridgeRequest(BaseModel):
    """to_* = the user wrote a draft for the other side; from_* = the user received a message.
    *_parents directions are used by the student, *_child directions by a parent."""

    direction: Direction
    text: str = Field(min_length=1, max_length=3000)
    profile: FamilyProfile
    history: list[HistoryItem] = Field(default_factory=list, max_length=MAX_HISTORY)


class OptionalAddition(BaseModel):
    text: str = Field(description="The sentence in the OTHER LANGUAGE (the recipient's)")
    meaning: str = Field(description="Its meaning in the USER LANGUAGE")


class BridgeReply(BaseModel):
    """Structured output of the Bridge agent. See prompts/bridge.md for which language each field uses."""

    message_to_send: str = Field(
        description="to_*: the rewritten message. from_*: a suggested reply. In the OTHER LANGUAGE."
    )
    message_to_send_meaning: str = Field(
        description="Faithful translation of exactly what you wrote in message_to_send, in the USER LANGUAGE."
    )
    their_message_translated: str = Field(
        "",
        description=(
            "from_* only: faithful translation of the RECEIVED message (what the other side wrote, "
            "not your reply) into the USER LANGUAGE. Empty string for to_*."
        ),
    )
    reading_between_lines: list[str] = Field(
        min_length=2,
        max_length=4,
        description="to_*: what was changed and why. from_*: what the other side may really mean. USER LANGUAGE.",
    )
    optional_additions: list[OptionalAddition] = Field(
        default_factory=list,
        max_length=3,
        description="Extra sentences that depend on facts the writer did not give. The user chooses whether to add them.",
    )
    watch_outs: list[str] = Field(
        default_factory=list,
        description="Anything the user should double-check before sending. USER LANGUAGE.",
    )


class UsageInfo(BaseModel):
    input_tokens: int
    cached_input_tokens: int
    output_tokens: int
    requests: int


class BridgeResponse(BaseModel):
    reply: BridgeReply
    usage: UsageInfo


# ---------- Weekly Digest ----------

MAX_PHOTOS = 8


class PhotoUpload(BaseModel):
    # The browser shrinks each photo (and drops its location data) before sending it as a data URL.
    data_url: str = Field(max_length=4_000_000)


class PhotoReadRequest(BaseModel):
    profile: FamilyProfile
    photos: list[PhotoUpload] = Field(min_length=1, max_length=MAX_PHOTOS)


class PhotoFacts(BaseModel):
    """Output of the Photo Reader agent for one photo. Factual, in English."""

    description: str = Field(description="1-2 sentences: what is visibly in the photo. Only what can be seen.")
    activity: str = Field(description="What the student seems to be doing, or 'unclear'.")
    setting: str = Field(description="Kind of place, e.g. 'campus library', 'dorm kitchen', 'city street', or 'unclear'.")
    mood: str = Field(description="Overall mood the photo suggests, e.g. 'relaxed', 'busy', 'celebrating', or 'unclear'.")
    visual_details: list[str] = Field(
        default_factory=list,
        max_length=6,
        description="3-6 concrete visual details a writer could use to paint the scene: light, colours, textures, "
        "architecture, food, weather. Only what is visible.",
    )
    possible_place: str = Field(
        "",
        description="If the setting looks like a well-known place at the student's school (or the text shows it), "
        "name it with 'likely' or 'possibly', e.g. 'likely the Yale University Art Gallery'. Empty if unsure.",
    )
    visible_text: str = Field(
        "", description="Any readable text in the photo, quoted as data. Empty if none."
    )
    privacy_flags: list[str] = Field(
        default_factory=list,
        description="Things to check before sharing with parents (see prompt). Empty if nothing.",
    )
    share_recommendation: Literal["share", "check"] = Field(
        description="'check' if any privacy flag would reasonably make the student hesitate, else 'share'."
    )


class PhotoReadResponse(BaseModel):
    photos: list[PhotoFacts]
    usage: UsageInfo


class DigestPhoto(BaseModel):
    number: int = Field(ge=1, le=MAX_PHOTOS, description="Photo number as shown to the student")
    facts: PhotoFacts


class DigestRequest(BaseModel):
    profile: FamilyProfile
    notes: str = Field("", max_length=2000)
    style: Literal["short", "rich"] = "rich"
    photos: list[DigestPhoto] = Field(default_factory=list, max_length=MAX_PHOTOS)


class Highlight(BaseModel):
    text: str = Field(description="One highlight of the week, in the parents' language")
    source: str = Field(
        description="Where it comes from: 'photo N' (an included photo number), 'notes', or "
        "'background: <place>' for general public information about a place"
    )


class PhotoCaption(BaseModel):
    number: int = Field(description="Included photo number")
    caption: str = Field(description="Short warm caption in the parents' language")


class DigestReply(BaseModel):
    """Output of the Digest Writer agent.

    Field order matters: the model writes fields in this order, so all parents'-language fields come first
    and all student's-language fields come last. Mixing them made the model drift into the wrong language.
    """

    # --- parents' language ---
    title: str = Field(description="Short title for this week's update, in the parents' language")
    letter: str = Field(description="The weekly update message, in the parents' language")
    highlights: list[Highlight] = Field(
        min_length=1, max_length=8, description="Every concrete fact used in the letter, with its source"
    )
    photo_captions: list[PhotoCaption] = Field(default_factory=list)
    optional_additions: list[OptionalAddition] = Field(default_factory=list, max_length=3)
    # --- student's language ---
    letter_meaning: str = Field(description="Faithful translation of the letter into the STUDENT'S language")
    how_i_wrote_it: list[str] = Field(
        min_length=1, max_length=4, description="Short notes for the student on choices made, in the STUDENT'S language."
    )
    watch_outs: list[str] = Field(default_factory=list, description="In the STUDENT'S language")


class DigestResponse(BaseModel):
    digest: DigestReply
    usage: UsageInfo


# ---------- Parent side: explore the child's letter ----------

MAX_LETTER_IMAGES = 10


class ExploreRequest(BaseModel):
    """A letter the child sent: pasted text and/or images (long-image tiles or rendered PDF pages)."""

    profile: FamilyProfile
    text: str = Field("", max_length=8000)
    images: list[PhotoUpload] = Field(default_factory=list, max_length=MAX_LETTER_IMAGES)


class Place(BaseModel):
    name: str = Field(description="Name in the parents' language")
    english_name: str = Field(description="Name in English (as used locally in the US), for maps and search")
    what_it_is: str = Field(description="One or two sentences, parents' language")
    evidence: str = Field(description="Exact short quote from the letter that mentions it")


class SearchIdea(BaseModel):
    kind: Literal["place", "food", "culture", "care", "study", "daily_life"]
    topic: str = Field(description="Short topic title, parents' language")
    query: str = Field(description="Search query in the parents' language")
    query_english: str = Field(description="The same search in English, for US-local results")
    why: str = Field(description="Why this may interest or help the parents, parents' language")
    evidence: str = Field(description="Exact short quote from the letter that this idea comes from")


class ExploreReply(BaseModel):
    """Output of the Letter Explorer agent. Everything for the parent is in the parents' language."""

    transcript: str = Field(
        description="Verbatim text of the letter read from the images (and pasted text), in its original language"
    )
    summary: str = Field(description="2-3 sentence summary of the child's week, parents' language")
    places: list[Place] = Field(default_factory=list, max_length=6)
    search_ideas: list[SearchIdea] = Field(default_factory=list, max_length=8)
    conversation_starters: list[str] = Field(
        default_factory=list, max_length=4, description="Warm, open questions the parents could ask, parents' language"
    )
    watch_outs: list[str] = Field(default_factory=list, description="Parents' language")


class ExploreResponse(BaseModel):
    explore: ExploreReply
    usage: UsageInfo


# ---------- Call Planner ----------

Day = Literal["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


class BusyBlock(BaseModel):
    """A weekly busy time in that person's OWN local time."""

    days: list[Day] = Field(min_length=1)
    start: str = Field(pattern=r"^\d{1,2}:\d{2}$", description="Local start time, 24h 'HH:MM'")
    end: str = Field(
        pattern=r"^\d{1,2}:\d{2}$", description="Local end time, 24h 'HH:MM'. Earlier than start = runs past midnight."
    )
    label: str = Field(description="e.g. 'class', 'work', 'sleep', 'commute'")


class CallRequest(BaseModel):
    profile: FamilyProfile
    student_week: str = Field(min_length=1, max_length=2000)
    parent_week: str = Field(min_length=1, max_length=2000)
    call_minutes: int = Field(30, ge=10, le=120)
    start_date: str = Field(description="First day to plan, YYYY-MM-DD in the student's time zone")
    history: list[HistoryItem] = Field(default_factory=list, max_length=MAX_HISTORY)
    user: Literal["student", "parent"] = "student"


class OptionPick(BaseModel):
    start_utc: str = Field(description="Exact call start, ISO 8601 UTC, inside a free window returned by the tool")
    why: str = Field(description="One short reason, in the USER's language")


class CallPlanReply(BaseModel):
    """Output of the Call Planner agent. Times are filled in by code, not by the model."""

    options: list[OptionPick] = Field(max_length=3, description="Best 1-3 call times, best first")
    # --- parents' language ---
    invitation: str = Field(
        description="Short message from the USER inviting the OTHER side to the FIRST option, with the time in the "
        "OTHER side's local time, written in the OTHER side's language"
    )
    # --- user's language ---
    invitation_meaning: str = Field(description="Faithful translation of the invitation, USER's language")
    talking_points: list[str] = Field(
        default_factory=list, max_length=5, description="Things to talk about, from history/notes, USER's language"
    )
    assumptions: list[str] = Field(
        default_factory=list, description="Anything you assumed about the routines, USER's language"
    )
    watch_outs: list[str] = Field(default_factory=list, description="USER's language")


class CallOption(BaseModel):
    start_utc: str
    end_utc: str
    student_time: str
    parent_time: str
    why: str


class CallPlanResponse(BaseModel):
    options: list[CallOption]
    invitation: str
    invitation_meaning: str
    talking_points: list[str]
    assumptions: list[str]
    watch_outs: list[str]
    parents_ahead_by_hours: float
    upcoming_change: dict | None
    usage: UsageInfo


class CalendarReadRequest(BaseModel):
    profile: FamilyProfile
    whose: Literal["student", "parent"]
    images: list[PhotoUpload] = Field(min_length=1, max_length=3)


class CalendarReadReply(BaseModel):
    """Output of the Calendar Reader agent: busy blocks seen in calendar screenshots."""

    blocks: list[BusyBlock] = Field(default_factory=list, max_length=40)
    dates_seen: str = Field("", description="Date range shown in the screenshot, if visible, e.g. 'Oct 19-25'")
    unclear: list[str] = Field(default_factory=list, description="Anything hard to read, in English")


class CalendarReadResponse(BaseModel):
    schedule_text: str
    blocks: list[BusyBlock]
    dates_seen: str
    unclear: list[str]
    usage: UsageInfo
