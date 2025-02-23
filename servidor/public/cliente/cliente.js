window.onload = () => {
    const socket = io();
    const cajaMensaje = document.getElementById('cajaMensaje');
    const mensajes = document.getElementById('mensajes');
    
    const params = new URLSearchParams(window.location.search);
    const userData = {
        nombre: params.get('nombre') || prompt("Escribe tu nombre"),
        estado: params.get('estado') || "Sin estado",
        avatar: params.get('avatar') || "avatar1.png"
    };
    socket.emit('nombre', userData.nombre);
    socket.emit("identificacion", userData);

    // --- Nuevo: Unirse a una sala ---
    // Supongamos que en el HTML agregas un input con id="roomInput" y un botón con id="joinRoomBtn"
    document.getElementById('joinRoomBtn')?.addEventListener('click', () => {
        const room = document.getElementById('roomInput')?.value;
        if(room && room.trim() !== ''){
            socket.emit('joinRoom', room);
            alert(`Te uniste a la sala: ${room}`);
        }
    });
    // --- Fin nuevo sección ---

    cajaMensaje.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && cajaMensaje.value.trim() !== '') {
            // Envia datos opcionalmente con la sala (si se ha seleccionado) 
            // Por ejemplo, si agregas un input con id="roomMessage" para enviar mensajes a una sala:
            const room = document.getElementById('roomMessage') ? document.getElementById('roomMessage').value : '';
            socket.emit('mensaje', { nombre: userData.nombre, mensaje: cajaMensaje.value, room: room || undefined });
            cajaMensaje.value = '';
        }
    });

    socket.on("nombre", (nombre) => {
        mensajes.innerHTML += `<li><b>${nombre} ha entrado</b></li>`;
    });

    socket.on('holaDesdeElServidor', (datos) => {
        mensajes.innerHTML += `<li>${datos.nombre}: ${datos.mensaje}</li>`;
    });

    socket.on("seHaDesconectado", (nombre) => {
        mensajes.innerHTML += `<li><b>${nombre} salió</b></li>`;
    });

    // Actualiza la lista de usuarios y asigna listener para abrir chat privado
    socket.on("nuevoUsuario", users => {
        let lista = '';
        users.forEach(u => { 
            lista += `<li class="userItem" data-nombre="${u.nombre}">${u.nombre} (${u.estado})</li>`; 
        });
        document.getElementById('listaUsuarios').innerHTML = lista;
        document.querySelectorAll('.userItem').forEach(item => {
            item.addEventListener('click', (e) => {
                const targetName = e.target.getAttribute('data-nombre');
                if (targetName && targetName !== userData.nombre) {
                    window.open('private.html?target=' + encodeURIComponent(targetName) + '&sender=' + encodeURIComponent(userData.nombre), '_blank', 'width=400,height=500');
                }
            });
        });
    });

    cajaMensaje.addEventListener('input', () => {
        socket.emit('escribiendo');
        setTimeout(() => socket.emit('dejoDeEscribir'), 2000);
    });

    socket.on("usuarioEscribiendo", nombre => {
        document.getElementById('avisoEscribiendo').textContent = nombre + " está escribiendo...";
    });

    socket.on("usuarioDejoDeEscribir", nombre => {
        document.getElementById('avisoEscribiendo').textContent = '';
    });
};
