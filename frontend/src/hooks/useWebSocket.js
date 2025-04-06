import { useState, useCallback, useRef, useEffect } from 'react';

export const useWebSocket = (handleNodeMessage) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    const WS_URL = `ws://${window.location.hostname}:3000/ws`;
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setSocket(ws);
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'node_message':
            handleNodeMessage(message.data);
            break;
          case 'success':
            console.log('Success:', message.data);
            break;
          case 'error':
            console.error('Error:', message.data);
            break;
          default:
            console.log('Unknown message type:', message);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
      setSocket(null);

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        connectWebSocket();
      }, 2000);
    };

    return ws;
  }, [handleNodeMessage]);

  useEffect(() => {
    const ws = connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setIsConnected(false);
      setSocket(null);
    };
  }, [connectWebSocket]);

  const sendToWebSocket = useCallback((data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    }
  }, [socket]);

  return {
    isConnected,
    sendToWebSocket
  };
};

