import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port:3000 });

wss.on("connection", ws => {
  console.log("DCS connected");

  ws.on("message", msg => {
    console.log("UFC →", msg.toString());
  });

  ws.send("Hello UFC");
});
