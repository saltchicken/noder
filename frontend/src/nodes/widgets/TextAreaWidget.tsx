import { useEffect, useRef } from 'react';

const TextAreaWidget = ({ widget, onChange }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleWheel = (e) => {
      e.stopPropagation();
      if (document.activeElement === textarea) {
        e.preventDefault();
        textarea.scrollTop += e.deltaY;
      }
    };

    textarea.addEventListener('wheel', handleWheel, { passive: false });
    return () => textarea.removeEventListener('wheel', handleWheel);
  }, []);

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
      <textarea 
        ref={textareaRef}
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
          fontSize: '8px',
          backgroundColor: '#1e1e1e',
          color: '#fff',
          paddingLeft: '7px',
          paddingTop: '12px',
          minHeight: '100px',
          resize: 'vertical',
          scrollbarWidth: 'none',  // Firefox
          msOverflowStyle: 'none',  // IE and Edge
          '&::-webkit-scrollbar': {  // Chrome, Safari, Opera
            display: 'none'
          }
        }}
      />
    </div>
  );
};

export default TextAreaWidget;
