# Noder - Visual Python Interface

A visual programming interface that combines React Flow for the frontend and FastAPI for the backend, allowing users to create and execute node-based workflows.

## Features

- Interactive node-based visual programming interface
- Real-time node execution with WebSocket communication
- Custom Python nodes with dynamic widget support
- Auto-reload development environment
- Built-in node types including:
  - Text display
  - Image handling
  - Custom Python nodes

## Prerequisites

- Python 3.x
- Bun (for JavaScript package management)
- Node.js >= 18.18.0

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd flower
```

2. Install frontend dependencies:
```bash
cd frontend
bun install
```

3. Install backend dependencies:
```bash
cd backend
pip install fastapi uvicorn websockets pillow
```

## Development

Run the development server with auto-reload:

```bash
python run.py --reload
```

This will:
- Build the frontend
- Start the backend server
- Watch for changes in both frontend and backend files
- Automatically rebuild/restart when changes are detected

## Project Structure

```
.
├── frontend/               # React + Vite frontend
│   ├── src/               # Frontend source code
│   ├── dist/              # Built frontend files
│   └── package.json       # Frontend dependencies
├── backend/               # FastAPI backend
│   ├── server.py          # Main server file
│   ├── nodes.py          # Node definitions
│   └── node_utils.py     # Node utilities
└── run.py                # Development server script
```

## Usage

1. Start the server:
```bash
python run.py
```

2. Open your browser to `http://localhost:3000`

3. Create your flow by:
   - Right-clicking to add nodes
   - Connecting nodes by dragging between handles
   - Configuring node parameters
   - Clicking "Process" to execute the flow

## Adding Custom Nodes

1. Create a new node class in `backend/nodes.py`:
```python
class MyCustomNode(Node):
    async def run(self) -> Any:
        # Node implementation
        pass
```

2. Define widgets and implement the node's logic

## License

[Your License Here]
