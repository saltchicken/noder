const DropdownWidget = ({ widget, onChange }) => (
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
    <select
      id={widget.name}
      name={widget.name}
      value = {widget.value || widget.options[0]}
      onChange={onChange}
      className="nodrag"
      style={{
        width: 'calc(100% - 22px)',
        padding: '8px',
        border: '1px solid #333',
        borderRadius: '5px',
        fontSize: '12px',
        backgroundColor: '#1e1e1e',
        color: '#fff',
        paddingLeft: '7px',
        paddingTop: '12px'
      }}
    >
      {widget.options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

export default DropdownWidget;

