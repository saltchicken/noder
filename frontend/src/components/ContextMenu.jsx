import React, { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { createPythonNode } from '../utils/nodeCreation';


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
  const { getNode, setNodes, addNodes, setEdges, screenToFlowPosition } = useReactFlow();
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');



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
      id: uuidv4(),
      position,
    });
  }, [id, getNode, addNodes]);

  const deleteNode = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id));
  }, [id, setNodes, setEdges]);

  const addNewNode = useCallback((nodeType) => {
    const pythonNode = pythonNodes.find(node => node.name === nodeType);
    const position = screenToFlowPosition({ x: left, y: top });

    const newNode = createPythonNode({
      position,
      nodeType,
      pythonNode
    });

    addNodes(newNode);
  }, [left, top, addNodes, pythonNodes, screenToFlowPosition]);

  const filteredNodes = pythonNodes.filter(node =>
    node.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderSubmenu = () => {
    if (!showSubmenu) return null;

    return (
      <div className="context-submenu">
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="context-menu-search"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="context-menu-items">
          {filteredNodes.map(node => (
            <div
              key={node.name}
              className="context-menu-item"
              onClick={() => addNewNode(node.name)}
            >
              {node.name}
            </div>
          ))}
        </div>
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
