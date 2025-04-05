import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from typing import List
import os
import json
from node_utils import get_python_classes, ReactflowGraph, ReactflowNode  # Updated import path

from message_queue import message_queue
import asyncio

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
app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

@app.get("/")
async def read_root():
    return FileResponse("dist/index.html")

@app.get("/{catch_all:path}")
async def catch_all(catch_all: str):
    file_path = os.path.join("dist", catch_all)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return FileResponse("dist/index.html")

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
            while not message_queue.empty():
                message = message_queue.get()
                await websocket.send_json({
                    "type": "node_message",
                    "data": message
                })
            try:
                data = await websocket.receive_text()
                json_data = json.loads(data)
                # Update the existing graph instead of creating a new one
                global_graph.update_from_json(json_data)
                
                try:
                    # print(global_graph.nodes)
                    results = global_graph.execute_nodes()

                    
                    while not message_queue.empty():
                        message = message_queue.get()
                        await websocket.send_json({
                            "type": "node_message",
                            "data": message
                        })


                    # Send success response
                    await websocket.send_json({
                        "status": "success",
                    })
                    
                except ValueError as e:
                    print(f"Error in execution: {e}")
                    await websocket.send_json({
                        "status": "error",
                        "message": str(e)
                    })
                    
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON: {e}")
                await websocket.send_json({
                    "type": "execution_result",
                    "status": "error",
                    "message": "Invalid JSON format"
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/python_nodes")
@app.get("/python_nodes")  # Adding GET support as well
async def python_nodes_handler(request: Request):
    """Handles both POST and GET requests for python nodes."""
    try:
        python_classes_without_class = [{k: v for k, v in d.items() if k != 'class'} for d in python_classes]
        return JSONResponse(
            content={"status": "success", "nodes": python_classes_without_class},
            status_code=200
        )
    except Exception as e:
        print(f"Error in python_nodes_handler: {str(e)}")
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=500
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)

