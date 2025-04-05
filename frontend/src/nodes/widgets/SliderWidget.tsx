import { useState, useEffect } from 'react';

const SliderWidget = ({ widget, onChange }) => {
  const [localValue, setLocalValue] = useState(
    widget.widgetValues?.[widget.name] ?? widget.value ?? widget.min ?? 0
  );

  useEffect(() => {
    setLocalValue(widget.widgetValues?.[widget.name] ?? widget.value ?? widget.min ?? 0);
  }, [widget.widgetValues, widget.name]);

  const handleChange = (evt) => {
    const newValue = evt.target.value;
    setLocalValue(newValue);
    onChange(evt);
  };

  return (
    <div style={{ padding: '0px 0px 10px 0px', position: 'relative' }}>
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
          value={localValue}
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
          {localValue}
        </output>
      </div>
    </div>
  );
};

export default SliderWidget;

