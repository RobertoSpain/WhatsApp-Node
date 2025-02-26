// Script para manejar la funcionalidad del login

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nombre = e.target.nombre.value;
            // Si el campo estado está vacío se asigna "Sin estado"
            const estado = e.target.estado.value || "Sin estado";
            const avatar = e.target.avatar.value;
            
            // Redirecciona a la página principal con los datos del usuario
            window.location.href = '/?nombre=' + encodeURIComponent(nombre) +
                                   '&estado=' + encodeURIComponent(estado) +
                                   '&avatar=' + encodeURIComponent(avatar);
        });
    }
});
