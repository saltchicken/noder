import { useState, useEffect } from 'react';
import App from '../App';

const LiteGraphLoader = () => {
  // const [isLiteGraphLoaded, setIsLiteGraphLoaded] = useState(false);
  //
  // useEffect(() => {
  //   const checkLiteGraph = () => {
  //     if (window.LiteGraph) {
  //       setIsLiteGraphLoaded(true);
  //       console.log("LiteGraph loaded!")
  //     } else {
  //       console.log("LiteGraph not loaded yet...")
  //       setTimeout(checkLiteGraph, 100);
  //     }
  //   };
  //
  //   checkLiteGraph();
  // }, []);
  //
  // if (!isLiteGraphLoaded) {
  //   return <div>Loading LiteGraph...</div>;
  // }

  return <App />;
};

export default LiteGraphLoader;

