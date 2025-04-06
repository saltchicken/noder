import ast
import inspect
import importlib.util
import textwrap
import json

import inspect
import sys
import nodes

from typing import Dict, List, Optional
from collections import defaultdict, deque


class ReactflowNode:
    def __init__(self, node_data: Dict):
        self.id: str = node_data.get('id', '')
        self.type: str = node_data.get('type', '')
        self.position: Dict[str, float] = node_data.get('position', {})
        self.data: Dict = node_data.get('data', {})
        self.widget_values: Dict = self.data.get('widgetValues', {})
        self.python_class = None
        
    @property
    def label(self) -> str:
        return self.data.get('label', '')
    
    @property
    def inputs(self) -> List[Dict]:
        return self.data.get('inputs', [])
    
    @property
    def outputs(self) -> List[Dict]:
        return self.data.get('outputs', [])
    
    @property
    def widgets(self) -> List[Dict]:
        return self.data.get('widgets', [])

class ReactflowGraph:
    def __init__(self, json_data: Dict, python_classes, websocket=None):
        self.python_classes = python_classes
        self.nodes: List[ReactflowNode] = []
        self.edges: List[Dict] = []
        self.node_instances = {}  # Store instantiated node classes
        self.websocket = websocket
        self.update_from_json(json_data)

    def update_from_json(self, json_data: Dict):
        """Updates the graph with new JSON data while preserving existing node instances"""
        new_nodes = json_data.get('nodes', [])
        self.edges = json_data.get('edges', [])
        
        # Update existing nodes and add new ones
        updated_nodes = []
        for node_data in new_nodes:
            node_id = node_data['id']
            
            # Find existing node with same ID
            existing_node = next((node for node in self.nodes if node.id == node_id), None)
            
            if existing_node:
                print("Node already existed")
                # Update existing node's data
                existing_node.position = node_data.get('position', {})
                existing_node.data = node_data.get('data', {})
                existing_node.widget_values = node_data.get('data', {}).get('widgetValues', {})
                updated_nodes.append(existing_node)
            else:
                # Create new node
                new_node = ReactflowNode(node_data)
                # Find and assign python class
                for python_class in self.python_classes:
                    if new_node.data['label'] == python_class['name']:
                        new_node.python_class = python_class['class']
                        if hasattr(new_node.python_class, 'instantiated'):
                            # Create new instance only for new nodes
                            new_node.python_class = new_node.python_class()
                            new_node.python_class.websocket = self.websocket
                            new_node.python_class.node_id = node_id
                updated_nodes.append(new_node)
        
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
            if edge['target'] == node_id:
                source_node = self.get_node_by_id(edge['source'])
                if source_node:
                    source_handle = edge.get('sourceHandle')
                    target_handle = edge.get('targetHandle')
                    # Get indices from the node's inputs/outputs lists
                    source_index = next((i for i, out in enumerate(source_node.outputs) 
                                      if out.get('name') == source_handle), -1)
                    target_index = next((i for i, inp in enumerate(self.get_node_by_id(node_id).inputs) 
                                      if inp.get('name') == target_handle), -1)
                    
                    input_connections.append({
                        'node': source_node,
                        'source_handle': source_handle,
                        'target_handle': target_handle,
                        'source_index': source_index,
                        'target_index': target_index
                    })
                    
            if edge['source'] == node_id:
                target_node = self.get_node_by_id(edge['target'])
                if target_node:
                    source_handle = edge.get('sourceHandle')
                    target_handle = edge.get('targetHandle')
                    # Get indices from the node's inputs/outputs lists
                    source_index = next((i for i, out in enumerate(self.get_node_by_id(node_id).outputs) 
                                      if out.get('name') == source_handle), -1)
                    target_index = next((i for i, inp in enumerate(target_node.inputs) 
                                      if inp.get('name') == target_handle), -1)
                    
                    output_connections.append({
                        'node': target_node,
                        'source_handle': source_handle,
                        'target_handle': target_handle,
                        'source_index': source_index,
                        'target_index': target_index
                    })
                    
        return {
            'inputs': input_connections,
            'outputs': output_connections
        }

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
            source_id = edge['source']
            target_id = edge['target']
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

    async def execute_nodes(self):
        """
        Executes all nodes in order, passing outputs to connected inputs.
        """
        node_results = {}
        ordered_nodes = self.get_execution_order()
        
        for node in ordered_nodes:
            if not hasattr(node.python_class, 'instantiated'):
                node.python_class = node.python_class()
                node.python_class.websocket = self.websocket
                
            node.python_class.node_id = node.id
            node.python_class.widgets = list(node.widget_values.values())
            
            connections = self.get_connected_nodes(node.id)
            input_args = {}
            
            for conn in connections['inputs']:
                source_results = node_results[conn['node'].id]
                # Ensure the source index is valid
                if conn['source_index'] < len(source_results):
                    input_args[conn['target_handle']] = source_results[conn['source_index']]
                else:
                    raise ValueError(
                        f"Node {node.label} connection error:\n"
                        f"- Trying to connect to output index {conn['source_index']} from {conn['node'].label}\n"
                        f"- But {conn['node'].label} only has {len(source_results)} outputs\n"
                        f"- Available outputs: {source_results}"
                    )
            
            try:
                result = await node.python_class._run(**input_args)
                # Ensure result is always a list
                node_results[node.id] = list(result) if isinstance(result, (list, tuple)) else [result]
                
                # print(f"Executed {node.label} with inputs {input_args}")
                # print(f"Got outputs: {node_results[node.id]}")
                
            except Exception as e:
                print(f"Error executing node {node.label}: {str(e)}")
                raise
        
        return node_results





def get_returned_variables(source_code, function_name):
    """
    Parses the function's AST to extract returned variable names, text variables, and number variables.
    """
    tree = ast.parse(textwrap.dedent(source_code))
    returned_vars = []
    widgets = []

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == function_name:
            for stmt in ast.walk(node):
                if isinstance(stmt, ast.Return):
                    if isinstance(stmt.value, ast.Name):
                        returned_vars.append(stmt.value.id)
                    elif isinstance(stmt.value, ast.Tuple):
                        returned_vars.extend([elt.id for elt in stmt.value.elts if isinstance(elt, ast.Name)])
                
                if isinstance(stmt, ast.Assign):
                    for target in stmt.targets:
                        if isinstance(target, ast.Name):
                            if isinstance(stmt.value, ast.Subscript):
                                if 'value' in stmt.value.value.__dict__:
                                    if stmt.value.value.attr == "widgets":
                                        widget = {'name': target.id}
                                        lineno = stmt.lineno
                                        source_lines = source_code.splitlines()
                                        if lineno - 1 < len(source_lines):
                                            line = source_lines[lineno - 1]
                                            if '#' in line:
                                                comment = line[line.index('#')+1:].strip()
                                                try:
                                                    widget = {**widget, **json.loads(comment)}
                                                except:
                                                    print("Failed to parse comment as JSON:", comment)
                                        widgets.append(widget)

    # print(widgets)
    return returned_vars, widgets

def get_run_methods(module):
    run_methods = {}

    for class_name, cls in inspect.getmembers(module, inspect.isclass):
        if class_name == "Node":
            continue
        for method_name, method in inspect.getmembers(cls, inspect.isfunction):
            if method_name == "run":
                signature = inspect.signature(method)
                return_annotation = signature.return_annotation

                try:
                    source_lines, start_line = inspect.getsourcelines(method)
                    source_code = "".join(source_lines)
                    source_code = textwrap.dedent(source_code)
                except OSError:
                    source_code = ""

                returned_vars, widgets = get_returned_variables(source_code, method_name)

                # Handle inputs
                inputs = []
                for param_name, param in signature.parameters.items():
                    if param_name != 'self':  # Skip self parameter
                        input_dict = {
                            'name': param_name,
                            'type': str(param.annotation)
                        }
                        inputs.append(input_dict)

                # Handle outputs

                outputs = []
                if returned_vars:
                    if hasattr(return_annotation, '__args__'):
                        print(return_annotation.__args__)
                        for var, type_arg in zip(returned_vars, return_annotation.__args__):
                            outputs.append({"name": var, "type": str(type_arg)})
                    else:
                        for var in returned_vars:
                            outputs.append({"name": var, "type": str(return_annotation)})

                run_methods[f"{class_name}.run"] = {
                    "parameters": inputs,
                    "return_type": str(return_annotation) if return_annotation != inspect.Signature.empty else "None",
                    "returned_variables": returned_vars,
                    "file": inspect.getsourcefile(method),
                    "line": start_line,
                    "outputs": outputs,
                    "widgets": widgets,

                }

    return run_methods

def load_script(script_path):
    spec = importlib.util.spec_from_file_location("script", script_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

# Example usage
def get_python_classes():
    script_path = "nodes.py"
    module = load_script(script_path)
    run_methods = get_run_methods(module)

    inputs = {}
    outputs = {}
    widgets = {}
    for name, info in run_methods.items():
        cls_name = name.split('.')[0]
        inputs[cls_name] = info["parameters"]
        outputs[cls_name] = info["outputs"]
        widgets[cls_name] = info['widgets']

    python_classes = [
        {
            "name": cls_name,
            "inputs": inputs[cls_name],
            "outputs": outputs[cls_name],
            "widgets" : widgets[cls_name],
            "class": cls_obj
        }
        for cls_name, cls_obj in inspect.getmembers(sys.modules['nodes'])
        if inspect.isclass(cls_obj) and cls_name != "Node"
    ]

    print(python_classes)
    return python_classes
