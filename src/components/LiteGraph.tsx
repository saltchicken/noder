import React, { useEffect, useRef, useCallback } from "react";
import {registerCustomNodes} from "../utils/pythonNodes";

const LiteGraphComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef(null);
  const isInitialized = useRef(false);

  const handleGraphChange = useCallback((graph) => {
    // Send updated graph state to backend
    fetch("http://10.0.0.7:8001/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        graph: graph.serialize() 
      })
    });
  }, []);

  useEffect(() => {
    if (window.LiteGraph && canvasRef.current && !isInitialized.current) {
      console.log("Doing the things");
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
      isInitialized.current = true;

   }
  }, [handleGraphChange]);

  // Add methods to interact with the graph
const sendGraphData = useCallback(() => {
  if (graphRef.current) {
    fetch("http://10.0.0.7:8001/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        graph: graphRef.current.serialize() 
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
      </div>
      </div>
  );
};

export default LiteGraphComponent;



