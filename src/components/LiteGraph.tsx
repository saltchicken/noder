import React, { useEffect, useRef, useCallback } from "react";
import {registerCustomNodes} from "../utils/pythonNodes";

function serializeGraph(graph) {
    let data = graph.serialize(); // Get base graph data

    // Manually add widget values to nodes
    data.nodes.forEach(nodeData => {
        let node = graph.getNodeById(nodeData.id);
        if (node && node.widgets) {
            nodeData.widget_values = node.widgets.map(widget => widget.value);
        }
    });

  console.log(data)
    return data;
}

function deserializeGraph(graph, data) {
    graph.configure(data); // Load basic graph structure

    // Restore widget values
    data.nodes.forEach(nodeData => {
        let node = graph.getNodeById(nodeData.id);
        if (node && node.widgets && nodeData.widget_values) {
            node.widgets.forEach((widget, i) => {
                if (nodeData.widget_values[i] !== undefined) {
                    widget.value = nodeData.widget_values[i];
                }
            });
        }
    });
}



const LiteGraphComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef(null);
  const isInitialized = useRef(false); //Note: Only needed for dev testing

  const handleGraphChange = useCallback((graph) => {
    // Send updated graph state to backend
    fetch("http://10.0.0.7:8001/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        graph: serializeGraph(graph) 
      })
    });
  }, []);

  const saveGraph = useCallback(() => {
    if (graphRef.current) {
      const data = serializeGraph(graphRef.current);
      localStorage.setItem("savedGraph", JSON.stringify(data));
      console.log("Graph saved to local storage");
    }
  }, []);

  const loadGraph = useCallback(() => {
    if (graphRef.current) {
      const savedData = localStorage.getItem("savedGraph");
      if (savedData) {
        deserializeGraph(graphRef.current, JSON.parse(savedData));
        console.log("Graph loaded from local storage");
      }
    }
  }, []);

  const saveToFile = useCallback(() => {
    if (graphRef.current) {
      const data = JSON.stringify(serializeGraph(graphRef.current));
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'graph.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, []);

  const loadFromFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && graphRef.current) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            deserializeGraph(graphRef.current, JSON.parse(event.target?.result as string));
            // const jsonData = JSON.parse(event.target?.result as string);
            // graphRef.current.configure(jsonData);
            console.log("Graph loaded from file");
          } catch (error) {
            console.error("Error loading graph:", error);
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  }, []);


  useEffect(() => {
    if (window.LiteGraph && canvasRef.current && !isInitialized.current) {
      console.log("Doing the things");
      LiteGraph.clearRegisteredTypes(); //TODO: Use litegraph core and this isn't needed
      const graph = new window.LiteGraph.LGraph();
      graphRef.current = graph;

      // Register graph events
      // graph.onNodeAdded = () => handleGraphChange(graph);
      // graph.onNodeRemoved = () => handleGraphChange(graph);
      // graph.onConnectionChange = () => handleGraphChange(graph);

      const canvas = new window.LiteGraph.LGraphCanvas(canvasRef.current, graph);
      registerCustomNodes(window.LiteGraph);
      // graph.start();
      canvas.resize();
      isInitialized.current = true; //NOTE: Only needed for dev testing
   }
  }, [handleGraphChange]);

  // Add methods to interact with the graph
const sendGraphData = useCallback(() => {
  if (graphRef.current) {
    fetch("http://10.0.0.7:8001/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        graph: serializeGraph(graphRef.current)
      })
    });
  }
}, []);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
      ></canvas>
      <div className="controls">
        <button onClick={() => sendGraphData()}>
          Send Graph Data
        </button>
        <button onClick={() => saveGraph()}>
          Save to Storage
        </button>
        <button onClick={() => loadGraph()}>
          Load from Storage
        </button>
        <button onClick={() => saveToFile()}>
          Save to File
        </button>
        <button onClick={() => loadFromFile()}>
          Load from File
        </button>
      </div>
      </div>
  );
};

export default LiteGraphComponent;



