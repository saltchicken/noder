import { uuidv4 } from './uuid';

export function createPythonNode({
  position,
  nodeType,
  pythonNode = null,
  customData = {}
}) {
  const baseNode = {
    id: uuidv4(),
    type: 'pythonNode',
    position,
    style: { minWidth: '300px' }
  };

  if (pythonNode) {
    // For context menu node creation
    return {
      ...baseNode,
      style: {
        ...baseNode.style,
        minHeight: `${Math.max(pythonNode.inputs.length, pythonNode.outputs.length) * 15 + 15 + (pythonNode.widgets.length * 50)}px`
      },
      data: {
        label: nodeType,
        inputs: pythonNode.inputs,
        outputs: pythonNode.outputs,
        widgets: pythonNode.widgets,
        widgetValues: {}
      }
    };
  } else {
    // For image drop or other custom node types
    return {
      ...baseNode,
      style: {
        ...baseNode.style,
        minHeight: '250px'
      },
      data: {
        label: nodeType,
        inputs: [],
        outputs: [
          {
            name: 'image_upload',
            type: '<class \'str\'>'
          }
        ],
        widgets: [
          {
            name: 'image_upload',
            type: 'image_file_upload',
            value: customData.imageData || ''
          }
        ],
        widgetValues: {
          image_upload: customData.imageData || ''
        }
      }
    };
  }
}

