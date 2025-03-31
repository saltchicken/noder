import React, { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { getMaxNodeId } from '../utils/flowUtils';

export default function ContextMenu({
  id,
  top,
  left,
  right,
  bottom,
  type = 'default',
  ...props
}) {
  const { getNode, setNodes, addNodes, setEdges, screenToFlowPosition, getNodes } = useReactFlow();
  const duplicateNode = useCallback(() => {
    const node = getNode(id);
    const position = {
      x: node.position.x + 50,
      y: node.position.y + 50,
    };

    addNodes({
      ...node,
      selected: false,
      dragging: false,
      id: `${getMaxNodeId(getNodes()) + 1}`,
      position,
    });
  }, [id, getNode, addNodes]);

  const deleteNode = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id));
  }, [id, setNodes, setEdges]);

  const addNewNode = useCallback(() => {
    const newNode = {
      id: `${getMaxNodeId(getNodes()) + 1}`, //TODO: Improve ID generation
      position: screenToFlowPosition({ x: left, y: top }),
      data: { label: 'New Node' },
    };
    addNodes(newNode);
  }, [left, top, addNodes]);

  const renderMenuContent = () => {
    switch (type) {
      case 'node':
        return (
          <>
            <p style={{ margin: '0.5em' }}>
              <small>node: {id}</small>
            </p>
            <button onClick={duplicateNode}>duplicate</button>
            <button onClick={deleteNode}>delete</button>
          </>
        );
      case 'pane':
        return (
          <button onClick={addNewNode}>add node</button>
        );
      // Add more cases as needed
      // case 'edge':
      //   return (...);
      default:
        return null;
    }
  };

  return (
    <div
      style={{ top, left, right, bottom }}
      className="context-menu"
      {...props}
    >
      {renderMenuContent()}
    </div>
  );
}
