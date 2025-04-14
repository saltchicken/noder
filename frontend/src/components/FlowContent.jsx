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
import { validateImage, validateVideo } from '../utils/mediaValidation';
import Notifications from './Notifications';

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
          } else if (type === 'widget_update_options') {
            return {
              ...node,
              data: {
                ...node.data,
                widgets: node.data.widgets.map(widget =>
                  widget.name === data.name
                    ? { ...widget, options: data.options }
                    : widget
                )
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
      const menuWidth = 200; // Approximate menu width

      // If menu would overflow right edge, position from right instead of left
      const isCloseToRightEdge = event.clientX + menuWidth > pane.width;

      setMenu({
        id: node.id,
        type: 'node',
        top: event.clientY < pane.height - 200 && event.clientY,
        left: !isCloseToRightEdge && event.clientX,
        right: isCloseToRightEdge && (pane.width - event.clientX),
        bottom: event.clientY >= pane.height - 200 && pane.height - event.clientY,
      });
    },
    [setMenu],
  );

  const onPaneContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      const pane = ref.current.getBoundingClientRect();
      const menuWidth = 200; // Approximate menu width

      // If menu would overflow right edge, position from right instead of left
      const isCloseToRightEdge = event.clientX + menuWidth > pane.width;

      setMenu({
        type: 'pane',
        top: event.clientY < pane.height - 200 && event.clientY,
        left: !isCloseToRightEdge && event.clientX,
        right: isCloseToRightEdge && (pane.width - event.clientX),
        bottom: event.clientY >= pane.height - 200 && pane.height - event.clientY,
      });
    },
    [setMenu],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);


  // TODO: When calling addNodes the node is not initialized automatically like it does when this is called from the ContextMenu because there is an extra websocket function. Make a solid function for creating nodes.
  const onDrop = useCallback((event) => {
    event.preventDefault();

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    // Calculate initial position for the first node
    const initialPosition = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    // Process each file
    files.forEach((file, index) => {
      console.log(index);
      // Calculate offset position for subsequent nodes
      const position = {
        x: initialPosition.x + (index * 250), // Offset each node horizontally
        y: initialPosition.y
      };

      // Handle video files
      if (file.type.startsWith('video/')) {
        const validation = validateVideo(file);
        if (!validation.isValid) {
          console.warn(`Video validation failed for ${file.name}:`, validation.error);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const pythonNode = pythonNodes.find(node => node.name === 'CaptionedVideoSource');
          const newNode = createPythonNode({
            position,
            pythonNode
          });
          newNode.data.widgetValues['video_upload'] = e.target.result;
          addNodes(newNode);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Handle image files
      if (file.type.startsWith('image/')) {
        const validation = validateImage(file);
        if (!validation.isValid) {
          console.warn(`Image validation failed for ${file.name}:`, validation.error);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const pythonNode = pythonNodes.find(node => node.name === 'CaptionedImageSource');
          const newNode = createPythonNode({
            position,
            pythonNode
          });
          newNode.data.widgetValues['image_upload'] = e.target.result;
          addNodes(newNode);
        };
        reader.readAsDataURL(file);
      }
    });
  }, [addNodes, screenToFlowPosition, pythonNodes]);

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
      <Notifications />
    </div>
  );
};

export default FlowContent;
