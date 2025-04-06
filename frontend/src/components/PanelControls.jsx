import React, { useCallback } from 'react';
import { Panel } from '@xyflow/react';

const PanelControls = ({ nodes, edges, setNodes, setEdges, sendToWebSocket, isConnected }) => {
  const onSave = useCallback(() => {
    const flow = {
      nodes: nodes,
      edges: edges,
    };
    const json = JSON.stringify(flow);
    localStorage.setItem('flow', json);
  }, [nodes, edges]);

  const onRestore = useCallback(() => {
    const flowString = localStorage.getItem('flow');
    if (!flowString) return;

    const flow = JSON.parse(flowString);
    if (flow) {
      const nodesWithRestoredWidgets = flow.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          widgetValues: node.data.widgetValues || {}
        }
      }));

      setNodes(nodesWithRestoredWidgets);
      setEdges(flow.edges);
    }
  }, [setNodes, setEdges]);

  const onProcess = useCallback(() => {
    const flow = {
      nodes: nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          widgetValues: node.data.widgetValues || {},
        }
      })),
      edges: edges,
    };
    const json = JSON.stringify(flow, (key, value) =>
      key === "position" || key === "measured" ? undefined : value, 2);
    console.log('Widget Values:', nodes.map(node => node.data.widgetValues));
    sendToWebSocket(json);
  }, [nodes, edges, sendToWebSocket]);

  const onExportFlow = useCallback(async () => {
    const flow = {
      nodes: nodes,
      edges: edges,
    };

    try {
      const response = await fetch(`http://${window.location.hostname}:3000/export_flow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flow),
      });

      const data = await response.json();

      if (data.status === 'success') {
        const downloadUrl = `http://${window.location.hostname}:3000/saved_flows/${data.filename}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error('Export failed:', data.message);
      }
    } catch (error) {
      console.error('Error exporting flow:', error);
    }
  }, [nodes, edges]);

  const onImportFlow = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`http://${window.location.hostname}:3000/import_flow`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.status === 'success') {
        const nodesWithRestoredWidgets = data.flow.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            widgetValues: node.data.widgetValues || {}
          }
        }));

        setNodes(nodesWithRestoredWidgets);
        setEdges(data.flow.edges);
      } else {
        console.error('Import failed:', data.message);
      }
    } catch (error) {
      console.error('Error importing flow:', error);
    }

    event.target.value = '';
  }, [setNodes, setEdges]);

  return (
    <Panel position="top-left">
      <button onClick={onRestore}>Restore</button>
      <button onClick={onSave}>Save</button>
      <button onClick={onProcess}>Process</button>
      <button onClick={onExportFlow}>Export Flow</button>
      <button onClick={() => document.getElementById('file-input').click()}>
        Import Flow
      </button>
      <input
        id="file-input"
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={onImportFlow}
      />
      <div style={{ color: 'white' }}>
        Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </Panel>
  );
};

export default PanelControls;

