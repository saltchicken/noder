import React from 'react';
import { useReactFlow } from '@xyflow/react';

interface ButtonWidgetProps {
  widget: {
    name: string;
    value: string;
    function_name?: string;  // Optional function name that's different from button text
  };
  nodeId?: string;
}

const ButtonWidget = ({ widget, nodeId }: ButtonWidgetProps) => {
  const { getNode } = useReactFlow();

  const handleClick = () => {
    const node = getNode(nodeId);
    if (!node) return;

    const ws = (window as any).nodeWebSocket;
    if (!ws) return;

    const message = {
      type: 'run_node',
      data: {
        id: nodeId,
        type: node.type,
        data: node.data,
        function_name: widget.function_name || widget.value  // Use function_name if provided, fall back to value
      }
    };
    ws.send(JSON.stringify(message));
  };

  return (
    <button
      onClick={handleClick}
      style={{
        padding: '8px 16px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        width: '100%',
        margin: '4px 0'
      }}
    >
      {widget.value}
    </button>
  );
};

export default ButtonWidget;

