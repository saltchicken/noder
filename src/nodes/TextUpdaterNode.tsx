import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';

const handleStyle = { left: 10 };

function TextUpdaterNode({ data }) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  const inputs = Array.isArray(data.inputs) ? data.inputs : ['default'];
  const outputs = Array.isArray(data.outputs) ? data.outputs : ['default'];
  const padding = 20;

  return (
    <>
      {inputs.map((inputId, index) => (
        <Handle 
          key={inputId}
          type="target" 
          position={Position.Left} 
          style={{ 
            top: inputs.length === 1 
              ? '50%' 
              : `${padding + (index * ((100 - (padding * 2)) / (inputs.length - 1)))}%` 
          }} 
          id={inputId}
        />
      ))}
      <div>
        <label htmlFor="text">{data.label}</label>
        <input id="text" name="text" onChange={onChange} className="nodrag" />
      </div>
      {outputs.map((outputId, index) => (
        <Handle 
          key={outputId}
          type="source" 
          position={Position.Right} 
          style={{ 
            top: outputs.length === 1 
              ? '50%' 
              : `${padding + (index * ((100 - (padding * 2)) / (outputs.length - 1)))}%` 
          }} 
          id={outputId}
        />
      ))}
    </>
  );
}
export default TextUpdaterNode;
