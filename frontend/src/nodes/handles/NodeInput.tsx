import React from 'react';
import { Handle, Position, useNodeConnections } from '@xyflow/react';
import { getTypeColor } from './utils/handleColors.tsx';

const NodeInput = ({ input, spacing }) => {
  const connections = useNodeConnections({
    handleType: 'target',
    handleId: input.name
  });

  return (
    <div style={{
      position: 'relative',
      height: `${spacing}px`,
      marginBottom: '5px'
    }}>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          position: 'absolute',
          left: '-15px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: getTypeColor(input.type),
          borderColor: getTypeColor(input.type),
          borderRadius: input.accepts_multiple ? '0' : '50%',  // Rectangle if multiple, circle if not
          // width: input.accepts_multiple ? '12px' : '10px',     // Slightly wider for rectangle
          // height: input.accepts_multiple ? '8px' : '10px',     // Slightly shorter for rectangle

        }}
        id={input.name}
        data-type={input.type}
        isConnectable={input.accepts_multiple || connections.length < 1}
      />
      <span style={{
        position: 'absolute',
        left: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '6px',
        whiteSpace: 'nowrap'
      }}>
        {input.name}: {input.type} {input.accepts_multiple ? '(multiple)' : ''}
      </span>
    </div>
  );
};

export default NodeInput;

