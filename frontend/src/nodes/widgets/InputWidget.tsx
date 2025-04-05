const InputWidget = ({ widget, onChange }) => (
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
    <input 
      id={widget.name}
      name={widget.name}
      value={widget.widgetValues?.[widget.name] ?? widget.value ?? ''}
      onChange={onChange} 
      className="nodrag" 
      style={{
        width: 'calc(100% - 40px)',
        padding: '8px',
        border: '1px solid #333',
        borderRadius: '5px',
        fontSize: '12px',
        backgroundColor: '#1e1e1e',
        color: '#fff',
        paddingLeft: '7px',
        paddingTop: '12px'
      }}
    />
  </div>
);

export default InputWidget;
