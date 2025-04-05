import { Handle, Position } from '@xyflow/react';


const NodeOutput = ({ output, topPadding, index, spacing }) => (
  <div key={output.name}>
    <Handle  
      type="source" 
      position={Position.Right} 
      style={{ top: `${topPadding + (index * spacing)}px` }} 
      id={output.name}
    />
    <span style={{
      position: 'absolute',
      right: '20px',
      top: `${topPadding + (index * spacing)}px`,
      transform: 'translateY(-50%)',
      fontSize: '8px',
      pointerEvents: 'none'
    }}>
      {output.name}
    </span>
  </div>
);

export default NodeOutput;
