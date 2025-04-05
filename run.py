import subprocess
import os
from pathlib import Path
import time
import argparse
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class FrontendChangeHandler(FileSystemEventHandler):
    def __init__(self, frontend_dir, backend_dir):
        self.frontend_dir = frontend_dir
        self.backend_dir = backend_dir
        self.server_process = None
        
    def on_modified(self, event):
        if event.src_path.endswith(('.jsx', '.tsx', '.js', '.ts', '.css')):
            print("\nFrontend change detected. Rebuilding...")
            try:
                # Kill existing server process if running
                if self.server_process and self.server_process.poll() is None:
                    self.server_process.terminate()
                    self.server_process.wait()
                
                # Rebuild frontend
                subprocess.run(["bun", "builder"], cwd=self.frontend_dir, check=True)
                
                # Start new server process
                print("Starting backend server...")
                self.server_process = subprocess.Popen(
                    ["python", "server.py"], 
                    cwd=self.backend_dir
                )
            except subprocess.CalledProcessError as e:
                print(f"Error during rebuild: {e}")

def run_services(reload=False):
    root_dir = Path(__file__).parent
    frontend_dir = root_dir / "frontend"
    backend_dir = root_dir / "backend"

    try:
        # Initial frontend build
        print("Building frontend...")
        subprocess.run(["bun", "builder"], cwd=frontend_dir, check=True)

        # Start initial server process
        print("Starting backend server...")
        server_process = subprocess.Popen(
            ["python", "server.py"], 
            cwd=backend_dir
        )

        if reload:
            # Set up file watcher only if reload flag is True
            event_handler = FrontendChangeHandler(frontend_dir, backend_dir)
            event_handler.server_process = server_process
            observer = Observer()
            observer.schedule(event_handler, str(frontend_dir / "src"), recursive=True)
            observer.start()

            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nShutting down services...")
                observer.stop()
                if event_handler.server_process:
                    event_handler.server_process.terminate()
                observer.join()
        else:
            # Without reload, just wait for the server process to complete
            try:
                server_process.wait()
            except KeyboardInterrupt:
                print("\nShutting down services...")
                server_process.terminate()

    except subprocess.CalledProcessError as e:
        print(f"Error running commands: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload on file changes")
    args = parser.parse_args()
    
    run_services(reload=args.reload)

