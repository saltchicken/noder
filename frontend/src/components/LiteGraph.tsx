import React, { useEffect, useRef, useCallback } from "react";
import {registerCustomNodes} from "../utils/pythonNodes";
// import {registerShowText} from "../utils/javascriptNodes"


function serializeGraph(graph) {
    let data = graph.serialize();
    console.log(data);

    data.nodes.forEach(nodeData => {
        let node = graph.getNodeById(nodeData.id);
        if (node && node.widgets) {
            nodeData.text_widgets = [];
            nodeData.number_widgets = [];
            nodeData.select_widgets = [];
            node.widgets.forEach(widget => {
                if (widget.type === "text") {
                    nodeData.text_widgets.push(widget.value);
                } else if (widget.type === "number") {
                    nodeData.number_widgets.push(widget.value);
                } else if (widget.type === "combo") {
                  nodeData.select_widgets.push(widget.value);
                }
            });
        }
    });
    return data;
}

function deserializeGraph(graph, data) {
    graph.configure(data); // Load basic graph structure

    // Restore widget values
    data.nodes.forEach(nodeData => {
        let node = graph.getNodeById(nodeData.id);
        if (node && node.widgets) {
            node.widgets.forEach((widget, i) => {
                if (widget.type === "text" && nodeData.text_widgets) {
                    widget.value = nodeData.text_widgets.shift();
                } else if (widget.type === "number" && nodeData.number_widgets) {
                    widget.value = nodeData.number_widgets.shift();
                } else if (widget.type === "combo" && nodeData.select_widgets) {
                  widget.value = nodeData.select_widgets.shift();
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
      saveGraph();
    
  }, []);

  const saveGraph = useCallback(() => {
    if (graphRef.current) {
      const data = serializeGraph(graphRef.current);
      localStorage.setItem("savedGraph", JSON.stringify(data));
      console.log("Graph saved to local storage");
    }
  }, []);

  const loadGraph = useCallback(async () => {
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
    const eventSource = new EventSource('http://10.0.0.7:8001/events');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data);
      if (data.type == "update_widget") {
        if (graphRef.current) {
          let node = graphRef.current.getNodeById(data.node_id);
          if (node) {
            for (let widget of node.widgets) { 
              if (widget.name == data.message.name) {
                widget.value = data.message.value;
                node.setDirtyCanvas(true, false);
              }
            }
          }
        }
      }
      // setMessages(prev => ({
      //   ...prev,
      //   [data.node_id]: data.message
      // }));
    };

    return () => {
      eventSource.close();
    };
  }, []);


  useEffect(() => {
    const initGraph = async () => {
        if (window.LiteGraph && canvasRef.current && !isInitialized.current) {
          LiteGraph.clearRegisteredTypes(); //TODO: Use litegraph core and this isn't needed
          const graph = new window.LiteGraph.LGraph();
          graphRef.current = graph;


          const canvas = new window.LiteGraph.LGraphCanvas(canvasRef.current, graph);
          await registerCustomNodes(window.LiteGraph);
          // registerShowText(window.LiteGraph);
          // graph.start();
          canvas.resize();
          isInitialized.current = true; //NOTE: Only needed for dev testing
          await loadGraph();
          // Register graph events
          graph.onNodeAdded = () => handleGraphChange(graph);
          graph.onNodeRemoved = () => handleGraphChange(graph);
          graph.onConnectionChange = () => handleGraphChange(graph);
          // graph.start();
      }
    };
    initGraph();
  }, [handleGraphChange, loadGraph]);

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
      <div className="button-overlay">
        <button onClick={() => sendGraphData()}>
          Send Graph Data
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



