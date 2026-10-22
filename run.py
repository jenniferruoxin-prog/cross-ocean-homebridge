"""Starts Cross-Ocean HomeBridge with one command:  python run.py

Serves the API and the web app on http://127.0.0.1:8000 and opens it in the browser.
Use --port to pick another port and --no-browser to skip opening a browser tab.
"""

import argparse
import os
import sys
import threading
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent

if sys.version_info < (3, 10):
    sys.exit("Python 3.10 or newer is needed (found %d.%d)." % sys.version_info[:2])

try:
    import uvicorn
    from dotenv import load_dotenv
except ImportError:
    sys.exit("Missing packages. Run:  pip install -r requirements.txt")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Cross-Ocean HomeBridge")
    parser.add_argument("--port", type=int, default=int(os.getenv("PORT", "8000")))
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()

    # Same lookup as the app: .env in this folder first, then one folder up.
    load_dotenv(ROOT / ".env")
    load_dotenv(ROOT.parent / ".env")
    if not os.getenv("PORTKEY_API_KEY"):
        print(
            "WARNING: PORTKEY_API_KEY not found. Put it in a .env file in this folder or the folder above "
            "(see .env.example). The app will open, but AI features will fail.",
            file=sys.stderr,
        )
    if not (ROOT / "frontend" / "dist" / "index.html").exists():
        print("WARNING: frontend/dist is missing; build it with  npm install && npm run build  in frontend/.")

    url = f"http://127.0.0.1:{args.port}"
    print(f"\n  Cross-Ocean HomeBridge is starting at {url}\n  Press Ctrl+C to stop.\n")
    if not args.no_browser:
        threading.Timer(2.0, lambda: webbrowser.open(url)).start()
    uvicorn.run("main:app", app_dir=str(ROOT / "backend"), host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
