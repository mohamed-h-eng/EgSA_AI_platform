import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function aiProxyPlugin(): Plugin {
  return {
    name: 'ai-proxy-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = new URL(req.url || '', 'http://localhost');
        if (reqUrl.pathname === '/api/ai-proxy') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          const targetUrl =
            (req.headers['x-target-url'] as string) ||
            reqUrl.searchParams.get('target');

          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: { message: 'Missing x-target-url or ?target query parameter' } }));
            return;
          }

          try {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const rawBody = Buffer.concat(chunks);

            const forwardHeaders: Record<string, string> = {
              'Content-Type': (req.headers['content-type'] as string) || 'application/json',
            };
            if (req.headers['authorization']) {
              forwardHeaders['Authorization'] = req.headers['authorization'] as string;
            }
            if (req.headers['x-api-key']) {
              forwardHeaders['x-api-key'] = req.headers['x-api-key'] as string;
            }
            if (req.headers['http-referer']) {
              forwardHeaders['HTTP-Referer'] = req.headers['http-referer'] as string;
            }
            if (req.headers['x-title']) {
              forwardHeaders['X-Title'] = req.headers['x-title'] as string;
            }

            const isBodyAllowed = req.method !== 'GET' && req.method !== 'HEAD';
            const targetRes = await fetch(targetUrl, {
              method: req.method || 'POST',
              headers: forwardHeaders,
              body: isBodyAllowed && rawBody.length > 0 ? rawBody : undefined,
            });

            res.statusCode = targetRes.status;
            const contentType = targetRes.headers.get('content-type') || 'application/json';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

            if (contentType.includes('text/event-stream')) {
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');
            }

            if (targetRes.body) {
              const reader = targetRes.body.getReader();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(Buffer.from(value));
              }
              res.end();
            } else {
              res.end();
            }
          } catch (err: any) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: {
                  message: `Dev Proxy Connection Error: ${err.message || 'Failed to connect to target endpoint'}`,
                },
              })
            );
          }
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), aiProxyPlugin()],
})

