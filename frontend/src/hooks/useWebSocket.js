import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';

export const useWebSocket = (handleNodeMessage) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    const WS_URL = `ws://${window.location.hostname}:3000/ws`;
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setSocket(ws);
      setIsConnected(true);
      // Make WebSocket globally available
      window.nodeWebSocket = ws;
      toast.success('Connected to server');
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
            toast.success(message.data);
            break;
          case 'error':
            toast.error(message.data)
            break;
          default:
            const errorMessage = `Unknown message type: ${event.data}`
            toast.error(errorMessage);
            console.log(errorMessage);
        }
      } catch (error) {
        const errorMessage = `Error parsing message: ${error}`
        toast.error(errorMessage);
        console.log(errorMessage);
      }
    };

    ws.onerror = (error) => {
      const errorMessage = `WebSocket error: ${error}`;
      toast.error(errorMessage);
      console.error(errorMessage);
      setIsConnected(false);
    };

    ws.onclose = () => {
      const warningMessage = 'Disconnect from WebSocket';
      toast.warn(warningMessage);
      setIsConnected(false);
      setSocket(null);

      reconnectTimeoutRef.current = setTimeout(() => {
        toast.warn('Attempting to reconnect...');
        connectWebSocket();
      }, 3000);
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

