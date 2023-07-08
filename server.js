const express = require('express');
const app = express();
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Store connections to multiple clients
const clients = new Set();

wss.on('connection', ws => {
  // Add the newly connected client to the set
  clients.add(ws);

  ws.on('message', message => {
    // Forward the message to other clients
    console.log("message : "+message.toString());

    clients.forEach(client => {
      if (client !== ws) {
        client.send(message.toString());
      }
    });
  });

  ws.on('close', () => {
    // Remove the disconnected client from the set
    clients.delete(ws);
  });

  ws.on('open', () => {
    console.log("Websocket openned");
  })
});
// server.listen(port, () => {
//     console.log(`Socket.IO server listening on port ${port}`);
//   });