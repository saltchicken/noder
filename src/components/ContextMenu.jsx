import React, { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { getMaxNodeId } from '../utils/flowUtils';

export default function ContextMenu({
  id,
  top,
  left,
  right,
  bottom,
  type = 'default',
  pythonNodes,
  ...props
}) {
  const { getNode, setNodes, addNodes, setEdges, screenToFlowPosition, getNodes } = useReactFlow();
  const [showSubmenu, setShowSubmenu] = useState(false);



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
  }, [id, getNode, addNodes, getNodes]);

  const deleteNode = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id));
  }, [id, setNodes, setEdges]);

  const addNewNode = useCallback((nodeType) => {
    const pythonNode = pythonNodes.find(node => node.name === nodeType);
    const newNode = {
      id: `${getMaxNodeId(getNodes()) + 1}`,
      type: 'pythonNode',
      position: screenToFlowPosition({ x: left, y: top }),
      style: { minWidth: '300px', minHeight: `${100 + (pythonNode.widgets.length * 40)}px`}, //TODO: Change this dynamic thing to account for widgets of different heights
      data: { 
        label: nodeType,
        inputs: pythonNode.inputs,
        outputs: pythonNode.outputs,
        widgets: pythonNode.widgets
      },
    };
    addNodes(newNode);
  }, [left, top, addNodes, getNodes, pythonNodes]);

  const renderSubmenu = () => {
    if (!showSubmenu) return null;

    return (
      <div className="context-submenu">
        {pythonNodes.map(node => (
          <div 
            key={node.name}
            className="context-menu-item" 
            onClick={() => addNewNode(node.name)}
          >
            {node.name}
          </div>
        ))}
      </div>
    );
  };

  const renderMenuContent = () => {
    switch (type) {
      case 'node':
        return (
          <>
            <p style={{ margin: '0.5em' }}>
              <small>node: {id}</small>
            </p>
            <div className="context-menu-item" onClick={duplicateNode}>duplicate</div>
            <div className="context-menu-item" onClick={deleteNode}>delete</div>
          </>
        );
      case 'pane':
        return (
          <>
            <div
              className="context-menu-item"
              onMouseEnter={() => setShowSubmenu(true)}
              onMouseLeave={() => setShowSubmenu(false)}
            >
              add node ►
              {renderSubmenu()}
            </div>
          </>
        );
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
