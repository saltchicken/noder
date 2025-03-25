import React, { useEffect, useRef, useCallback } from "react";
import {registerCustomNodes} from "../utils/pythonNodes";

const LiteGraphComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef(null);
  const isInitialized = useRef(false); //Note: Only needed for dev testing
  const eventSourceRef = useRef<EventSource | null>(null);

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
    setupSSE();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const setupSSE = useCallback(() => {
    if (eventSourceRef.current) {
        eventSourceRef.current.close();
    }

    const eventSource = new EventSource('http://10.0.0.7:8001/events'); // Replace with your actual SSE endpoint
    eventSourceRef.current = eventSource;

    eventSource.onmessage = function(event) {
    try {
      const data = JSON.parse(event.data);
      console.log(data['id'])
      if (graphRef.current) {
        const node = graphRef.current.getNodeById(data['id']);
        if (node) {
          node.title = "TEST";
          node.setDirtyCanvas(true, true);
        }
      }

    } catch (error) {
      console.error("Error parsing SSE data:", error);
    }
  };

  eventSource.onerror = function(error) {
    console.error("SSE Error:", error);
    eventSource.close(); // Close the connection on error
  };
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



