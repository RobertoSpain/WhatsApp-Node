window.onload = () => {
    const socket = io(); // Inicializa la conexión de socket solo una vez

    // Lógica para index.html
    if (document.getElementById('cajaMensaje')) {
        const cajaMensaje = document.getElementById('cajaMensaje');
        const mensajes = document.getElementById('mensajes');
        const botonEnviar = document.querySelector('.input-area button');
        
        const params = new URLSearchParams(window.location.search);
        const userData = {
            nombre: params.get('nombre') || prompt("Escribe tu nombre"),
            estado: params.get('estado') || "Sin estado",
            avatar: params.get('avatar') || "avatar1.png"
        };

        // Guardar userData en sessionStorage para compartir entre ventanas
        sessionStorage.setItem('userData', JSON.stringify(userData));

        // Emitir eventos de identificación solo en index.html
        socket.emit('nombre', userData.nombre);
        socket.emit("identificacion", userData);

        const enviarMensaje = () => {
            if (cajaMensaje.value.trim() !== '') {
                socket.emit('mensaje', { nombre: userData.nombre, mensaje: cajaMensaje.value });
                cajaMensaje.value = '';
            }
        };

        cajaMensaje.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                enviarMensaje();
            }
        });

        botonEnviar.addEventListener('click', enviarMensaje);

        socket.on("nombre", (nombre) => {
            mensajes.innerHTML += `<li><b>${nombre} ha entrado</b></li>`;
            // Hacer scroll hacia abajo para ver nuevos mensajes
            mensajes.scrollTop = mensajes.scrollHeight;
        });

        socket.on('holaDesdeElServidor', (datos) => {
            mensajes.innerHTML += `<li>${datos.nombre}: ${datos.mensaje}</li>`;
            // Hacer scroll hacia abajo para ver nuevos mensajes
            mensajes.scrollTop = mensajes.scrollHeight;
        });

        socket.on("seHaDesconectado", (nombre) => {
            mensajes.innerHTML += `<li><b>${nombre} salió</b></li>`;
            // Hacer scroll hacia abajo para ver nuevos mensajes
            mensajes.scrollTop = mensajes.scrollHeight;
        });

        socket.on("nuevoUsuario", users => {
            let lista = '';
            users.forEach(u => { 
                lista += `<li class="userItem" data-nombre="${u.nombre}">
                            <img src="/img/${u.avatar}" alt="${u.nombre}" width="40" height="40">
                            <span data-nombre="${u.nombre}">${u.nombre} (${u.estado})</span>
                          </li>`; 
            });
            document.getElementById('listaUsuarios').innerHTML = lista;
            
            // Mejorar la forma de asignar los eventos click para que funcionen con todo el elemento
            document.querySelectorAll('.userItem').forEach(item => {
                item.addEventListener('click', () => {
                    const targetName = item.getAttribute('data-nombre');
                    if (targetName && targetName !== userData.nombre) {
                        const windowName = 'private_' + targetName.replace(/\s+/g, '_');
                        // Incluir todos los datos necesarios en la URL
                        window.open('private.html?target=' + encodeURIComponent(targetName) + 
                                   '&sender=' + encodeURIComponent(userData.nombre) + 
                                   '&senderAvatar=' + encodeURIComponent(userData.avatar),
                                   windowName, 'width=400,height=500');
                    }
                });
            });
        });

        cajaMensaje.addEventListener('input', () => {
            socket.emit('escribiendo');
            clearTimeout(window.typingTimer);
            window.typingTimer = setTimeout(() => socket.emit('dejoDeEscribir'), 2000);
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
        const senderAvatar = params.get('senderAvatar');
        
        document.getElementById('targetName').textContent = target;

        // Importante: identificar al usuario para esta ventana
        // Esto es crucial para que los mensajes privados funcionen
        socket.emit('identificacionPrivada', { 
            nombre: sender, 
            avatar: senderAvatar || 'avatar1.png'
        });

        const enviarMensajePrivado = () => {
            const message = document.getElementById('privateMessage').value;
            if (message.trim() !== '') {
                socket.emit('privateMessage', { 
                    targetName: target, 
                    message: message,
                    sender: sender
                });
                
                document.getElementById('privateChatArea').innerHTML += `<div class="message-bubble out"><b>Tú:</b> ${message}</div>`;
                document.getElementById('privateMessage').value = '';
                
                // Hacer scroll hacia abajo para ver nuevos mensajes
                const chatArea = document.getElementById('privateChatArea');
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        };

        document.getElementById('formPrivate').addEventListener('submit', e => {
            e.preventDefault();
            enviarMensajePrivado();
        });

        document.getElementById('privateMessage').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                enviarMensajePrivado();
            }
        });

        document.getElementById('privateMessage').addEventListener('input', () => {
            socket.emit('escribiendoPrivado', { 
                targetName: target,
                sender: sender
            });
            
            clearTimeout(window.privateTypingTimer);
            window.privateTypingTimer = setTimeout(() => {
                socket.emit('dejoDeEscribirPrivado', { 
                    targetName: target,
                    sender: sender
                });
            }, 2000);
        });

        // Escuchar los mensajes privados
        socket.on('privateMessage', (data) => {
            console.log('Mensaje privado recibido:', data);
            
            if (data.sender === target) {
                document.getElementById('privateChatArea').innerHTML += `<div class="message-bubble in"><b>${data.sender}:</b> ${data.message}</div>`;
                
                // Hacer scroll hacia abajo para ver nuevos mensajes
                const chatArea = document.getElementById('privateChatArea');
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        });

        socket.on('escribiendoPrivado', (data) => {
            console.log('Notificación escribiendo:', data);
            
            if (data.sender === target) {
                document.getElementById('avisoEscribiendoPrivado').textContent = data.sender + " está escribiendo...";
            }
        });

        socket.on('dejoDeEscribirPrivado', (data) => {
            if (data.sender === target) {
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