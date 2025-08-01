import json


# Helper functions for list conversion
def list_to_str(lst):
    """Convert list to comma-separated string for database storage"""
    return ",".join(lst) if lst else None


def str_to_list(s):
    """Convert comma-separated string back to list"""
    return s.split(",") if s else []


def json_to_list(json_str):
    """Convert JSON string to list"""
    try:
        return json.loads(json_str) if json_str else []
    except json.JSONDecodeError:
        return []


def list_to_json(lst):
    """Convert list to JSON string for database storage"""
    return json.dumps(lst) if lst else None
