import './App.css'
import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import LiteGraphComponent from "./components/LiteGraph.tsx"

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://10.0.0.7:8001/data")
    .then((res) => res.json())
    .then((data) => {
      setMessage(data.message);
    });
  }, []);

  const sendData = async () => {
    const response = await fetch("http://10.0.0.7:8001/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: "Hello from React!" }),
    });
    const data = await response.json();
    console.log(data.response);
  }

  return (
    <div>
      <div style={{width: "100%", height: "80vh"}}>
    <LiteGraphComponent />
    </div>
      <h1>{message}</h1>
      <button onClick={sendData}>Send Data</button>
    </div>
  );
}

export default App
