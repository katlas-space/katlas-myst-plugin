import argparse
import sys
import json
from .mermaid import main as mermaid_main

def main():
    parser = argparse.ArgumentParser(description="Katlas MyST Plugin CLI")
    subparsers = parser.add_subparsers(dest="command", help="Sub-commands")

    # Mermaid Subcommand
    mermaid_parser = subparsers.add_parser("mermaid", help="Mermaid transformation")
    mermaid_parser.add_argument("--transform", action="store_true")
    mermaid_parser.add_argument("--format", default="json")

    args, unknown = parser.parse_known_args()
    
    if args.command == "mermaid":
        # Remove 'mermaid' from argv so mermaid.py sees [--transform]
        sys.argv.pop(1)
        mermaid_main()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
