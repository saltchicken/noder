import { Handle, Position } from '@xyflow/react';
import { getTypeColor } from './utils/handleColors.tsx';


const NodeOutput = ({ output, topPadding, index, spacing }) => (
  <div key={output.name}>
    <Handle  
      type="source" 
      position={Position.Right} 
      style={{ top: `${topPadding + (index * spacing)}px`, background: getTypeColor(output.type), borderColor: getTypeColor(output.type) }} 
      id={output.name}
      data-type={output.type}
    />
    <span style={{
      position: 'absolute',
      right: '20px',
      top: `${topPadding + (index * spacing)}px`,
      transform: 'translateY(-50%)',
      fontSize: '8px',
      pointerEvents: 'none'
    }}>
      {output.name}: {output.type}
    </span>
  </div>
);

export default NodeOutput;
