import React, { useEffect, useRef, useCallback } from "react";

const LiteGraphComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef(null);

  const handleGraphChange = useCallback((graph) => {
    // Send updated graph state to backend
    fetch("http://10.0.0.7:8000/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        graph: graph.serialize() 
      })
    });
  }, []);

  useEffect(() => {
    if (window.LiteGraph && canvasRef.current) {
      const graph = new window.LiteGraph.LGraph();
      graphRef.current = graph;

      // Register graph events
      // graph.onNodeAdded = () => handleGraphChange(graph);
      // graph.onNodeRemoved = () => handleGraphChange(graph);
      // graph.onConnectionChange = () => handleGraphChange(graph);
      const canvas = new window.LiteGraph.LGraphCanvas(canvasRef.current, graph);

      
      // Add nodes and setup graph as needed
      const node = new window.LiteGraph.LGraphNode();
      node.addInput("input", "number");
      node.addOutput("output", "number");
      graph.add(node);
      
      // graph.start();
      canvas.resize();
   }
  }, [handleGraphChange]);

  // Add methods to interact with the graph
  const addNewNode = useCallback((type: string, pos: [number, number]) => {
    if (graphRef.current) {
      const node = LiteGraph.createNode(type);
      node.pos = pos;
      graphRef.current.add(node);
    }
  }, []);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
      ></canvas>
    </div>
  );
};

export default LiteGraphComponent;



