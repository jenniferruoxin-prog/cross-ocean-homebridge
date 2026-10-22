"""Cross-Ocean HomeBridge: the API and, after it, the built web app (frontend/dist).

Start everything with `python run.py` from the repo folder, then open http://127.0.0.1:8000.
"""

import mimetypes

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic_ai.exceptions import ModelHTTPError, UnexpectedModelBehavior, UsageLimitExceeded

from agents.bridge import run_bridge
from agents.calls import plan_call, read_calendar
from agents.digest import read_photos, write_digest
from agents.explore import explore_letter
from config import MODEL_NAME, ROOT
from models import (
    BridgeRequest,
    BridgeResponse,
    CalendarReadRequest,
    CalendarReadResponse,
    CallPlanResponse,
    CallRequest,
    DigestRequest,
    DigestResponse,
    ExploreRequest,
    ExploreResponse,
    PhotoReadRequest,
    PhotoReadResponse,
)

app = FastAPI(title="Cross-Ocean HomeBridge API")


def agent_error(e: Exception) -> HTTPException:
    if isinstance(e, UsageLimitExceeded):
        return HTTPException(429, "That needed more work than one request allows. Try something shorter.")
    if isinstance(e, ModelHTTPError):
        return HTTPException(502, f"The AI service returned an error ({e.status_code}). Please try again.")
    return HTTPException(502, "The AI could not produce a valid answer. Please try again.")


AGENT_ERRORS = (UsageLimitExceeded, ModelHTTPError, UnexpectedModelBehavior)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "model": MODEL_NAME}


@app.post("/api/bridge")
async def bridge(req: BridgeRequest) -> BridgeResponse:
    try:
        return await run_bridge(req)
    except AGENT_ERRORS as e:
        raise agent_error(e)


@app.post("/api/digest/photos")
async def digest_photos(req: PhotoReadRequest) -> PhotoReadResponse:
    try:
        return await read_photos(req)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except AGENT_ERRORS as e:
        raise agent_error(e)


@app.post("/api/digest/write")
async def digest_write(req: DigestRequest) -> DigestResponse:
    if not req.notes.strip() and not req.photos:
        raise HTTPException(400, "Add a few notes or at least one photo first.")
    try:
        return await write_digest(req)
    except AGENT_ERRORS as e:
        raise agent_error(e)


@app.post("/api/explore")
async def explore(req: ExploreRequest) -> ExploreResponse:
    try:
        return await explore_letter(req)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except AGENT_ERRORS as e:
        raise agent_error(e)


@app.post("/api/calls")
async def calls(req: CallRequest) -> CallPlanResponse:
    try:
        return await plan_call(req)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except AGENT_ERRORS as e:
        raise agent_error(e)


@app.post("/api/calls/read-calendar")
async def calls_read_calendar(req: CalendarReadRequest) -> CalendarReadResponse:
    try:
        return await read_calendar(req)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except AGENT_ERRORS as e:
        raise agent_error(e)


# ---------- The web app ----------
# The built frontend is committed (frontend/dist), so running the app needs only Python, not Node.
# Mounted last, so every /api route above takes priority.

# Windows can map .mjs to text/plain; browsers refuse to run a module worker (the PDF reader) with that type.
mimetypes.add_type("application/javascript", ".mjs")

DIST = ROOT / "frontend" / "dist"

if (DIST / "index.html").exists():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="web")
else:

    @app.get("/", response_class=HTMLResponse)
    def no_build() -> str:
        return (
            "<h2>The web app has not been built.</h2>"
            "<p>Run <code>npm install</code> and <code>npm run build</code> in the <code>frontend</code> folder, "
            "then restart.</p>"
        )
