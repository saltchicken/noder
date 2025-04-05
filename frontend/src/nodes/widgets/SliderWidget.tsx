import { useState } from 'react';

const SliderWidget = ({ widget, onChange }) => {
  const [value, setValue] = useState(widget.value || widget.min || 0);

  const handleChange = (evt) => {
    const newValue = evt.target.value;
    setValue(newValue);
    onChange(evt);
  };

  return (
    <div key={widget.name} style={{ padding: '0px 0px 10px 0px', position: 'relative' }}>
      <span style={{
        position: 'absolute',
        left: '20px',
        top: '5px',
        fontSize: '6px',
        color: '#AAA',
        zIndex: 1,
        pointerEvents: 'none'
      }}>
        {widget.name}
      </span>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        width: 'calc(100% - 40px)',
        padding: '8px',
        gap: '10px'
      }}>
        <input
          type="range"
          id={widget.name}
          name={widget.name}
          min={widget.min || 0}
          max={widget.max || 100}
          step={widget.step || 1}
          value={value}
          onChange={handleChange}
          className="nodrag"
          style={{
            flex: 1,
            accentColor: '#ff0071',
            backgroundColor: '#1e1e1e'
          }}
        />
        <output style={{
          fontSize: '12px',
          color: '#fff',
          minWidth: '40px',
          textAlign: 'right'
        }}>
          {value}
        </output>
      </div>
    </div>
  );
};

export default SliderWidget;

