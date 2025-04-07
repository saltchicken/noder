import ast
import inspect
import importlib.util
import textwrap
import json

import sys
import nodes

from typing import Union


def get_returned_variables(source_code, function_name):
    """
    Parses the function's AST to extract returned variable names, text variables, and number variables.
    """
    tree = ast.parse(textwrap.dedent(source_code))
    returned_vars = []
    widgets = []

    for node in ast.walk(tree):
        if (
            isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
            and node.name == function_name
        ):
            for stmt in ast.walk(node):
                if isinstance(stmt, ast.Return):
                    if isinstance(stmt.value, ast.Name):
                        returned_vars.append(stmt.value.id)
                    elif isinstance(stmt.value, ast.Tuple):
                        returned_vars.extend(
                            [
                                elt.id
                                for elt in stmt.value.elts
                                if isinstance(elt, ast.Name)
                            ]
                        )

                if isinstance(stmt, ast.Assign):
                    for target in stmt.targets:
                        if isinstance(target, ast.Name):
                            if isinstance(stmt.value, ast.Subscript):
                                if "value" in stmt.value.value.__dict__:
                                    if stmt.value.value.attr == "widgets":
                                        # Get the widget index from the assignment
                                        widget_index = None
                                        if isinstance(stmt.value.slice, ast.Constant):
                                            widget_index = stmt.value.slice.value

                                        widget = {"name": target.id}
                                        lineno = stmt.lineno
                                        source_lines = source_code.splitlines()

                                        # Look for comments in current and next lines
                                        comment = None
                                        in_json_block = False

                                        for i in range(
                                            3
                                        ):  # Check current line and 2 lines after
                                            if lineno - 1 + i < len(source_lines):
                                                line = source_lines[
                                                    lineno - 1 + i
                                                ].strip()

                                                # Skip empty lines
                                                if not line:
                                                    continue

                                                # Check if this line contains self.widgets[index]
                                                if "self.widgets[" in line:
                                                    try:
                                                        line_index = int(
                                                            line[
                                                                line.index("[")
                                                                + 1 : line.index("]")
                                                            ]
                                                        )
                                                        if line_index != widget_index:
                                                            break
                                                    except ValueError:
                                                        continue

                                                if "#" in line:
                                                    comment_part = line[
                                                        line.index("#") + 1 :
                                                    ].strip()

                                                    # Check if this starts a JSON block
                                                    if comment_part.strip().startswith(
                                                        "{"
                                                    ):
                                                        in_json_block = True
                                                        comment = comment_part
                                                    # If we're in a JSON block and line contains only commas and values
                                                    elif in_json_block and (
                                                        comment_part.strip().endswith(
                                                            ","
                                                        )
                                                        or comment_part.strip().endswith(
                                                            "}"
                                                        )
                                                    ):
                                                        comment += " " + comment_part
                                                        if comment_part.strip().endswith(
                                                            "}"
                                                        ):
                                                            break
                                                    # If it's a standalone comment not part of JSON block
                                                    elif not in_json_block:
                                                        comment = comment_part
                                                        break

                                        if comment:
                                            try:
                                                # Clean up any line continuations or extra whitespace
                                                comment = comment.replace(
                                                    "\\", ""
                                                ).strip()
                                                widget = {
                                                    **widget,
                                                    **json.loads(comment),
                                                }
                                            except json.JSONDecodeError:
                                                print(
                                                    "Failed to parse comment as JSON:",
                                                    comment,
                                                )
                                        widgets.append(widget)

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

                returned_vars, widgets = get_returned_variables(
                    source_code, method_name
                )

                # Handle inputs
                inputs = []
                for param_name, param in signature.parameters.items():
                    if param_name != "self":  # Skip self parameter
                        param_type = param.annotation
                        type_str = str(param.annotation)
                        accepts_multiple = False

                        # Handle Union types
                        if hasattr(param_type, "__origin__"):
                            if param_type.__origin__ is Union:
                                # Extract the str type from Union[str, List[str]]
                                base_type = next(
                                    (t for t in param_type.__args__ if t is str), None
                                )
                                if base_type:
                                    type_str = str(base_type)
                                    # Check if List[str] is in the Union
                                    list_type = next(
                                        (
                                            t
                                            for t in param_type.__args__
                                            if hasattr(t, "__origin__")
                                            and t.__origin__ is list
                                        ),
                                        None,
                                    )
                                    accepts_multiple = bool(list_type)

                        input_dict = {
                            "name": param_name,
                            "type": type_str,
                            "accepts_multiple": accepts_multiple,
                        }
                        inputs.append(input_dict)

                print(f"{class_name}.run: {inputs}")

                # Handle outputs

                outputs = []
                if returned_vars:
                    if hasattr(return_annotation, "__args__"):
                        print(return_annotation.__args__)
                        for var, type_arg in zip(
                            returned_vars, return_annotation.__args__
                        ):
                            outputs.append({"name": var, "type": str(type_arg)})
                    else:
                        for var in returned_vars:
                            outputs.append(
                                {"name": var, "type": str(return_annotation)}
                            )

                run_methods[f"{class_name}.run"] = {
                    "parameters": inputs,
                    "return_type": str(return_annotation)
                    if return_annotation != inspect.Signature.empty
                    else "None",
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


def get_python_classes():
    script_path = "nodes.py"
    module = load_script(script_path)
    run_methods = get_run_methods(module)

    inputs = {}
    outputs = {}
    widgets = {}
    for name, info in run_methods.items():
        cls_name = name.split(".")[0]
        inputs[cls_name] = info["parameters"]
        outputs[cls_name] = info["outputs"]
        widgets[cls_name] = info["widgets"]

    python_classes = [
        {
            "name": cls_name,
            "inputs": inputs[cls_name],
            "outputs": outputs[cls_name],
            "widgets": widgets[cls_name],
            "class": cls_obj,
        }
        for cls_name, cls_obj in inspect.getmembers(sys.modules["nodes"])
        if inspect.isclass(cls_obj) and cls_name != "Node"
    ]

    return python_classes
