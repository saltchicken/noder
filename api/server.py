from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

import inspect
import sys
import nodes

custom_classes = [
    {
        "name": cls_name,
        "inputs": getattr(cls_obj, 'inputs', None),  # Will be None if inputs is an instance attribute
        "outputs": getattr(cls_obj, 'outputs', None),  # Will be None if outputs is an instance attribute
        "class": cls_obj
    }
    for cls_name, cls_obj in inspect.getmembers(sys.modules['nodes'])
    if inspect.isclass(cls_obj)
]

class Node:
    def __init__(self, js_node, py_node):
        self.setup(js_node)
        self.py_node = py_node
    def setup(self, js_node):
        self.id = js_node.get('id', None)
        self.name = js_node.get('name', None)

class Graph:
    def __init__(self):
        self.nodes = {}
    def add_node(self, node: Node):
        self.nodes[node.id] = node

graph = Graph()
app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:5173"],  # Adjust to match your React app's URL
    allow_origins=["*"],  # Adjust to match your React app's URL
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/data")
async def get_data():
    return {"message": json.dumps(graph.nodes)}

@app.post("/process")
async def process_data(data: dict):
    print(data)
    return {"response": f"Replace this with something useful"}

@app.post("/custom_nodes")
async def custom_nodes_handler():
    """Handles POST requests for custom nodes."""
    custom_classes_without_class = [{k: v for k, v in d.items() if k != 'class'} for d in custom_classes]
    return {"status": "success", "nodes": custom_classes_without_class}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
