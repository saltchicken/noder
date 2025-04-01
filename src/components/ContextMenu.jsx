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

  const addNewNode = useCallback((nodeType = 'default') => {
    const newNode = {
      id: `${getMaxNodeId(getNodes()) + 1}`, //TODO: Improve ID generation
      type: nodeType,
      position: screenToFlowPosition({ x: left, y: top }),
      data: { label: 'New Node', inputs: ['input1', 'input2'], outputs: ['output1', 'output2'] },
    };
    addNodes(newNode);
  }, [left, top, addNodes, getNodes]);

  const renderSubmenu = () => {
    if (!showSubmenu) return null;

    return (
      <div className="context-submenu">
        <div className="context-menu-item" onClick={() => addNewNode('default')}>Default Node</div>
        <div className="context-menu-item" onClick={() => addNewNode('textUpdater')}>Text Node</div>
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
