from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from node_utils import get_python_classes

python_classes = get_python_classes()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this with your actual domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
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

# app.mount("/", StaticFiles(directory="../dist", html=True), name="static")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Websocket received: {data}")
            await manager.broadcast(f"Client said: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/python_nodes")
async def python_nodes_handler():
    """Handles POST requests for python nodes."""
    python_classes_without_class = [{k: v for k, v in d.items() if k != 'class'} for d in python_classes]
    return {"status": "success", "nodes": python_classes_without_class}

