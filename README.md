# LiteGraph Node Editor with Python Backend

A visual node editor built with LiteGraph.js and Python, allowing creation and execution of custom nodes with a React frontend.

## Setup

### Requirements
- Deno v2.0.0 or later
- Python 3.7+
- FastAPI

### Installation

```bash
pip install fastapi uvicorn
```

## Running the Project

1. Start the Python backend:
```bash
cd backend
python server.py
```

2. Start the frontend development server:
```bash
cd frontend
deno task build && deno task serve
```

The application will be available at `http://localhost:8000`

## Features

- Visual node-based programming interface
- Real-time node execution
- Save/Load graph configurations
- Custom Python nodes with automatic UI generation
- Server-sent events for real-time updates
- Widget support including text, number, and select inputs

## Creating Custom Nodes

### Creating a Node in `nodes.py`

1. Create a new class that inherits from `Node`:

```python
class MyCustomNode(Node):
    def run(self, input_param: str) -> str:
        # Access widget values using self.widgets dictionary
        text_value = self.widgets['text'][0]
        number_value = self.widgets['number'][0]
        select_value = self.widgets['select'][0]
        
        # Your node logic here
        result = f"{input_param}: {text_value}"
        
        return result
```

2. Add widget properties using comments:
```python
class MyCustomNode(Node):
    def run(self, input_param: str) -> str:
        # Basic text widget
        text_input = self.widgets['text'][0]  # {"multiline": false}
        
        # Number widget
        number_input = self.widgets['number'][0]
        
        # Select widget with options
        select_input = self.widgets['select'][0] # {"values": ["1", "2", "3"]}
        
        # Display widget for showing text
        display_text = self.widgets['display_text'][0]
        
        return "result"
```

### Widget Types and Properties

Available widget types:
- `text`: Text input fields
- `number`: Numeric input fields
- `select`: Dropdown selection
- `display_text`: Text display widget

Widget properties in comments:
- `multiline`: (boolean) Enable multiline text input
- `values`: (list) Required for select inputs. Defines dropdown options

### Node Features

1. Input/Output:
- Input parameters in the `run` method become input slots
- Return values become output slots
- Use type hints for better clarity
- Support for multiple inputs/outputs using Python type hints

2. Widgets:
- Access widgets via `self.widgets` dictionary:
  - `self.widgets['text'][index]`
  - `self.widgets['number'][index]`
  - `self.widgets['select'][index]`
  - `self.widgets['display_text'][index]`

3. Real-time Updates:
```python
def run(self):
    # Send updates to the frontend
    self.send_message({'name': 'display_text', 'value': 'Hello'})
    return result
```

## Project Structure

```
├── backend/
│   ├── nodes.py         # Custom node definitions
│   ├── node_utils.py    # Node parsing utilities
│   └── server.py        # FastAPI server
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # React components
│   │   └── utils/       # Node registration logic
│   ├── deno.json       # Deno configuration
│   └── vite.config.ts  # Vite configuration
└── README.md

