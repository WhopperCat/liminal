const express = require('express');
const http    = require('http');
const path    = require('path');
const { server: wisp } = require('@mercuryworkshop/wisp-js/server');

const app = express();

function allowSW(req, res, next) {
  res.setHeader('Service-Worker-Allowed', '/');
  next();
}

const CACHE_LONG = { maxAge: '7d', immutable: true };

// Scramjet dist
app.use('/scramjet/', allowSW, express.static(
  path.join(__dirname, 'node_modules/@mercuryworkshop/scramjet/dist'),
  CACHE_LONG
));

// bare-mux
app.use('/baremux/', express.static(
  path.join(__dirname, 'node_modules/@mercuryworkshop/bare-mux/dist'),
  CACHE_LONG
));

// epoxy transport
app.get('/epoxy/index.mjs', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  res.sendFile(path.join(
    __dirname, 'node_modules/@mercuryworkshop/epoxy-transport/dist/index.mjs'
  ));
});

// libcurl transport
app.get('/libcurl/index.mjs', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  res.sendFile(path.join(
    __dirname, 'node_modules/@mercuryworkshop/libcurl-transport/dist/index.mjs'
  ));
});

// service worker
app.get('/sw.js', allowSW, (req, res) =>
  res.sendFile(path.join(__dirname, 'public/sw.js'))
);

// static assets
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);

server.on('upgrade', (req, socket, head) => {
  wisp.routeRequest(req, socket, head);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () =>
  console.log(`\nAxis  →  http://localhost:${PORT}\n`)
);
