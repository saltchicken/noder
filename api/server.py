from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json

import asyncio
from node_utils import get_custom_classes

custom_classes = get_custom_classes()
print("CUSTOM CLASSES")
print(custom_classes)
print("CUSTOM CLASSES")

class Node:
    def __init__(self, js_node, py_node):
        self.setup(js_node)
        self.py_node = py_node

    def setup(self, js_node):
        self.id = js_node.get('id', None)
        self.name = js_node.get('type', None)
        self.flags = js_node.get('flags', None)
        self.mode = js_node.get('mode', None)
        self.order = js_node.get('order', None)
        self.inputs = js_node.get('inputs', None)
        self.outputs = js_node.get('outputs', None)
        self.properties = js_node.get('properties', None)

    def execute(self, *args):
        if hasattr(self.py_node, "instantiated"):
            pass
        else:
            self.py_node = self.py_node()
        if len(args) > 0:
            self.py_node._run(*args)
        else:
            self.py_node._run()

class Graph:
    def __init__(self):
        self.nodes = {}
        self.sse_queue = asyncio.Queue()
        self.sse_active = True

    def add_node(self, node: Node):
        self.nodes[node.id] = node

    async def process_nodes(self, graph_data):
        nodes_for_deletion = set()
        for node in graph_data['nodes']:
            for custom_class in custom_classes:
                if custom_class['name'] == node['type']:
                    node_class = custom_class['class']

                    if node['id'] not in self.nodes:
                        graph_node = Node(node, node_class)
                        self.add_node(graph_node)
                    else:
                        self.nodes[node['id']].setup(node)
                    break
        current_keys = set(self.nodes.keys())
        new_keys = {node['id'] for node in graph_data['nodes']}
        nodes_for_deletion = current_keys - new_keys  # Find obsolete nodes

        for id in nodes_for_deletion:
            print(f"Removing node: {id}")
            del self.nodes[id]

        self.sse_active = True
        for id, node in sorted(self.nodes.items(), key=lambda item: item[1].order):
            await self.sse_queue.put(json.dumps({
                "node": node.name,
                "id": str(node.id)
            }))
            previous_node_inputs = []
            if node.inputs is not None:
                for input in node.inputs:
                    previous_node_inputs.append(self.search_nodes_for_output(input['link']))
            if len(previous_node_inputs) == 0:
                node.execute()
            else:
                node.execute(*previous_node_inputs)
        self.sse_active = False

    def search_nodes_for_output(self, link):
        for node in self.nodes.values():
            for output_links in node.outputs:
                if output_links['links'] is None:
                    continue
                for output_link in output_links['links']:
                    if output_link == link:
                        return node.py_node.output_results[output_links['slot_index']]
        return None



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
    return {"message": "Fix this"}

@app.post("/process")
async def process_data(data: dict):
    graph_data = data.get('graph', {})
    await graph.process_nodes(graph_data)
    return {"response": f"Replace this with something useful"}

@app.post("/custom_nodes")
async def custom_nodes_handler():
    """Handles POST requests for custom nodes."""
    custom_classes_without_class = [{k: v for k, v in d.items() if k != 'class'} for d in custom_classes]
    return {"status": "success", "nodes": custom_classes_without_class}

@app.get('/events')
async def events():
    async def event_stream():
        while True:
            try:
                sse_message = await graph.sse_queue.get()
                print(sse_message)
                yield f"data: {sse_message}\n\n"
                if not graph.sse_active and graph.sse_queue.empty():
                    break
            except asyncio.CancelledError:
                print("Event needs to cancel")
                break
    return StreamingResponse(event_stream(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
