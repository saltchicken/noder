import subprocess
import os
from pathlib import Path

def run_services():
    # Get the project root directory (where this script is located)
    root_dir = Path(__file__).parent
    frontend_dir = root_dir / "frontend"
    backend_dir = root_dir / "backend"

    try:
        # Run bun builder in frontend directory
        print("Building frontend...")
        subprocess.run(["bun", "builder"], cwd=frontend_dir, check=True)

        # Run Python server in backend directory
        print("Starting backend server...")
        subprocess.run(["python", "server.py"], cwd=backend_dir, check=True)

    except subprocess.CalledProcessError as e:
        print(f"Error running commands: {e}")
    except KeyboardInterrupt:
        print("\nShutting down services...")

if __name__ == "__main__":
    run_services()

