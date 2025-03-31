import React from 'react';
import { useCallback } from 'react';

const ActionMenu = ({ nodes, edges, setNodes, setEdges }) => {
  const onSave = useCallback(() => {
    const flow = {
      nodes: nodes,
      edges: edges,
    };
    const json = JSON.stringify(flow);
    localStorage.setItem('flow', json);
  }, [nodes, edges]);

  const onRestore = useCallback(() => {
    const flow = JSON.parse(localStorage.getItem('flow') || '');
    if (flow) {
      setNodes(flow.nodes);
      setEdges(flow.edges);
    }
  }, [setNodes, setEdges]);

  return (
    <div style={{ position: 'absolute', right: 10, top: 10, zIndex: 4 }}>
      <button onClick={onSave}>save</button>
      <button onClick={onRestore}>restore</button>
    </div>
  );
};

export default ActionMenu;

