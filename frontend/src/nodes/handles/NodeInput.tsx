import React from 'react';
import { Handle, Position, useNodeConnections } from '@xyflow/react';
import { getTypeColor } from './utils/handleColors.tsx';

const NodeInput = ({ input, spacing }) => {
  const connections = useNodeConnections({
    handleType: 'target',
    handleId: input.name
  });

  const handleSize = 2; // Size of each small circle
  const handleGap = 1; // Gap between circles
  const totalWidth = (handleSize * 2) + handleGap;
  const totalHeight = totalWidth;

  return (
    <div style={{
      position: 'relative',
      height: `${spacing}px`,
      marginBottom: '5px'
    }}>
      {input.accepts_multiple ? (
        <div style={{ position: 'absolute', left: '-15px', top: '50%', transform: 'translateY(-50%)' }}>
          <Handle
            type="target"
            position={Position.Left}
            style={{
              position: 'absolute',
              left: totalWidth / 2 + 5,  // Center the handle horizontally
              top: totalHeight / 2 + 2.5,  // Center the handle vertically
              transform: 'translate(-50%, -50%)',  // Offset by half its size
              width: 1,  // Make it a small point
              height: 1,
              opacity: 0,  // Hide the actual handle
              zIndex: 1,  // Ensure it's above the visual circles
            }}
            id={input.name}
            data-type={input.type}
            isConnectable={input.accepts_multiple || connections.length < 1}
          />
          {/* Visual circles */}
          <div style={{
            width: totalWidth,
            height: totalHeight,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: `${handleGap}px`,
            pointerEvents: 'none',
          }}>
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                style={{
                  width: `${handleSize}px`,
                  height: `${handleSize}px`,
                  background: getTypeColor(input.type),
                  border: `1px solid ${getTypeColor(input.type)}`,
                  borderRadius: '50%',
                }}
              />
            ))}
          </div>
        </div>
      ) : (
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
            borderRadius: '50%',
          }}
          id={input.name}
          data-type={input.type}
          isConnectable={input.accepts_multiple || connections.length < 1}
        />
      )}
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

