window.onload = () => {
    const socket = io();

    // Lógica para index.html
    if (document.getElementById('cajaMensaje')) {
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

        cajaMensaje.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && cajaMensaje.value.trim() !== '') {
                socket.emit('mensaje', { nombre: userData.nombre, mensaje: cajaMensaje.value });
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
    }

    // Lógica para private.html
    if (document.getElementById('formPrivate')) {
        const params = new URLSearchParams(window.location.search);
        const target = params.get('target');
        const sender = params.get('sender');
        document.getElementById('targetName').textContent = target;

        socket.emit('nombre', sender);
        socket.emit('identificacion', { nombre: sender, estado: 'privado', avatar: 'avatar1.png' });

        document.getElementById('formPrivate').addEventListener('submit', e => {
            e.preventDefault();
            const message = document.getElementById('privateMessage').value;
            if(message.trim() !== ''){
                socket.emit('privateMessage', { targetName: target, message: message });
                document.getElementById('privateChatArea').innerHTML += `<div><b>Tú:</b> ${message}</div>`;
                document.getElementById('privateMessage').value = '';
            }
        });

        document.getElementById('privateMessage').addEventListener('input', () => {
            socket.emit('escribiendoPrivado', { targetName: target });
            setTimeout(() => socket.emit('dejoDeEscribirPrivado', { targetName: target }), 2000);
        });

        socket.on('privateMessage', (data) => {
            document.getElementById('privateChatArea').innerHTML += `<div><b>${data.sender}:</b> ${data.message}</div>`;
        });

        socket.on('escribiendoPrivado', (data) => {
            // En lugar de comparar con 'target', muestra siempre el aviso si el 'sender' no es quien abrió la página
            if (data.sender !== sender) {
                document.getElementById('avisoEscribiendoPrivado').textContent = data.sender + " está escribiendo...";
            }
        });

        socket.on('dejoDeEscribirPrivado', (data) => {
            if (data.sender !== sender) {
                document.getElementById('avisoEscribiendoPrivado').textContent = '';
            }
        });
    }

    // Lógica para login.html
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', e => {
            e.preventDefault();
            const nombre = e.target.nombre.value;
            const estado = e.target.estado.value || "Sin estado";
            const avatar = e.target.avatar.value;
            window.location.href = '/?nombre=' + encodeURIComponent(nombre) +
                                   '&estado=' + encodeURIComponent(estado) +
                                   '&avatar=' + encodeURIComponent(avatar);
        });
    }
};
