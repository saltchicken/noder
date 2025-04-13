from typing import Dict, List, Optional
from collections import defaultdict, deque


class ReactflowNode:
    def __init__(self, node_data: Dict):
        self.id: str = node_data.get("id", "")
        self.type: str = node_data.get("type", "")
        self.position: Dict[str, float] = node_data.get("position", {})
        self.data: Dict = node_data.get("data", {})
        self.widget_values: Dict = self.data.get("widgetValues", {})
        self.python_class = None

    @property
    def label(self) -> str:
        return self.data.get("label", "")

    @property
    def inputs(self) -> List[Dict]:
        return self.data.get("inputs", [])

    @property
    def outputs(self) -> List[Dict]:
        return self.data.get("outputs", [])

    @property
    def widgets(self) -> List[Dict]:
        return self.data.get("widgets", [])


class ReactflowGraph:
    def __init__(self, json_data: Dict, python_classes, websocket=None):
        self.python_classes = python_classes
        self.nodes: List[ReactflowNode] = []
        self.edges: List[Dict] = []
        self.node_instances = {}  # Store instantiated node classes
        self.websocket = websocket
        self.update_from_json(json_data)

    def update_node(self, node_data):
        node_id = node_data["id"]

        # Find existing node with same ID
        existing_node = next((node for node in self.nodes if node.id == node_id), None)

        if existing_node:
            print("Node already existed")
            # Update existing node's data
            existing_node.position = node_data.get("position", {})
            existing_node.data = node_data.get("data", {})
            existing_node.widget_values = node_data.get("data", {}).get(
                "widgetValues", {}
            )
            return existing_node
        else:
            # Create new node
            new_node = ReactflowNode(node_data)
            # Find and assign python class
            for python_class in self.python_classes:
                if new_node.data["label"] == python_class["name"]:
                    new_node.python_class = python_class["class"]
                    if hasattr(new_node.python_class, "instantiated"):
                        # Create new instance only for new nodes
                        new_node.python_class = new_node.python_class()
                        new_node.python_class.websocket = self.websocket
                        new_node.python_class.node_id = node_id
            return new_node

    def one_shot(self, node_data):
        node = self.update_node(node_data)
        self.nodes.append(node)

    def update_from_json(self, json_data: Dict):
        """Updates the graph with new JSON data while preserving existing node instances"""
        new_nodes = json_data.get("nodes", [])
        self.edges = json_data.get("edges", [])

        # Update existing nodes and add new ones
        updated_nodes = []
        for node_data in new_nodes:
            updated_node = self.update_node(node_data)
            updated_nodes.append(updated_node)

        # Remove nodes that no longer exist in the new data
        self.nodes = updated_nodes

    def get_node_by_id(self, node_id: str) -> Optional[ReactflowNode]:
        return next((node for node in self.nodes if node.id == node_id), None)

    def get_connected_nodes(self, node_id: str) -> Dict[str, List[Dict]]:
        """
        Returns dict with 'inputs' and 'outputs' lists of connected nodes.
        Each connection includes the node, variable names, and slot indices.

        Returns:
            {
                'inputs': [{
                    'node': ReactflowNode,
                    'source_handle': str,
                    'target_handle': str,
                    'source_index': int,
                    'target_index': int
                }],
                'outputs': [{
                    'node': ReactflowNode,
                    'source_handle': str,
                    'target_handle': str,
                    'source_index': int,
                    'target_index': int
                }]
            }
        """
        input_connections = []
        output_connections = []

        for edge in self.edges:
            if edge["target"] == node_id:
                source_node = self.get_node_by_id(edge["source"])
                if source_node:
                    source_handle = edge.get("sourceHandle")
                    target_handle = edge.get("targetHandle")
                    # Get indices from the node's inputs/outputs lists
                    source_index = next(
                        (
                            i
                            for i, out in enumerate(source_node.outputs)
                            if out.get("name") == source_handle
                        ),
                        -1,
                    )
                    target_index = next(
                        (
                            i
                            for i, inp in enumerate(self.get_node_by_id(node_id).inputs)
                            if inp.get("name") == target_handle
                        ),
                        -1,
                    )

                    input_connections.append(
                        {
                            "node": source_node,
                            "source_handle": source_handle,
                            "target_handle": target_handle,
                            "source_index": source_index,
                            "target_index": target_index,
                        }
                    )

            if edge["source"] == node_id:
                target_node = self.get_node_by_id(edge["target"])
                if target_node:
                    source_handle = edge.get("sourceHandle")
                    target_handle = edge.get("targetHandle")
                    # Get indices from the node's inputs/outputs lists
                    source_index = next(
                        (
                            i
                            for i, out in enumerate(
                                self.get_node_by_id(node_id).outputs
                            )
                            if out.get("name") == source_handle
                        ),
                        -1,
                    )
                    target_index = next(
                        (
                            i
                            for i, inp in enumerate(target_node.inputs)
                            if inp.get("name") == target_handle
                        ),
                        -1,
                    )

                    output_connections.append(
                        {
                            "node": target_node,
                            "source_handle": source_handle,
                            "target_handle": target_handle,
                            "source_index": source_index,
                            "target_index": target_index,
                        }
                    )

        return {"inputs": input_connections, "outputs": output_connections}

    def get_execution_order(self) -> List[ReactflowNode]:
        """
        Determines node execution order using topological sort.
        Returns a list of nodes in execution order.
        """
        # Create adjacency list and in-degree count
        adj_list = defaultdict(list)
        in_degree = defaultdict(int)

        # Build the graph representation
        for edge in self.edges:
            source_id = edge["source"]
            target_id = edge["target"]
            adj_list[source_id].append(target_id)
            in_degree[target_id] += 1

        # Initialize queue with nodes that have no inputs
        queue = deque()
        for node in self.nodes:
            if in_degree[node.id] == 0:
                queue.append(node)

        # Process the queue
        execution_order = []
        while queue:
            current_node = queue.popleft()
            execution_order.append(current_node)

            # Process children
            for target_id in adj_list[current_node.id]:
                in_degree[target_id] -= 1
                if in_degree[target_id] == 0:
                    target_node = self.get_node_by_id(target_id)
                    if target_node:
                        queue.append(target_node)

        # Check for cycles
        if len(execution_order) != len(self.nodes):
            raise ValueError("Graph contains cycles")

        return execution_order

    async def execute_node(self, node_data):
        node = self.get_node_by_id(node_data["id"])
        if not node:
            print("Error: Did not find node. Returning nothing")
            return
        if not hasattr(node.python_class, "instantiated"):
            node.python_class = node.python_class()
            node.python_class.websocket = self.websocket

        node.python_class.node_id = node.id
        node.python_class.widgets = list(node.widget_values.values())
        try:
            function_name = node_data.get("function_name")
            if function_name and hasattr(node.python_class, function_name):
                func = getattr(node.python_class, function_name)
                await func()
            else:
                print("That function didn't exist")
        except Exception as e:
            print(f"Error executing node {node.label}: {str(e)}")
            raise

    async def execute_nodes(self):
        """
        Executes all nodes in order, passing outputs to connected inputs.
        """
        node_results = {}
        ordered_nodes = self.get_execution_order()

        for node in ordered_nodes:
            if not hasattr(node.python_class, "instantiated"):
                node.python_class = node.python_class()
                node.python_class.websocket = self.websocket

            node.python_class.node_id = node.id
            node.python_class.widgets = list(node.widget_values.values())

            connections = self.get_connected_nodes(node.id)
            input_args = {}

            # Group inputs by target handle
            grouped_inputs = {}
            for conn in connections["inputs"]:
                target_handle = conn["target_handle"]
                if target_handle not in grouped_inputs:
                    grouped_inputs[target_handle] = []

                source_results = node_results[conn["node"].id]
                if conn["source_index"] < len(source_results):
                    grouped_inputs[target_handle].append(
                        source_results[conn["source_index"]]
                    )
                else:
                    raise ValueError(
                        f"Node {node.label} connection error:\n"
                        f"- Trying to connect to output index {conn['source_index']} from {conn['node'].label}\n"
                        f"- But {conn['node'].label} only has {len(source_results)} outputs\n"
                        f"- Available outputs: {source_results}"
                    )

            # Convert grouped inputs to final input arguments
            for handle, values in grouped_inputs.items():
                if len(values) == 1:
                    input_args[handle] = values[0]
                else:
                    input_args[handle] = values

            try:
                result = await node.python_class._run(**input_args)
                node_results[node.id] = (
                    list(result) if isinstance(result, (list, tuple)) else [result]
                )

            except Exception as e:
                print(f"Error executing node {node.label}: {str(e)}")
                raise

        return node_results
