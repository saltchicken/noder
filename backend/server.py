import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from typing import List
import os
import json
from node_utils import (
    get_python_classes,
    ReactflowGraph,
)

from datetime import datetime
from fastapi import UploadFile, HTTPException

python_classes = get_python_classes()
global_graph = ReactflowGraph({"nodes": [], "edges": []}, python_classes)

app = FastAPI()

# CORS middleware configuration - updated with more specific settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Explicitly list allowed methods
    allow_headers=["*"],
    expose_headers=["*"],
)

# Mount static files from the dist directory
app.mount("/assets", StaticFiles(directory="../frontend/dist/assets"), name="assets")
app.mount("/saved_flows", StaticFiles(directory="./saved_flows"), name="saved_flows")


@app.get("/")
async def read_root():
    return FileResponse("../frontend/dist/index.html")


@app.get("/{catch_all:path}")
async def catch_all(catch_all: str):
    file_path = os.path.join("dist", catch_all)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return FileResponse("../frontend/dist/index.html")


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            try:
                data = await websocket.receive_text()
                json_data = json.loads(data)

                global_graph.websocket = websocket
                global_graph.update_from_json(json_data)
                results = await global_graph.execute_nodes()
                await websocket.send_json(
                    {"type": "success", "data": "Graph completed"}
                )

            except WebSocketDisconnect:
                break
            except Exception as e:
                await websocket.send_json({"status": "error", "message": str(e)})
    finally:
        manager.disconnect(websocket)


@app.post("/python_nodes")
@app.get("/python_nodes")  # Adding GET support as well
async def python_nodes_handler(request: Request):
    """Handles both POST and GET requests for python nodes."""
    try:
        python_classes_without_class = [
            {k: v for k, v in d.items() if k != "class"} for d in python_classes
        ]
        return JSONResponse(
            content={"status": "success", "nodes": python_classes_without_class},
            status_code=200,
        )
    except Exception as e:
        print(f"Error in python_nodes_handler: {str(e)}")
        return JSONResponse(
            content={"status": "error", "message": str(e)}, status_code=500
        )


@app.post("/export_flow")
async def export_flow(flow_data: dict):
    try:
        # Ensure the saved_flows directory exists
        os.makedirs("./saved_flows", exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"flow_{timestamp}.json"
        file_path = f"./saved_flows/{filename}"

        with open(file_path, "w") as f:
            json.dump(flow_data, f, indent=2)

        return {"status": "success", "filename": filename}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/import_flow")
async def import_flow(file: UploadFile):
    try:
        # Validate file extension
        if not file.filename.endswith(".json"):
            raise HTTPException(status_code=400, detail="File must be a JSON file")

        # Read and parse the file
        content = await file.read()
        print(content)
        try:
            flow_data = json.loads(content)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON file")

        # Basic validation of flow data structure
        if (
            not isinstance(flow_data, dict)
            or "nodes" not in flow_data
            or "edges" not in flow_data
        ):
            raise HTTPException(status_code=400, detail="Invalid flow format")

        return {"status": "success", "flow": flow_data}
    except HTTPException as he:
        return {"status": "error", "message": str(he.detail)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/saved_flows/{filename}")
async def get_saved_flow(filename: str):
    file_path = f"backend/saved_flows/{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/json", filename=filename)
    return {"status": "error", "message": "File not found"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
