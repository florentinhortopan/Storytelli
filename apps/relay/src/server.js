const http = require("http");
const WebSocket = require("ws");

const port = process.env.PORT || 8080;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!allowedOrigins.length) return true;
  return allowedOrigins.includes(origin);
};

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", (socket, req) => {
  const origin = req.headers.origin || "";
  if (!isOriginAllowed(origin)) {
    socket.close(1008, "Origin not allowed");
    return;
  }

  socket.isAlive = true;
  clients.add(socket);

  socket.on("pong", () => {
    socket.isAlive = true;
  });

  socket.on("message", (data) => {
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  });

  socket.on("close", () => {
    clients.delete(socket);
  });
});

const heartbeat = setInterval(() => {
  for (const client of clients) {
    if (!client.isAlive) {
      client.terminate();
      clients.delete(client);
      continue;
    }
    client.isAlive = false;
    client.ping();
  }
}, 30000);

server.listen(port, () => {
  console.log(`Relay listening on :${port}`);
});

const shutdown = () => {
  clearInterval(heartbeat);
  wss.close(() => {
    server.close(() => process.exit(0));
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
