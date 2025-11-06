"""
Centralized Environment Variable Management Template
====================================================

UNIVERSAL TEMPLATE for credential management across projects.

Copy this to your project's config/ directory and customize
the Config dataclass with your project-specific credentials.

Usage in your project:
    from config.env_manager import get_config
    config = get_config()
    api_key = config.openai_api_key

Features:
- Single source of truth (config/.env)
- Type-safe access via dataclass
- Automatic validation on startup
- Graceful handling of optional credentials
- Easy testing and mocking
"""

import os
from pathlib import Path
from typing import Optional
from dataclasses import dataclass
from dotenv import load_dotenv


# Load .env from config/ directory
def _load_env_file() -> Path:
    """Find and load the .env file from config/ directory."""
    # Try config/.env first (preferred location)
    config_dir = Path(__file__).parent
    env_path = config_dir / ".env"

    if env_path.exists():
        load_dotenv(env_path)
        return env_path

    # Fallback to root .env
    root_env = config_dir.parent / ".env"
    if root_env.exists():
        load_dotenv(root_env)
        return root_env

    # If neither exists, still load from environment (for CI/CD)
    load_dotenv()
    return env_path  # Return expected path for error messages


ENV_FILE_PATH = _load_env_file()


@dataclass
class Config:
    """
    Centralized configuration with type safety and validation.

    CUSTOMIZE THIS CLASS for your project's specific needs.
    Add/remove credential fields as needed.

    Usage:
        from config.env_manager import get_config
        config = get_config()
        api_key = config.openai_api_key
    """

    # ========================================
    # Project Settings (REQUIRED)
    # ========================================
    project_name: str
    environment: str  # development, staging, production
    debug: bool
    project_root: str

    # ========================================
    # AI API Keys (OPTIONAL)
    # Customize based on which AI services you use
    # ========================================
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    perplexity_api_key: Optional[str] = None

    # ========================================
    # Database & Caching
    # Customize based on your infrastructure
    # ========================================
    database_url: Optional[str] = None
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: Optional[str] = None

    # ========================================
    # Backend Services (Example: Supabase)
    # Replace with your backend service credentials
    # ========================================
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_role_key: Optional[str] = None

    # ========================================
    # External APIs
    # Add your project-specific API credentials here
    # ========================================
    github_token: Optional[str] = None
    slack_webhook_url: Optional[str] = None

    # ========================================
    # Feature Flags
    # Add your project-specific feature flags
    # ========================================
    enable_caching: bool = True
    enable_logging: bool = True

    # ========================================
    # System Paths
    # ========================================
    logs_dir: Optional[str] = None
    config_dir: Optional[str] = None
    data_dir: Optional[str] = None

    def validate(self) -> list[str]:
        """
        Validate required configuration.
        Returns list of missing/invalid settings.

        CUSTOMIZE THIS METHOD to add project-specific validation.
        """
        errors = []
        warnings = []

        # Check required fields
        if not self.project_name:
            errors.append("PROJECT_NAME is required")

        if self.environment not in ["development", "staging", "production"]:
            warnings.append(
                f"ENVIRONMENT should be development/staging/production, got: {self.environment}"
            )

        if not self.project_root:
            errors.append("PROJECT_ROOT is required (project root directory)")

        # Validate paths if provided
        if self.project_root:
            root_path = Path(self.project_root)
            if not root_path.exists():
                errors.append(
                    f"PROJECT_ROOT path does not exist: {self.project_root}"
                )

        # Add warnings for missing optional keys (customize as needed)
        # Comment out or remove warnings for APIs you don't use
        if not self.openai_api_key:
            warnings.append("OPENAI_API_KEY not set (OpenAI features disabled)")

        return errors + warnings

    def get_project_root(self) -> Path:
        """Get the project root directory as a Path object."""
        return Path(self.project_root)

    def get_config_dir(self) -> Path:
        """Get the config directory path."""
        if self.config_dir:
            return Path(self.config_dir)
        return self.get_project_root() / "config"

    def get_logs_dir(self) -> Path:
        """Get the logs directory path."""
        if self.logs_dir:
            return Path(self.logs_dir)
        return self.get_project_root() / "logs"

    def get_data_dir(self) -> Path:
        """Get the data directory path."""
        if self.data_dir:
            return Path(self.data_dir)
        return self.get_project_root() / "data"


def _str_to_bool(value: str) -> bool:
    """Convert string to boolean."""
    return value.lower() in ("true", "1", "yes", "on")


def get_config() -> Config:
    """
    Load and return validated configuration.

    CUSTOMIZE THIS FUNCTION to load your project-specific credentials.

    Raises:
        ValueError: If required configuration is missing

    Returns:
        Config instance with all settings
    """
    config = Config(
        # Required - Project Settings
        project_name=os.getenv("PROJECT_NAME", "MyProject"),
        environment=os.getenv("ENVIRONMENT", "development"),
        debug=_str_to_bool(os.getenv("DEBUG", "true")),
        project_root=os.getenv(
            "PROJECT_ROOT",
            str(Path(__file__).parent.parent.absolute()),
        ),
        # AI API Keys
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
        perplexity_api_key=os.getenv("PERPLEXITY_API_KEY"),
        # Database
        database_url=os.getenv("DATABASE_URL"),
        redis_host=os.getenv("REDIS_HOST", "localhost"),
        redis_port=int(os.getenv("REDIS_PORT", "6379")),
        redis_password=os.getenv("REDIS_PASSWORD"),
        # Supabase
        supabase_url=os.getenv("SUPABASE_URL"),
        supabase_anon_key=os.getenv("SUPABASE_ANON_KEY"),
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
        # External APIs
        github_token=os.getenv("GITHUB_TOKEN"),
        slack_webhook_url=os.getenv("SLACK_WEBHOOK_URL"),
        # Feature Flags
        enable_caching=_str_to_bool(os.getenv("ENABLE_CACHING", "true")),
        enable_logging=_str_to_bool(os.getenv("ENABLE_LOGGING", "true")),
        # System Paths
        logs_dir=os.getenv("LOGS_DIR"),
        config_dir=os.getenv("CONFIG_DIR"),
        data_dir=os.getenv("DATA_DIR"),
    )

    # Validate and collect issues
    issues = config.validate()

    # Separate errors from warnings
    errors = [issue for issue in issues if "required" in issue.lower() or "does not exist" in issue.lower()]
    warnings = [issue for issue in issues if issue not in errors]

    # Print warnings
    for warning in warnings:
        print(f"⚠️  {warning}")

    # Raise errors
    if errors:
        error_msg = "Configuration errors:\n" + "\n".join(f"  ❌ {e}" for e in errors)
        raise ValueError(error_msg)

    return config


# Singleton instance for performance
_config: Optional[Config] = None


def get_config_cached() -> Config:
    """
    Get cached config instance (faster for repeated calls).

    Returns:
        Cached Config instance
    """
    global _config
    if _config is None:
        _config = get_config()
    return _config


def reload_config() -> Config:
    """
    Force reload configuration from environment.
    Useful when .env file changes during runtime.

    Returns:
        Freshly loaded Config instance
    """
    global _config
    _config = None
    # Reload .env file
    load_dotenv(ENV_FILE_PATH, override=True)
    return get_config_cached()


# Convenience functions for backward compatibility
def get_project_root() -> Path:
    """Get the project root directory."""
    return get_config_cached().get_project_root()


def get_config_dir() -> Path:
    """Get the config directory."""
    return get_config_cached().get_config_dir()


def get_logs_dir() -> Path:
    """Get the logs directory."""
    return get_config_cached().get_logs_dir()


if __name__ == "__main__":
    # Test the config
    print("🔧 Testing env_manager.py...")
    print(f"📁 ENV file: {ENV_FILE_PATH}")
    print()

    try:
        config = get_config()
        print("✅ Configuration loaded successfully!\n")
        print(f"Project: {config.project_name}")
        print(f"Environment: {config.environment}")
        print(f"Debug: {config.debug}")
        print(f"Root: {config.project_root}")
        print()
        print("API Keys Status:")
        print(f"  OpenAI: {'✅ Set' if config.openai_api_key else '❌ Missing'}")
        print(
            f"  Anthropic: {'✅ Set' if config.anthropic_api_key else '❌ Missing'}"
        )
        print(
            f"  Perplexity: {'✅ Set' if config.perplexity_api_key else '❌ Missing'}"
        )
    except ValueError as e:
        print(f"❌ Configuration error:\n{e}")
        exit(1)
