#!/usr/bin/env python3
"""DON'T LOOK BACK — entry point."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dontlookback.game import main
if __name__ == "__main__":
    raise SystemExit(main())
