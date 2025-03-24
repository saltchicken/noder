import React, { useEffect, useRef } from "react";

const LiteGraphComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null); // Use a ref for the canvas

  useEffect(() => {
    if (window.LiteGraph && canvasRef.current) {
      // Initialize the LiteGraph
      const graph = new window.LiteGraph.LGraph();
      const canvas = new window.LiteGraph.LGraphCanvas(canvasRef.current, graph);
      
      // Add nodes and setup graph as needed
      const node = new window.LiteGraph.LGraphNode();
      node.addInput("input", "number");
      node.addOutput("output", "number");
      graph.add(node);
      
      graph.start();
      canvas.resize();
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      // width={1024}
      // height={720}
    ></canvas> // Use <canvas> instead of <div>
  );
};

export default LiteGraphComponent;

