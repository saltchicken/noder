import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import {
  useReactFlow,
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls
} from '@xyflow/react';

import ContextMenu from './ContextMenu';
import PanelControls from './PanelControls';
import PythonNode from '../nodes/PythonNode.tsx';
import { useWebSocket } from '../hooks/useWebSocket';
import { createPythonNode } from '../utils/nodeCreation';
import { validateImage } from '../utils/imageValidation';

const FlowContent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState(null);
  const [pythonNodes, setPythonNodes] = useState([]);
  const ref = useRef(null);
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
          }
        }
        return node;
      })
    );
  }, []);

  const { isConnected, sendToWebSocket } = useWebSocket(handleNodeMessage);

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

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();

    const file = event.dataTransfer.files[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.isValid) {
      console.warn(validation.error);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = createPythonNode({
        position,
        nodeType: 'ImageSource',
        customData: {
          imageData: e.target.result
        }
      });

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
        <PanelControls
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          sendToWebSocket={sendToWebSocket}
          isConnected={isConnected}
        />
      </ReactFlow>
    </div>
  );
};

export default FlowContent;
