export function registerShowText(LiteGraph: any) {
  function customNode() {
    this.title = "ShowText";
    
    // Add input slot
    this.addInput("input", "string");
    
    // Add text area widget
    this.addWidget("text", "output", "", (value) => {
      console.log("Text changed to : ", value);
    }, { 
      multiline: true,
      height: 100,
      width: 200
    });

    // Handle incoming data
    this.onExecute = function() {
      console.log("Executing")
      const inputData = this.getInputData(0); // Get data from first input
      if (inputData !== undefined) {
        // Update the widget with input data
        this.widgets[0].value = inputData;
        this.setDirtyCanvas(true, false);
      }
    };
  }
  LiteGraph.registerNodeType("ShowText", customNode);
}

