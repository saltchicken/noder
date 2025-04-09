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
    style: { width: 'auto', minWidth: '300px' }
  };

  if (pythonNode) {
    // For context menu node creation
    return {
      ...baseNode,
      style: {
        ...baseNode.style,
      },
      data: {
        label: nodeType,
        inputs: pythonNode.inputs,
        outputs: pythonNode.outputs,
        widgets: pythonNode.widgets,
        widgetValues: customData.widgetValues || {}, // Use provided widget values if available
        isCollapsed: false
      }
    };
  } else {
    // For file drop or other custom node types
    const fileConfig = {
      ImageSource: {
        outputName: 'image_upload',
        widgetType: 'image_file_upload',
        dataKey: 'imageData'
      },
      VideoSource: {
        outputName: 'video_upload',
        widgetType: 'video_file_upload',
        dataKey: 'videoData'
      }
    };

    const config = fileConfig[nodeType];
    if (!config) {
      throw new Error(`Unsupported node type: ${nodeType}`);
    }

    return {
      ...baseNode,
      style: {
        ...baseNode.style,
      },
      data: {
        label: nodeType,
        inputs: [],
        outputs: [
          {
            name: config.outputName,
            type: '<class \'str\'>'
          }
        ],
        widgets: [
          {
            name: config.outputName,
            type: config.widgetType,
            value: customData[config.dataKey] || ''
          }
        ],
        widgetValues: {
          [config.outputName]: customData[config.dataKey] || ''
        }
      }
    };
  }
}

export function duplicateNode(node, pythonNodes, offset = { x: 50, y: 50 }) {
  const pythonNode = pythonNodes.find(pNode => pNode.name === node.data.label);
  const position = {
    x: node.position.x + offset.x,
    y: node.position.y + offset.y,
  };

  return createPythonNode({
    position,
    nodeType: node.data.label,
    pythonNode,
    customData: {
      widgetValues: node.data.widgetValues
    }
  });
}
