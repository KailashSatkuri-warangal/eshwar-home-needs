const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 8080;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log(`[Azure Startup] Initializing Next.js on port ${port}...`);

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Health check endpoint for Azure
      if (req.url === '/health' || req.url === '/api/health') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        return res.end('OK');
      }

      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
    .once('error', (err) => {
      console.error('[Server Error]', err);
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`🚀 [Server Ready] Listening on http://${hostname}:${port}`);
    });
}).catch((err) => {
  console.error('[App Prepare Failed]', err);
  process.exit(1);
});
