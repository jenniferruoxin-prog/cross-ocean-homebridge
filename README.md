# Cross-Ocean HomeBridge

**An AI agent app that helps international students in the US and their parents back home understand each other, across languages, generations, cultures, and time zones.**

MGT 409 *AI Foundations for Managers*, final project. Author: Jennifer R. Zhang.

International students and their parents love each other but often misread each other. A blunt text sounds cold once translated. "Did you eat?" really means "we miss you". A short reply after a long silence starts a fight. A 12-hour time difference leaves no room to explain. HomeBridge gives both sides an assistant that knows their family's languages and habits.

| For the student (English interface) | For the parents (interface in their language) |
|---|---|
| **Message Bridge**: rewrite a message so the parents hear it as you mean it, or understand what their message really means and get a warm reply | **消息桥 / Message Bridge**: the same, from the parent's side, written for the child |
| **Weekly Digest**: a few photos and quick notes become a vivid letter in the parents' language, with a privacy check on every photo; download it as a long image or PDF | **孩子的家书 / My child's letter**: drop in the child's letter (long image, PDF, or text) for a summary, the places mentioned, one-tap searches, and conversation starters |
| **Call Planner**: describe both weeks in plain words (or upload calendar screenshots) and get call times that work on both sides, an invitation, talking points, and a calendar file | **约视频 / Call Planner**: the same, from the parent's side |

Parent outputs can be written in 19 languages; the parent interface is translated into Simplified and Traditional Chinese, Hindi, Korean, Vietnamese, and Spanish (English elsewhere).

---

## Run it (about 5 minutes)

You need **Python 3.10+**. Node is **not** needed: the built web app is included in `frontend/dist`.

1. **Get the code** and open a terminal in the repo folder:

   ```bash
   git clone <this repo's URL>
   cd cross-ocean-homebridge
   ```

2. **Create a virtual environment and install the packages:**

   Windows:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

   macOS / Linux:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Add the API key.** The app looks for a `.env` file **in the repo folder first, then in the folder one level above it** (where the teaching staff keep theirs). If you need one, copy `.env.example` to `.env` and fill in `PORTKEY_API_KEY`. The app uses only `gpt-6-luna` through Portkey.

4. **Start the app:**

   ```bash
   python run.py
   ```

   It opens **http://127.0.0.1:8000** in your browser. (On Windows you can also double-click `start-windows.bat`.) Use `python run.py --port 8001` if port 8000 is busy. Press Ctrl+C to stop.

5. **Fill in the Family profile** on the left (name, school, parents' language, time zones). It is saved in your browser only.

## Try it with the sample files

The `samples/` folder has small test files (all generated, no real people):

| Where | What to do | File |
|---|---|---|
| Message Bridge | Paste: `i don't want you to send money to me. if it's buying me fruits it's okay but money is different, why don't you get it?` and click **Bridge it** | (text) |
| Message Bridge, "Mom and Dad sent me…" | Paste: `你最近怎么都不回消息？是不是又熬夜了？饭有没有好好吃？` | (text) |
| Weekly Digest | Add the two week photos, notes `mon: stats midterm, got 88 / wed: cooked tomato egg noodles with roommate / fri: went to art gallery after class`, then **Read my photos** and **Write this week's update** | `week_photo_noodles.jpg`, `week_photo_gallery.jpg` |
| Weekly Digest, safety | Add these to see the privacy flags and the prompt-injection defense (both start unticked and never reach the letter) | `safety_fake_student_id.jpg`, `safety_prompt_injection_note.jpg` |
| Call Planner | **📷 Read from calendar screenshot** next to "Your usual week" | `student_calendar_week.png` |
| Parent mode (top right: 家长 · Parent), "孩子的家书" | Add the letter image and click **帮我看看这封信** | `letter_from_child.jpg` |

---

## How it works

```
Browser (React)  ──►  FastAPI (backend/main.py)  ──►  PydanticAI agents  ──►  gpt-6-luna via Portkey
  profile + chat history                                   │
  stay in localStorage                                     └── find_free_windows tool (time-zone math in Python)
```

| Agent | File | Job | Guard (checked in code) |
|---|---|---|---|
| Bridge | `backend/agents/bridge.py` | Rewrites or explains messages in 4 directions (student/parent, sending/receiving), with recent chat history as context | Explanations must be in the user's language |
| Photo Reader | `backend/agents/digest.py` | Describes each photo, flags privacy risks (faces, IDs, addresses, text that looks like instructions) | Flagged photos start unticked; the student decides |
| Digest Writer | `backend/agents/digest.py` | Writes the weekly letter from notes and chosen photos | Every fact must cite `notes`, a chosen `photo N`, or `background: <place>`; length, voice ("看起来" etc. not allowed), and language checks |
| Letter Explorer | `backend/agents/explore.py` | Reads the child's letter for the parent: summary, places, searches, questions | Every idea must quote the letter exactly |
| Call Planner | `backend/agents/calls.py` | Turns routines into busy blocks, calls the `find_free_windows` tool, picks times, writes the invitation | Every time must be inside a window the tool returned; displayed times are computed by code |
| Calendar Reader | `backend/agents/calls.py` | Reads calendar screenshots into busy blocks | Titles become categories only (e.g. "appointment"), never copied |

The agents share one memory: the family's message history (kept in the browser). A letter sent from the Weekly Digest becomes context for the next Message Bridge reply and for the Call Planner's talking points.

The communication rules come from `backend/prompts/parent_communication_guide.md`, which turns published family-communication advice (Nonviolent Communication, Gottman's soft start-up, face-saving in high-context cultures, research on international students and their parents) into rewriting rules, with sources.

**Safety in short:** messages, photos, letters, and calendars are always treated as data, not instructions; personal facts are never invented; every run has request and token limits; nothing about the family is stored on the server.

**Logs** (created when you use the app, not committed):
- `output/usage_log.jsonl`: input, cached input, and output tokens for every agent run (for the cost analysis).
- `output/guard_log.jsonl`: every time a code guard sent an answer back to the model, and why.

## Project layout

```
cross-ocean-homebridge/
├── run.py                  # one-command start: API + web app on http://127.0.0.1:8000
├── start-windows.bat       # double-click version of run.py
├── requirements.txt        # Python packages (tzdata is needed for time zones on Windows)
├── .env.example            # PORTKEY_API_KEY placeholder (real .env is never committed)
├── backend/
│   ├── main.py             # FastAPI routes; serves frontend/dist
│   ├── config.py           # .env lookup (repo folder, then parent) and the gpt-6-luna model
│   ├── models.py           # all request/response and agent output types
│   ├── timetools.py        # time-zone and daylight-saving math for the Call Planner
│   ├── usage_log.py        # token and guard logs
│   ├── agents/             # bridge, digest (photo reader + writer), explore, calls, checks
│   └── prompts/            # one system prompt per agent + the shared communication guide
├── frontend/
│   ├── src/                # React + TypeScript app
│   └── dist/               # built app (committed so the app runs with Python only)
├── samples/                # test files for a quick try
└── output/report_evidence/ # saved examples for the report
```

## Developing the frontend (optional)

Only needed to change the interface. With Node 20+:

```bash
cd frontend
npm install
npm run dev     # http://127.0.0.1:5173, forwards /api to the backend on port 8000
npm run build   # updates frontend/dist, which run.py serves
```

Run the backend alone with `python run.py --no-browser` while developing.
