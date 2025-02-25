const express = require('express');
const path = require('path');
const port = process.env.PORT || 4000;
const hostname = 'localhost';
const { Server } = require('socket.io');
const { createServer } = require('node:http');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {} // Habilita la recuperación del estado de la conexión
});
var numUsuarios = 0;
const usuarios = new Map();

// Reemplazar la ruta raíz para que verifique la identificación
app.get('/', (req, res) => {
  if (!req.query.nombre) {
    res.sendFile(path.join(__dirname, 'public/login.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public/index.html'));
  }
});

app.get('/private.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/cliente/private.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  numUsuarios++;
  console.log('Nuevo usuario. Tengo ' + numUsuarios + ' usuarios conectados.');

  socket.on("nombre", (nombre) => {
    socket.nombreUsuario = nombre; // Guardamos el nombre en el socket
    console.log("Se ha conectado = " + nombre);
    io.emit("nombre", nombre);
  });

  socket.on("identificacion", (userData) => {
    // userData = { nombre, estado, avatar }
    socket.userData = userData;
    usuarios.set(socket.id, userData);
    io.emit("nuevoUsuario", [...usuarios.values()]);
  });

  socket.on("escribiendo", () => {
    io.emit("usuarioEscribiendo", socket.userData?.nombre);
  });

  socket.on("dejoDeEscribir", () => {
    io.emit("usuarioDejoDeEscribir", socket.userData?.nombre);
  });

  socket.on('mensaje', (datos) => {
    console.log(`Mensaje global de ${datos.nombre}: ${datos.mensaje}`);
    io.emit("holaDesdeElServidor", datos);
  });

  socket.on('privateMessage', (data) => {
    // data = { targetName, message }
    let targetSocketId = null;
    usuarios.forEach((userData, key) => {
      if (userData.nombre === data.targetName) {
        targetSocketId = key;
      }
    });
    if (targetSocketId) {
      io.to(targetSocketId).emit('privateMessage', { sender: socket.userData.nombre, message: data.message });
    }
  });

  socket.on('escribiendoPrivado', (data) => {
    let targetSocketId = null;
    usuarios.forEach((userData, key) => {
      if (userData.nombre === data.targetName) {
        targetSocketId = key;
      }
    });
    if (targetSocketId) {
      io.to(targetSocketId).emit('escribiendoPrivado', { sender: socket.userData.nombre });
    }
  });

  socket.on('dejoDeEscribirPrivado', (data) => {
    let targetSocketId = null;
    usuarios.forEach((userData, key) => {
      if (userData.nombre === data.targetName) {
        targetSocketId = key;
      }
    });
    if (targetSocketId) {
      io.to(targetSocketId).emit('dejoDeEscribirPrivado', { sender: socket.userData.nombre });
    }
  });

  socket.on('disconnect', () => {
    usuarios.delete(socket.id);
    io.emit("seHaDesconectado", socket.userData?.nombre);
    numUsuarios--;
    console.log("Ahora hay " + numUsuarios + " usuarios conectados.");
  });
});

server.listen(port, () => {
  console.log(`Run server on http://${hostname}:${port}`);
}).on('error', (err) => {
  console.error("Server error: ", err);
});