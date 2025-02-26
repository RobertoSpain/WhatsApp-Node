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

let numUsuarios = 0;
const usuarios = new Map(); // Mapa de socket.id -> userData
const usuariosPorNombre = new Map(); // Mapa de nombre -> socket.id

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
  // No registrar "Nuevo usuario conectado" aquí
  socket.on("nombre", (nombre) => {
    socket.nombreUsuario = nombre; // Guardamos el nombre en el socket
    console.log("Se ha conectado = " + nombre);
    io.emit("nombre", nombre);
  });

  socket.on("identificacion", (userData) => {
    // userData = { nombre, estado, avatar }
    socket.userData = userData;
    socket.isPrivate = false; // Marcar como conexión normal
    usuarios.set(socket.id, userData);
    usuariosPorNombre.set(userData.nombre, socket.id); // Agregar al segundo mapa
    numUsuarios++;
    io.emit("nuevoUsuario", [...usuarios.values()]);
    console.log('Tengo ' + numUsuarios + ' usuarios conectados.');
  });

  socket.on("identificacionPrivada", (userData) => {
    // userData = { nombre, avatar }
    socket.userData = userData;
    socket.isPrivate = true; // Marcar como conexión privada
    usuarios.set(socket.id, userData);
    usuariosPorNombre.set(userData.nombre, socket.id); // Agregar al segundo mapa
    console.log(`Conversación privada iniciada por ${userData.nombre}`);
  });

  socket.on("escribiendo", () => {
    if (socket.userData) {
      io.emit("usuarioEscribiendo", socket.userData.nombre);
    }
  });

  socket.on("dejoDeEscribir", () => {
    if (socket.userData) {
      io.emit("usuarioDejoDeEscribir", socket.userData.nombre);
    }
  });

  socket.on('mensaje', (datos) => {
    console.log(`Mensaje global de ${datos.nombre}: ${datos.mensaje}`);
    io.emit("holaDesdeElServidor", datos);
  });

  socket.on('privateMessage', (data) => {
    // data = { targetName, message, sender }
    const targetSocketId = usuariosPorNombre.get(data.targetName);
    
    if (targetSocketId && socket.userData) {
        // Enviar al destinatario
        io.to(targetSocketId).emit('privateMessage', { 
            sender: data.sender, 
            message: data.message 
        });
        
        // Enviar también al remitente (opcional, para confirmar envío)
        socket.emit('privateMessageSent', { 
            recipient: data.targetName, 
            message: data.message 
        });
        
        console.log(`Mensaje privado de ${data.sender} a ${data.targetName}: ${data.message}`);
    } else {
        // Informar que el usuario no está conectado
        socket.emit('privateMessageError', { error: 'Usuario no encontrado o desconectado' });
    }
  });

  socket.on('escribiendoPrivado', (data) => {
    if (socket.userData) {
      const targetSocketId = usuariosPorNombre.get(data.targetName);
      if (targetSocketId) {
        io.to(targetSocketId).emit('escribiendoPrivado', { sender: socket.userData.nombre });
      }
    }
  });

  socket.on('dejoDeEscribirPrivado', (data) => {
    if (socket.userData) {
      const targetSocketId = usuariosPorNombre.get(data.targetName);
      if (targetSocketId) {
        io.to(targetSocketId).emit('dejoDeEscribirPrivado', { sender: socket.userData.nombre });
      }
    }
  });

  socket.on('disconnect', () => {
    if (socket.userData) {
      usuarios.delete(socket.id);
      usuariosPorNombre.delete(socket.userData.nombre); // Eliminar del segundo mapa
      
      if (!socket.isPrivate) {
        // Solo notificar que se ha desconectado si es una conexión principal
        io.emit("seHaDesconectado", socket.userData.nombre);
        numUsuarios--;
        console.log("Ahora hay " + numUsuarios + " usuarios conectados.");
      } else {
        console.log(`Ventana de chat privado de ${socket.userData.nombre} cerrada`);
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Run server on http://${hostname}:${port}`);
}).on('error', (err) => {
  console.error("Server error: ", err);
});