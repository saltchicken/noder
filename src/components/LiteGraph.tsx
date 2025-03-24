import React, { useEffect, useRef, useCallback } from "react";

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
      // registerCustomNodes(window.LiteGraph);
      // graph.start();
      canvas.resize();
      isInitialized.current = true;

   }
  }, [handleGraphChange]);

  // Add methods to interact with the graph
  // const addNewNode = useCallback((type: string, pos: [number, number]) => {
  //   if (graphRef.current) {
  //     const node = LiteGraph.createNode(type);
  //     node.pos = pos;
  //     graphRef.current.add(node);
  //   }
  // }, []);

  return (
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
      ></canvas>
  );
};

export default LiteGraphComponent;



