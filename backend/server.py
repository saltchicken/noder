from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json

import queue
import asyncio
from node_utils import get_custom_classes

custom_classes = get_custom_classes()
message_queue = queue.Queue()

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
        self.text_widgets = js_node.get('text_widgets', [])
        self.number_widgets = js_node.get('number_widgets', [])
        self.select_widgets = js_node.get('select_widgets', [])

    def execute(self, *args):
        if hasattr(self.py_node, "instantiated"):
            pass
        else:
            self.py_node = self.py_node()
        self.py_node.text_widgets = self.text_widgets
        self.py_node.number_widgets = self.number_widgets
        self.py_node.select_widgets = self.select_widgets
        self.py_node.send_message = lambda msg: message_queue.put({"node_id": self.id, "type": "update_widget", "message": msg})
        if len(args) > 0:
            self.py_node._run(*args)
        else:
            self.py_node._run()

class Graph:
    def __init__(self):
        self.nodes = {}

    def add_node(self, node: Node):
        self.nodes[node.id] = node

    async def add_nodes(self, graph_data):
        for node in graph_data['nodes']:
            for custom_class in custom_classes:
                if custom_class['name'] == node['type']:
                    node_class = custom_class['class']

                    if node['id'] not in self.nodes:
                        graph_node = Node(node, node_class)
                        self.add_node(graph_node)
                    else:
                        self.nodes[node['id']].setup(node)
                    text_widgets = node.get('text_widgets', [])
                    number_widgets = node.get('number_widgets', [])
                    select_widgets = node.get('select_widgets', [])
                    self.nodes[node['id']].text_widgets = text_widgets
                    self.nodes[node['id']].number_widgets = number_widgets
                    self.nodes[node['id']].select_widgets = select_widgets
                    break

    async def remove_missing_nodes(self, graph_data):
        nodes_for_deletion = set()
        current_keys = set(self.nodes.keys())
        new_keys = {node['id'] for node in graph_data['nodes']}
        nodes_for_deletion = current_keys - new_keys  # Find obsolete nodes

        for id in nodes_for_deletion:
            print(f"Removing node: {id}")
            del self.nodes[id]

    async def execute_nodes(self):
        for id, node in sorted(self.nodes.items(), key=lambda item: item[1].order):
            previous_node_inputs = []
            if node.inputs is not None:
                for input in node.inputs:
                    previous_node_inputs.append(self.search_nodes_for_output(input['link']))

            async def execute_node():
                if len(previous_node_inputs) == 0:
                    node.execute()
                else:
                    node.execute(*previous_node_inputs)

            await asyncio.create_task(execute_node())

    async def process_nodes(self, graph_data):
        await self.add_nodes(graph_data)
        await self.remove_missing_nodes(graph_data)
        await self.execute_nodes()


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

@app.get("/events")
async def events():
    async def event_generator():
        while True:
            if not message_queue.empty():
                message = message_queue.get()
                yield f"data: {json.dumps(message)}\n\n"
            await asyncio.sleep(0.1)
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
