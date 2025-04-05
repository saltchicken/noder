const ImageWidget = ({ widget, onChange }) => {
  const imageUrl = widget.widgetValues?.[widget.name] ?? widget.value ?? '';
  
  return (
    <div style={{ 
      padding: '0px 0px 10px 0px', 
      position: 'relative',
      height: '100%'
    }}>
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
      {imageUrl && (
        <img 
          src={imageUrl}
          alt={widget.name}
          style={{
            width: 'calc(100% - 40px)',
            height: 'auto',
            maxHeight: '200px',
            objectFit: 'contain',
            borderRadius: '5px',
            backgroundColor: '#1e1e1e',
            display: 'block',
            margin: '0 auto'
          }}
          onError={(e) => console.error('Image failed to load:', e)}
        />
      )}
    </div>
  );
};

export default ImageWidget;
