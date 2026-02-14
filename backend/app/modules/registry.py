"""Module registry for plugin-like functionality.

This registry allows easy enabling/disabling of modules.
To disable a module, simply comment it out or remove it from ENABLED_MODULES.
"""

# List of enabled modules - modify this to enable/disable features
ENABLED_MODULES = [
    "auth",
    "users",
    "teams",
    "departments",
    "okrs",
    "bau",
    "work_items",
    "tasks",
    "weekly_priority",
]


def get_enabled_modules():
    """Get list of enabled module names."""
    return ENABLED_MODULES


def is_module_enabled(module_name: str) -> bool:
    """Check if a module is enabled."""
    return module_name in ENABLED_MODULES

