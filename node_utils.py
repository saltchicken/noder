import ast
import inspect
import importlib.util
import textwrap
import json

import inspect
import sys
import nodes

from typing import Dict, List, Optional

class ReactflowNode:
    def __init__(self, node_data: Dict):
        self.id: str = node_data.get('id', '')
        self.type: str = node_data.get('type', '')
        self.position: Dict[str, float] = node_data.get('position', {})
        self.data: Dict = node_data.get('data', {})
        self.widget_values: Dict = self.data.get('widgetValues', {})
        
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
    def __init__(self, json_data: Dict):
        self.nodes: List[ReactflowNode] = [
            ReactflowNode(node) for node in json_data.get('nodes', [])
        ]
        self.edges: List[Dict] = json_data.get('edges', [])
    
    def get_node_by_id(self, node_id: str) -> Optional[ReactflowNode]:
        return next((node for node in self.nodes if node.id == node_id), None)
    
    def get_connected_nodes(self, node_id: str) -> Dict[str, List[ReactflowNode]]:
        """Returns dict with 'inputs' and 'outputs' lists of connected nodes"""
        input_nodes = []
        output_nodes = []
        
        for edge in self.edges:
            if edge['target'] == node_id:
                source_node = self.get_node_by_id(edge['source'])
                if source_node:
                    input_nodes.append(source_node)
            if edge['source'] == node_id:
                target_node = self.get_node_by_id(edge['target'])
                if target_node:
                    output_nodes.append(target_node)
                    
        return {
            'inputs': input_nodes,
            'outputs': output_nodes
        }



def get_returned_variables(source_code, function_name):
    """
    Parses the function's AST to extract returned variable names, text variables, and number variables.
    """
    tree = ast.parse(textwrap.dedent(source_code))
    returned_vars = []
    widgets = []

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == function_name:
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

    print(widgets)
    return returned_vars, widgets

def get_run_methods(module):
    run_methods = {}

    for class_name, cls in inspect.getmembers(module, inspect.isclass):
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
                            'type': "STRING"  # Default to STRING for now
                        }
                        inputs.append(input_dict)

                # Handle outputs
                outputs = []
                if hasattr(cls, 'outputs'):
                    outputs = cls.outputs
                elif returned_vars:
                    outputs = [{"name": var, "type": "STRING"} for var in returned_vars]

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

    return python_classes
