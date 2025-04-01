import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Panel,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';


import ContextMenu from './components/ContextMenu';

import TextUpdaterNode from './nodes/TextUpdaterNode.tsx';

const nodeTypes = {
  textUpdater: TextUpdaterNode
};


const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState(null);
  const ref = useRef(null);

  const onConnect = useCallback(
    (params) => setEdges((els) => addEdge(params, els)),
    [setEdges],
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
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onMove={onPaneMove}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
      >
        <Background />
        {menu && <ContextMenu onClick={onPaneClick} {...menu} />}

        <Controls />
        <Panel position="top-left">
          <button onClick={onRestore}>Restore</button>
          <button onClick={onSave}>Save</button>
          <button onClick={onProcess}>Process</button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default Flow;
