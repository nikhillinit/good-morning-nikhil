"""Public entry points for the ARO voice style lab."""

from .demo import run_demo
from .generation import generate_line
from .profiles import build_profile
from .scoring import score_clip

__all__ = ["build_profile", "generate_line", "score_clip", "run_demo"]
