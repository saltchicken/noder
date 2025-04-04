import { serve } from "bun";
import { join } from "path";
import { spawn } from "child_process";

// Start Python FastAPI server
const pythonServer = spawn("python", ["-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"], {
  cwd: join(process.cwd(), "api")  // Set working directory to the api folder
});

pythonServer.stdout.on('data', (data) => {
  console.log(`${data}`);
});

pythonServer.stderr.on('data', (data) => {
  console.log(`${data}`);
});

pythonServer.on('close', (code) => {
  console.log(`Python server exited with code ${code}`);
});

const distPath = "./dist";

// Start Bun server
serve({
  port: 3000,
  fetch(req) {
    let path = new URL(req.url).pathname;
    path = path === "/" ? "/index.html" : path;
    
    const filePath = join(distPath, path);
    const file = Bun.file(filePath);
    return new Response(file);
  },
});

// Handle cleanup on process exit
process.on('SIGINT', () => {
  pythonServer.kill();
  process.exit();
});

