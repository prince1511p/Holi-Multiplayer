const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });

// Serve client files
app.use(express.static('public'));

let players = {};
let waterballs = [];
let medikits = [];

// Spawn waterballs every 5 sec
setInterval(() => {
  for (let i = 0; i < 5; i++) {
    waterballs.push({ id: Date.now() + Math.random(), x: Math.random()*20-10, z: Math.random()*20-10 });
  }
  io.emit("waterballs", waterballs);
}, 5000);

// Spawn medikits every 2 sec
setInterval(() => {
  medikits.push({ id: Date.now() + Math.random(), x: Math.random()*20-10, z: Math.random()*20-10 });
  io.emit("medikits", medikits);
}, 2000);

io.on("connection", (socket) => {
  console.log("Player connected: " + socket.id);

  players[socket.id] = { x:0, z:0, rotation:0, health:100, ammo:0, name:"Player"+Math.floor(Math.random()*1000) };

  socket.emit("init", { players, waterballs, medikits });
  io.emit("updatePlayers", players);

  socket.on("update", data => { 
    if(players[socket.id]) { 
      players[socket.id] = {...players[socket.id], ...data}; 
      io.emit("updatePlayers", players); 
    } 
  });

  socket.on("removeWaterball", id => { waterballs = waterballs.filter(b => b.id !== id); io.emit("waterballs", waterballs); });
  socket.on("removeMedikit", id => { medikits = medikits.filter(m => m.id !== id); io.emit("medikits", medikits); });

  socket.on("disconnect", () => { delete players[socket.id]; io.emit("updatePlayers", players); });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("Server running on port " + PORT));
