import dns from 'node:dns';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// Prioritize IPv4 DNS lookups in Node to prevent ETIMEDOUT on dual-stack hosts and Windows
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore if not supported
}

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

            const isBodyAllowed = req.method !== 'GET' && req.method !== 'HEAD';
            const forwardHeaders: Record<string, string> = {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 EgSA/2.0',
              'Accept': (req.headers['accept'] as string) || 'application/json, text/plain, */*',
            };

            if (isBodyAllowed && req.headers['content-type']) {
              forwardHeaders['Content-Type'] = req.headers['content-type'] as string;
            } else if (isBodyAllowed) {
              forwardHeaders['Content-Type'] = 'application/json';
            }

            for (const [key, val] of Object.entries(req.headers)) {
              const lowerKey = key.toLowerCase();
              if (
                lowerKey === 'authorization' ||
                lowerKey === 'x-api-key' ||
                lowerKey === 'api-key' ||
                lowerKey === 'http-referer' ||
                lowerKey === 'x-title' ||
                lowerKey === 'anthropic-version' ||
                lowerKey.startsWith('x-')
              ) {
                if (lowerKey === 'x-target-url') continue;
                if (typeof val === 'string') {
                  forwardHeaders[key] = val;
                }
              }
            }

            const fetchOptions: RequestInit = {
              method: req.method || (isBodyAllowed ? 'POST' : 'GET'),
              headers: forwardHeaders,
              body: isBodyAllowed && rawBody.length > 0 ? rawBody : undefined,
            };

            let targetRes: Response;
            try {
              targetRes = await fetch(targetUrl, fetchOptions);
            } catch (fetchErr: any) {
              // On Windows, localhost may resolve to IPv6 ::1 where local service is listening on IPv4 127.0.0.1
              if (targetUrl.includes('localhost')) {
                const altUrl = targetUrl.replace('localhost', '127.0.0.1');
                targetRes = await fetch(altUrl, fetchOptions);
              } else {
                throw fetchErr;
              }
            }

            res.statusCode = targetRes.status;
            const contentType = targetRes.headers.get('content-type') || 'application/json';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

            if (contentType.includes('text/event-stream')) {
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');
              if (targetRes.body) {
                const reader = targetRes.body.getReader();
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  res.write(Buffer.from(value));
                }
              }
              res.end();
            } else {
              // For standard REST responses, arrayBuffer ensures gzip/deflate is decompressed
              const arrayBuffer = await targetRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              res.setHeader('Content-Length', String(buffer.length));
              res.end(buffer);
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

