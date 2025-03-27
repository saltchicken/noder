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
    this.title = node.name;

    const widgetComments = node.widget_comments || {};
    // console.log(node.name);
    // console.log(widgetComments);


    for (let text_var of node.text_vars) {
      const widgetProps = widgetComments[text_var] || {};
      console.log(widgetProps);
      this.addWidget("text", text_var, "Default", function (value) {
        console.log("Text changed to : ", value);
      }, widgetProps);
    }

    for (let number_var of node.number_vars) {
      this.addWidget("number", number_var, 0, function (value) {
        console.log("Number changed to : ", value);
      });
    }

    // this.addWidget("text","name","Default", function (value){
    //     console.log("Text changed to : ", value)
    //   }); 
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
