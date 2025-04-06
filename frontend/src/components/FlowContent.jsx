import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import {
  useReactFlow,
  ReactFlow,
  Panel,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls
} from '@xyflow/react';

import ContextMenu from './ContextMenu';
import PythonNode from '../nodes/PythonNode.tsx';


function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}



const FlowContent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pythonNodes, setPythonNodes] = useState([]);
  const ref = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const { addNodes, screenToFlowPosition } = useReactFlow();


  const onWidgetValuesChange = useCallback((nodeId, newValues) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId
          ? {
            ...node,
            data: {
              ...node.data,
              widgetValues: newValues,
            },
          }
          : node
      )
    );
  }, []);

  const nodeTypes = useMemo(() => ({
    pythonNode: (props) => (
      <PythonNode
        {...props}
        onWidgetValuesChange={(values) => onWidgetValuesChange(props.id, values)}
      />
    )
  }), [onWidgetValuesChange]);

  useEffect(() => {
    const fetchPythonNodes = async () => {
      try {
        const API_URL = `http://${window.location.hostname}:3000/python_nodes`;
        const response = await fetch(API_URL, {
          method: "POST"
        });
        if (!response.ok) {
          throw new Error('Failed to fetch python nodes');
        }
        const data = await response.json();
        // console.log('Python nodes:', data.nodes);
        setPythonNodes(data.nodes);
      } catch (error) {
        console.error('Error fetching python nodes:', error);
      }
    };

    fetchPythonNodes();
  }, []);

  const handleNodeMessage = useCallback((messageData) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === messageData.nodeId) {
          const { type, data } = messageData.message;
          if (type === 'status') {
            return {
              ...node,
              className: data
            };
          } else if (type === 'widget_update') {
            return {
              ...node,
              data: {
                ...node.data,
                widgetValues: {
                  ...node.data.widgetValues,
                  [data.name]: data.value
                }
              }
            };
          } else {
            console.log("Received unknown message type");
            return node;
          }
        } else {
          return node;
        }
      })
    );
  }, []);


  const connectWebSocket = useCallback(() => {
    const WS_URL = `ws://${window.location.hostname}:3000/ws`;
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setSocket(ws);
      setIsConnected(true);
      // Clear any existing reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'node_message':
            handleNodeMessage(message.data);
            break;
          case 'success':
            console.log('Success:', message.data);
            break;
          case 'error':
            console.error('Error:', message.data);
            break;
          default:
            console.log('Unknown message type:', message);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
      setSocket(null);

      // Schedule reconnection attempt
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        connectWebSocket();
      }, 2000); // Try to reconnect after 2 seconds
    };

    return ws;
  }, []);

  useEffect(() => {
    const ws = connectWebSocket();

    // Cleanup on component unmount
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setIsConnected(false);
      setSocket(null);
    };
  }, [connectWebSocket]);

  const sendToWebSocket = useCallback((data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    }
  }, [socket]);

  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(node => node.id === params.source);
    const targetNode = nodes.find(node => node.id === params.target);

    const sourceOutput = sourceNode.data.outputs.find(
      output => output.name === params.sourceHandle
    );
    const targetInput = targetNode.data.inputs.find(
      input => input.name === params.targetHandle
    );

    const isTypeCompatible = (sourceType, targetType) => {
      return sourceType === targetType;
    };

    if (isTypeCompatible(sourceOutput.type, targetInput.type)) {
      setEdges((els) => addEdge(params, els));
    } else {
      console.warn(`Type mismatch: Cannot connect ${sourceOutput.type} to ${targetInput.type}`);
    }
  }, [nodes, setEdges]);


  const onConnectEnd = useCallback(
    (event, params) => {
      // console.log(event);
      // console.log(params);
    },
    []
  );

  const onSave = useCallback(() => {
    const flow = {
      nodes: nodes,
      edges: edges,
    };
    const json = JSON.stringify(flow);
    localStorage.setItem('flow', json);
  }, [nodes, edges]);


  const onRestore = useCallback(() => {
    const flowString = localStorage.getItem('flow');
    if (!flowString) return;

    const flow = JSON.parse(flowString);
    if (flow) {
      // Ensure widgetValues are properly restored for each node
      const nodesWithRestoredWidgets = flow.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          widgetValues: node.data.widgetValues || {}  // Preserve or initialize widgetValues
        }
      }));

      setNodes(nodesWithRestoredWidgets);
      setEdges(flow.edges);
    }
  }, [setNodes, setEdges]);

  const onProcess = useCallback(() => {
    const flow = {
      nodes: nodes.map(node => ({
        ...node,
        // Only include necessary data
        data: {
          ...node.data,
          widgetValues: node.data.widgetValues || {},
        }
      })),
      edges: edges,
    };
    const json = JSON.stringify(flow, (key, value) =>
      key === "position" || key === "measured" ? undefined : value, 2);
    // console.log(json);
    console.log('Widget Values:', nodes.map(node => node.data.widgetValues));
    sendToWebSocket(json);
  }, [nodes, edges, sendToWebSocket]);

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      const pane = ref.current.getBoundingClientRect();
      setMenu({
        id: node.id,
        type: 'node',
        top: event.clientY < pane.height - 200 && event.clientY,
        left: event.clientX < pane.width - 200 && event.clientX,
        right: event.clientX >= pane.width - 200 && pane.width - event.clientX,
        bottom:
          event.clientY >= pane.height - 200 && pane.height - event.clientY,
      });
    },
    [setMenu],
  );

  const onPaneContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      const pane = ref.current.getBoundingClientRect();
      setMenu({
        type: 'pane',
        top: event.clientY < pane.height - 200 && event.clientY,
        left: event.clientX < pane.width - 200 && event.clientX,
        right: event.clientX >= pane.width - 200 && pane.width - event.clientX,
        bottom:
          event.clientY >= pane.height - 200 && pane.height - event.clientY,
      });
    },
    [setMenu],
  );

  const onExportFlow = useCallback(async () => {
    const flow = {
      nodes: nodes,
      edges: edges,
    };

    try {
      const response = await fetch(`http://${window.location.hostname}:3000/export_flow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flow),
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Create a download link for the exported file
        const downloadUrl = `http://${window.location.hostname}:3000/saved_flows/${data.filename}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error('Export failed:', data.message);
      }
    } catch (error) {
      console.error('Error exporting flow:', error);
    }
  }, [nodes, edges]);

  const onImportFlow = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`http://${window.location.hostname}:3000/import_flow`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Ensure widgetValues are properly restored for each node
        const nodesWithRestoredWidgets = data.flow.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            widgetValues: node.data.widgetValues || {}
          }
        }));

        setNodes(nodesWithRestoredWidgets);
        setEdges(data.flow.edges);
      } else {
        console.error('Import failed:', data.message);
      }
    } catch (error) {
      console.error('Error importing flow:', error);
    }

    // Reset the file input
    event.target.value = '';
  }, [setNodes, setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();

    const file = event.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: uuidv4(),
        type: 'pythonNode',
        position,
        style: { minWidth: '300px', minHeight: '250px' },
        data: {
          label: 'ShowImage',
          inputs: [],
          outputs: [
            {
              name: 'test',
              type: '<class \'str\'>'
            }
          ],
          widgets: [
            {
              name: 'test',
              type: 'image',
              value: e.target.result
            }
          ],
          widgetValues: {
            test: e.target.result
          }
        }
      };

      addNodes(newNode);
    };

    reader.readAsDataURL(file);
  }, [addNodes, screenToFlowPosition]);



  // Close the context menu if it's open whenever the window is clicked.
  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);
  const onPaneMove = useCallback(() => setMenu(null), [setMenu]);


  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        ref={ref}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onMove={onPaneMove}
        onNodeContextMenu={onNodeContextMenu}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
      >
        <Background />
        {menu && <ContextMenu onClick={onPaneClick} pythonNodes={pythonNodes} {...menu} />}

        <Controls />
        <Panel position="top-left">
          <button onClick={onRestore}>Restore</button>
          <button onClick={onSave}>Save</button>
          <button onClick={onProcess}>Process</button>
          <button onClick={onExportFlow}>Export Flow</button>
          <button onClick={() => document.getElementById('file-input').click()}>
            Import Flow
          </button>
          <input
            id="file-input"
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={onImportFlow}
          />
          <div style={{ color: 'white' }}>
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default FlowContent;
