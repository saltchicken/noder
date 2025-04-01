import ast
import inspect
import importlib.util
import textwrap
import json

import inspect
import sys
import nodes


def get_returned_variables(source_code, function_name):
    """
    Parses the function's AST to extract returned variable names, text variables, and number variables.
    """
    tree = ast.parse(textwrap.dedent(source_code))
    returned_vars = []
    text_assignments = []
    number_assignments = []
    select_assignments = []
    display_text_assignments = []
    widget_comments = {}

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
                                    if isinstance(stmt.value.value.value, ast.Attribute):
                                        attr = stmt.value.value.value
                                        if 'attr' in attr.__dict__ and attr.attr == 'widgets':
                                            if isinstance(stmt.value.value.slice, ast.Constant):
                                                widget_type = stmt.value.value.slice.value
                                                if widget_type == "text":
                                                    text_assignments.append(target.id)
                                                    lineno = stmt.lineno
                                                    source_lines = source_code.splitlines()
                                                    if lineno - 1 < len(source_lines):
                                                        line = source_lines[lineno - 1]
                                                        if '#' in line:
                                                            comment = line[line.index('#')+1:].strip()
                                                            try:
                                                                widget_comments[target.id] = json.loads(comment)
                                                            except:
                                                                print("Failed to parse comment as JSON:", comment)
                                                elif widget_type == "number":
                                                    number_assignments.append(target.id)
                                                elif widget_type == 'select':
                                                    select_assignments.append(target.id)
                                                    lineno = stmt.lineno
                                                    source_lines = source_code.splitlines()
                                                    if lineno - 1 < len(source_lines):
                                                        line = source_lines[lineno - 1]
                                                        if '#' in line:
                                                            comment = line[line.index('#')+1:].strip()
                                                            try:
                                                                widget_comments[target.id] = json.loads(comment)
                                                            except:
                                                                print("Failed to parse comment as JSON:", comment)
                                                elif widget_type == 'display_text':
                                                    display_text_assignments.append(target.id)

    print(widget_comments)
    print(display_text_assignments)
    return returned_vars, text_assignments, number_assignments, select_assignments, display_text_assignments, widget_comments

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

                returned_vars, text_vars, number_vars, select_vars, display_text_vars, widget_comments = get_returned_variables(source_code, method_name)

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
                    "text_vars": text_vars,
                    "number_vars": number_vars,
                    "select_vars": select_vars,
                    "display_text_vars": display_text_vars,
                    "widget_comments": widget_comments

                }

    return run_methods

def load_script(script_path):
    spec = importlib.util.spec_from_file_location("script", script_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

# Example usage
def get_custom_classes():
    script_path = "nodes.py"
    module = load_script(script_path)
    run_methods = get_run_methods(module)

    inputs = {}
    outputs = {}
    text_vars = {}
    number_vars = {}
    select_vars = {}
    display_text_vars = {}
    widget_comments = {}
    for name, info in run_methods.items():
        cls_name = name.split('.')[0]
        inputs[cls_name] = info["parameters"]
        outputs[cls_name] = info["outputs"]
        text_vars[cls_name] = info["text_vars"]
        number_vars[cls_name] = info["number_vars"]
        select_vars[cls_name] = info["select_vars"]
        display_text_vars[cls_name] = info["display_text_vars"]
        widget_comments[cls_name] = info["widget_comments"]

    custom_classes = [
        {
            "name": cls_name,
            "inputs": inputs[cls_name],
            "outputs": outputs[cls_name],
            "text_vars": text_vars[cls_name],
            "number_vars": number_vars[cls_name],
            "select_vars": select_vars[cls_name],
            "display_text_vars": display_text_vars[cls_name],
            "widget_comments": widget_comments[cls_name],
            "class": cls_obj
        }
        for cls_name, cls_obj in inspect.getmembers(sys.modules['nodes'])
        if inspect.isclass(cls_obj) and cls_name != "Node"
    ]

    return custom_classes
