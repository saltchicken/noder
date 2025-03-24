from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
