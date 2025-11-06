#!/usr/bin/env python3
"""
Environment Validation Script Template
======================================

Universal template for validating environment configuration.

Copy to your project's scripts/ directory and customize
the validation checks for your specific requirements.

Usage:
    python scripts/validate_env.py
"""

import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

try:
    from config.env_manager import get_config
except ImportError:
    print("❌ Error: Cannot import config.env_manager")
    print("   Make sure env_manager.py is in config/ directory")
    sys.exit(1)


def main():
    """Validate environment configuration."""
    print("🔍 Validating environment configuration...\n")
    print("=" * 70)

    try:
        config = get_config()

        print("✅ Configuration loaded successfully!\n")
        print("=" * 70)
        print("📋 PROJECT SETTINGS")
        print("=" * 70)
        print(f"  Project Name: {config.project_name}")
        print(f"  Environment:  {config.environment}")
        print(f"  Debug Mode:   {config.debug}")
        print(f"  Root Path:    {config.project_root}")

        print("\n" + "=" * 70)
        print("🔑 API KEYS STATUS")
        print("=" * 70)

        # CUSTOMIZE THIS SECTION for your project's specific API keys
        api_keys = [
            ("OpenAI", config.openai_api_key),
            ("Anthropic", config.anthropic_api_key),
            ("Perplexity", config.perplexity_api_key),
        ]

        all_keys_set = True
        for name, key in api_keys:
            status = "✅ Set" if key else "❌ Missing"
            print(f"  {name:20s}: {status}")
            if not key:
                all_keys_set = False

        print("\n" + "=" * 70)
        print("🗄️  DATABASE & SERVICES")
        print("=" * 70)

        # Database status
        db_status = "✅ Configured" if config.database_url else "❌ Not configured"
        print(f"  Database:            {db_status}")

        # Redis status
        redis_status = f"✅ {config.redis_host}:{config.redis_port}"
        print(f"  Redis:               {redis_status}")

        # Supabase status
        supabase_status = "✅ Configured" if config.supabase_url else "❌ Not configured"
        print(f"  Supabase:            {supabase_status}")

        print("\n" + "=" * 70)
        print("🚦 FEATURE FLAGS")
        print("=" * 70)
        print(f"  Caching:             {'✅ Enabled' if config.enable_caching else '❌ Disabled'}")
        print(f"  Logging:             {'✅ Enabled' if config.enable_logging else '❌ Disabled'}")

        print("\n" + "=" * 70)
        print("📁 SYSTEM PATHS")
        print("=" * 70)
        print(f"  Config Dir:          {config.get_config_dir()}")
        print(f"  Logs Dir:            {config.get_logs_dir()}")
        print(f"  Data Dir:            {config.get_data_dir()}")

        # Verify critical directories exist
        print("\n" + "=" * 70)
        print("📂 DIRECTORY VALIDATION")
        print("=" * 70)

        dirs_to_check = [
            ("Project Root", config.get_project_root()),
            ("Config Dir", config.get_config_dir()),
        ]

        for name, path in dirs_to_check:
            exists = path.exists()
            status = "✅ Exists" if exists else "❌ Missing"
            print(f"  {name:20s}: {status} ({path})")

        print("\n" + "=" * 70)
        print("📝 SUMMARY")
        print("=" * 70)

        if all_keys_set:
            print("✅ All API keys configured")
        else:
            print("⚠️  Some API keys are missing (optional features may be disabled)")

        print("✅ Environment validation complete!")
        print("=" * 70 + "\n")

        return 0

    except ValueError as e:
        print("\n" + "=" * 70)
        print("❌ CONFIGURATION ERROR")
        print("=" * 70)
        print(f"\n{e}\n")
        print("=" * 70)
        print("📝 NEXT STEPS")
        print("=" * 70)
        print("1. Check if config/.env exists")
        print("2. Copy from template: cp config/.env.example config/.env")
        print("3. Edit config/.env with your credentials")
        print("4. Re-run this validation script")
        print("=" * 70 + "\n")
        return 1

    except Exception as e:
        print(f"\n❌ Unexpected error: {e}\n")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
