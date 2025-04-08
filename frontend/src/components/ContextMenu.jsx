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
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [activeClassification, setActiveClassification] = useState(null);

  const nodesByClassification = React.useMemo(() => {
    return pythonNodes.reduce((acc, node) => {
      const classification = node.classification || 'Other';
      if (!acc[classification]) {
        acc[classification] = [];
      }
      acc[classification].push(node);
      return acc;
    }, {});
  }, [pythonNodes]);

  const duplicateNode = useCallback(() => {
    const node = getNode(id);
    const position = {
      x: node.position.x + 50,
      y: node.position.y + 50,
    };

    const pythonNode = pythonNodes.find(pNode => pNode.name === node.data.label);
    const newNode = createPythonNode({
      position,
      nodeType: node.data.label,
      pythonNode,
      customData: {
        widgetValues: node.data.widgetValues // Pass the entire widgetValues object
      }
    });

    addNodes(newNode);
  }, [id, getNode, addNodes, pythonNodes]);

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

  const renderClassificationSubmenu = () => {
    if (!activeSubmenu) return null;

    return (
      <div
        className="context-submenu classification-menu"
        onMouseEnter={() => setActiveSubmenu('add')}
        onMouseLeave={() => {
          if (!activeClassification) {
            setActiveSubmenu(null);
          }
        }}
      >
        {Object.keys(nodesByClassification).map(classification => (
          <div
            key={classification}
            className="context-menu-item"
            onMouseEnter={() => setActiveClassification(classification)}
            onMouseLeave={() => setActiveClassification(null)}
          >
            {classification} ►
            {activeClassification === classification && (
              <div className="context-submenu nodes-menu">
                {nodesByClassification[classification].map(node => (
                  <div
                    key={node.name}
                    className="context-menu-item"
                    onClick={() => addNewNode(node.name)}
                  >
                    {node.name}
                  </div>
                ))}
              </div>
            )}
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
              onMouseEnter={() => setActiveSubmenu('add')}
              onMouseLeave={() => {
                if (!activeClassification) {
                  setActiveSubmenu(null);
                }
              }}
            >
              add node ►
              {renderClassificationSubmenu()}
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

