import { serve } from "bun";
import { join } from "path";

const distPath = "./dist";

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

