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

The application will be available at `http://localhost:5173`

## Creating Custom Nodes

### Creating a Node in `nodes.py`

1. Create a new class that inherits from `Node`:

```python
class MyCustomNode(Node):
    def __init__(self):
        super().__init__()
        
    def run(self, input_param: str) -> str:
        # Access widget values using self.text_widgets and self.number_widgets
        widget_value = self.text_widgets[0]
        
        # Your node logic here
        result = f"{input_param}: {widget_value}"
        
        return result
```

2. Add widgets using comments:
```python
class MyCustomNode(Node):
    def run(self, input_param: str) -> str:
        # Basic text widget
        text_input = self.text_widgets[0]  # {"multiline": false}
        
        # Number widget
        number_input = self.number_widgets[0]
        
        return "result"
```

### Widget Properties

Available widget properties in comments:
- `multiline`: (boolean) Enable multiline text input
- `height`: (number) Widget height in pixels
- `width`: (number) Widget width in pixels

### Node Features

1. Input/Output:
- Input parameters in the `run` method become input slots
- Return values become output slots
- Use type hints for better clarity

2. Widgets:
- Access text widgets via `self.text_widgets[index]`
- Access number widgets via `self.number_widgets[index]`

3. Sending Messages:
```python
def run(self):
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
│   ├── src/
│   │   ├── components/  # React components
│   │   └── utils/       # Node registration logic
│   ├── deno.json       # Deno configuration
│   └── vite.config.ts  # Vite configuration
└── README.md
```

## Building for Production

```bash
cd frontend
deno task build
