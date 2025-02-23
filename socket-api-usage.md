# Revisión del uso de la API Socket.IO

En el archivo private.html se observa lo siguiente:
- Se establece la conexión: `const socket = io();`
- Se emiten eventos:
  - `socket.emit('nombre', sender);`
  - `socket.emit('identificacion', { nombre: sender, estado: 'privado', avatar: 'avatar1.png' });`
  - `socket.emit('privateMessage', { targetName: target, message });`
- Se reciben eventos:
  - `socket.on('privateMessage', (data) => { /* ... */ });`

Esto coincide con la documentación, que muestra la utilización de socket.emit() y socket.on() para transmitir y recibir datos.
