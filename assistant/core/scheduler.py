"""
AskSharon.ai Scheduler
======================
Schedules timed events (morning check-in, evening reflection).
"""

import schedule
import time
import threading
from assistant.core.orchestrator import publish


def job_morning_checkin():
    publish("morning_checkin", {"time": "07:30"})


def job_evening_reflection():
    publish("evening_reflection", {"time": "21:00"})


def start_scheduler():
    schedule.every().day.at("07:30").do(job_morning_checkin)
    schedule.every().day.at("21:00").do(job_evening_reflection)
    print("🕓 Scheduler started.")

    def loop():
        while True:
            schedule.run_pending()
            time.sleep(30)

    threading.Thread(target=loop, daemon=True).start()
