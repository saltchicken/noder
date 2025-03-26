export async function registerCustomNodes(LiteGraph: any) {
  // Get custom nodes from server
  const response = await fetch('http://10.0.0.7:8001/custom_nodes', {
    method: "POST"
  });

  const result = await response.json();
  if (result['status'] === 'success') {
    for (let node of result['nodes']) {
      registerNode(LiteGraph, node);
    }
  }
}

function registerNode(LiteGraph: any, node: any) {
  function customNode() {
    this.title = node.title || "Node";
   this.addWidget("text","name","Default", function (value){
      console.log("Text changed to : ", value)
    }); 
    // Add inputs
    if (node.inputs) {
      node.inputs.forEach((input: any, i: number) => {
        this.addInput(input.name, input.type);
      });
    }

    // Add outputs
    if (node.outputs) {
      node.outputs.forEach((output: any, i: number) => {
        this.addOutput(output.name, output.type);
      });
    }
  }
  console.log("Registering node:", node['name'])

  LiteGraph.registerNodeType(node['name'], customNode);
}
