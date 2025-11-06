"""
AskSharon.ai Orchestrator
=========================
Central brain: boots FastAPI, loads modules from registry, and provides an event bus.
"""

from fastapi import FastAPI
from importlib import import_module
import yaml

app = FastAPI(title="AskSharon.ai Orchestrator")

EVENT_SUBSCRIBERS = {}


def publish(event: str, data: dict):
    """Broadcast an event and payload to all subscribers."""
    for callback in EVENT_SUBSCRIBERS.get(event, []):
        try:
            callback(data)
        except Exception as e:
            print(f"⚠️ Event '{event}' delivery error: {e}")


def subscribe(event: str, callback):
    """Allow modules to listen to system events."""
    EVENT_SUBSCRIBERS.setdefault(event, []).append(callback)


def load_modules():
    """Load enabled modules based on YAML registry."""
    with open("assistant/configs/module_registry.yaml") as f:
        registry = yaml.safe_load(f)
    for mod in registry["modules"]:
        if mod.get("enabled", False):
            module = import_module(f"assistant.modules.{mod['name']}.main")
            module.register(app, publish, subscribe)
            print(f"✅ Loaded module: {mod['name']}")


# Import starts module load
load_modules()
