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

    for (let text_var of node.text_vars) {
      const widgetProps = widgetComments[text_var] || {};
        this.addWidget("text", text_var, "Default", function (value) {
          console.log("Text changed to : ", value);
        }, widgetProps);
      }

    for (let number_var of node.number_vars) {
      this.addWidget("number", number_var, 0, function (value) {
        console.log("Number changed to : ", value);
      });
    }

    for (let select_var of node.select_vars) {
      const widgetProps = widgetComments[select_var] || {};
      this.addWidget("combo", select_var, widgetProps.values[0], function (value) {
        console.log("Select changed to : ", value);
      }, widgetProps);
    }

    for (let display_text_var of node.display_text_vars) {
      const widgetProps = widgetComments[display_text_var] || {};
      this.value = "Initial value";
      const node_instance = this;
      this.addWidget("display_text", display_text_var, "", function (value) {
        node_instance.value = value;
        node_instance.setDirtyCanvas(true, false);
      });

      this.writeText = function(ctx, text: string) {
        const lineHeight = 20;
        const padding = 30;
        const maxWidth = this.size[0] - (padding * 2);
        
        // Split input text into initial lines (by newline character)
        const inputLines = text.split('\n');
        const wrappedLines: string[] = [];
        
        // For each line, wrap text if it exceeds maxWidth
        inputLines.forEach(inputLine => {
          let words = inputLine.split(' ');
          let currentLine = '';
          
          words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
              wrappedLines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          });
          
          if (currentLine) {
            wrappedLines.push(currentLine);
          }
        });

        // Draw the wrapped lines
        wrappedLines.forEach((line, index) => {
          const y = padding + lineHeight + (index * lineHeight);
          ctx.fillText(line, padding, y);
        });
        
        // Update node height to fit content if needed
        const requiredHeight = (wrappedLines.length * lineHeight) + (padding * 2);
        if (this.size[1] < requiredHeight) {
          this.size[1] = requiredHeight;
        }
      }
      this.onDrawBackground = function(ctx, graphcanvas) {
        if(this.flags.collapsed){
          return;
        }
        ctx.save();
        ctx.fillColor = "black";
        ctx.fillRect(30,30,this.size[0] - 60,this.size[1] - 60);
        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        this.writeText(ctx, this.value);
        ctx.restore();
      }
    }

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

    // this.serialize_widgets = true;



  }
  console.log("Registering node:", node['name'])

  LiteGraph.registerNodeType(node['name'], customNode);
}
