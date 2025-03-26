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

  // useEffect(() => {
  //   setupSSE();
  //   return () => {
  //     if (eventSourceRef.current) {
  //       eventSourceRef.current.close();
  //     }
  //   };
  // }, []);

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

  const saveGraph = useCallback(() => {
    if (graphRef.current) {
      const data = graphRef.current.serialize();
      localStorage.setItem("savedGraph", JSON.stringify(data));
      console.log("Graph saved to local storage");
    }
  }, []);

  const loadGraph = useCallback(() => {
    if (graphRef.current) {
      const savedData = localStorage.getItem("savedGraph");
      if (savedData) {
        graphRef.current.configure(JSON.parse(savedData));
        console.log("Graph loaded from local storage");
      }
    }
  }, []);

  const saveToFile = useCallback(() => {
    if (graphRef.current) {
      const data = JSON.stringify(graphRef.current.serialize());
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
            const jsonData = JSON.parse(event.target?.result as string);
            graphRef.current.configure(jsonData);
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
  setupSSE();


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



