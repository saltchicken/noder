import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';

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
        <div key={inputId}>
          <Handle 
            type="target" 
            position={Position.Left} 
            style={{ 
              top: inputs.length === 1 
                ? '50%' 
                : `${padding + (index * ((100 - (padding * 2)) / (inputs.length - 1)))}%` 
            }} 
            id={inputId}
          />
          <span style={{
            position: 'absolute',
            left: '10px',
            top: inputs.length === 1 
              ? '50%' 
              : `${padding + (index * ((100 - (padding * 2)) / (inputs.length - 1)))}%`,
            transform: 'translateY(-50%)',
            fontSize: '8px',
            pointerEvents: 'none'
          }}>
            {inputId}
          </span>
        </div>
      ))}
      <div>
        <label htmlFor="text">{data.label}</label>
        <input id="text" name="text" onChange={onChange} className="nodrag" />
      </div>
      {outputs.map((outputId, index) => (
        <div key={outputId}>
          <Handle 
            type="source" 
            position={Position.Right} 
            style={{ 
              top: outputs.length === 1 
                ? '50%' 
                : `${padding + (index * ((100 - (padding * 2)) / (outputs.length - 1)))}%` 
            }} 
            id={outputId}
          />
          <span style={{
            position: 'absolute',
            right: '10px',
            top: outputs.length === 1 
              ? '50%' 
              : `${padding + (index * ((100 - (padding * 2)) / (outputs.length - 1)))}%`,
            transform: 'translateY(-50%)',
            fontSize: '8px',
            pointerEvents: 'none'
          }}>
            {outputId}
          </span>
        </div>
      ))}
    </>
  );
}

export default TextUpdaterNode;
