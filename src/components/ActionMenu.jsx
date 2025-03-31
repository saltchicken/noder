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

  const onProcess = useCallback(() => {
    const flow = {
      nodes: nodes,
      edges: edges,
    };
    const json = JSON.stringify(flow, (key, value) =>
      key === "position" || key === "measured" ? undefined : value, 2);
    console.log(json);
  }, [nodes, edges]);

  return (
    <div style={{ position: 'absolute', right: 10, top: 10, zIndex: 4 }}>
      <button onClick={onSave}>save</button>
      <button onClick={onRestore}>restore</button>
      <button onClick={onProcess}>process</button>
    </div>
  );
};

export default ActionMenu;

