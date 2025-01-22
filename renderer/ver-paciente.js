// Referencias al modal de notificación
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalIcon = document.getElementById('modal-icon');
const closeModalButton = document.getElementById('close-modal');

// Referencias al modal de confirmación
const confirmModal = document.getElementById('confirmModal');
const confirmModalTitle = document.getElementById('confirmModalTitle');
const confirmModalMessage = document.getElementById('confirmModalMessage');
const confirmActionButton = document.getElementById('confirmAction');
const cancelConfirmButton = document.getElementById('cancelConfirm');

// Referencias a elementos de la interfaz
const nombreCompletoPaciente = document.getElementById('nombreCompletoPaciente');
const listaFichas = document.getElementById('listaFichas');
const editarPacienteBtn = document.getElementById('editarPaciente');
const botonNuevaFicha = document.getElementById('nuevaFicha');

// Referencias para información del paciente
const detallePaciente = {
    fecha_nacimiento: document.getElementById('fechaNacimiento'),
    sexo: document.getElementById('sexo'),
    estado_civil: document.getElementById('estadoCivil'),
    direccion: document.getElementById('direccion'),
    localidad: document.getElementById('localidad'),
    provincia: document.getElementById('provincia'),
    codigo_postal: document.getElementById('codigoPostal'),
    pareja: document.getElementById('pareja'),
    hijo1: document.getElementById('hijo1'),
    hijo2: document.getElementById('hijo2'),
    hijo3: document.getElementById('hijo3'),
    obra_social: document.getElementById('obraSocial'),
    num_afiliado: document.getElementById('numAfiliado'),
    grupo_sanguineo: document.getElementById('grupoSanguineo'),
    telefono: document.getElementById('telefono'),
    contacto_emergencia: document.getElementById('contactoEmergencia'),
};

// Función para mostrar el modal de notificación
function showModal(title, message, isSuccess = true) {
    if (!modal || !modalTitle || !modalMessage || !modalIcon) {
        console.warn('Elementos del modal no encontrados.');
        return;
    }

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    modalIcon.innerHTML = isSuccess
        ? `<svg class="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`
        : `<svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;

    modal.classList.remove('hidden');
}

// Función para mostrar el modal de confirmación
function showConfirmModal(title, message, onConfirm) {
    if (!confirmModal || !confirmModalTitle || !confirmModalMessage || !confirmActionButton || !cancelConfirmButton) {
        console.warn('Elementos del modal de confirmación no encontrados.');
        return;
    }

    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;

    confirmActionButton.onclick = () => {
        confirmModal.classList.add('hidden');
        onConfirm();
    };

    cancelConfirmButton.onclick = () => {
        confirmModal.classList.add('hidden');
    };

    confirmModal.classList.remove('hidden');
}

// Ocultar el modal al hacer clic en el botón de cerrar
closeModalButton?.addEventListener('click', () => {
    modal.classList.add('hidden');
});

// Obtener ID del afiliado desde la URL
function obtenerIdDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Función para formatear datos
function formatearDato(dato) {
    return dato && dato.trim() !== '' ? dato : '-';
}

// Función para formatear fechas al formato dd/mm/yyyy
function formatearFecha(fecha) {
    if (!fecha) return '-';
    const partes = fecha.split('-'); // Formato esperado: yyyy-mm-dd
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : '-';
}

// Cambiar entre pestañas
function cambiarPestana(event) {
    event.preventDefault();

    document.querySelectorAll('#detallePaciente > div > div').forEach((seccion) => {
        seccion.classList.add('hidden');
    });

    document.querySelectorAll('ul.flex.border-b li a').forEach((tab) => {
        tab.classList.remove('text-blue-700', 'border-l', 'border-t', 'border-r', 'rounded-t', 'font-semibold');
        tab.classList.add('text-blue-500', 'hover:text-blue-800');
    });

    const href = event.target.getAttribute('href');
    const targetSection = document.querySelector(href);
    if (targetSection) targetSection.classList.remove('hidden');

    event.target.classList.add('text-blue-700', 'border-l', 'border-t', 'border-r', 'rounded-t', 'font-semibold');
}

// Cargar detalles del afiliado
async function cargarDetalleAfiliado() {
    const afiliadoId = obtenerIdDesdeURL();

    if (!afiliadoId || isNaN(afiliadoId)) {
        showModal('Error', 'No se proporcionó un ID válido para el hermano.', false);
        return;
    }

    try {
        const afiliado = await window.electronAPI.invoke('get-affiliate-by-id', parseInt(afiliadoId, 10));

        if (!afiliado) {
            showModal('Error', 'El hermano no fue encontrado.', false);
            return;
        }

        nombreCompletoPaciente.textContent = `${formatearDato(afiliado.nombre)} ${formatearDato(afiliado.apellido)}`;
        Object.keys(detallePaciente).forEach((key) => {
            detallePaciente[key].textContent = key.includes('fecha')
                ? formatearFecha(afiliado[key])
                : formatearDato(afiliado[key]);
        });

        await cargarFichas(afiliadoId);
    } catch (error) {
        console.error('Error al cargar el hermano:', error.message || error);
        showModal('Error', error.message || 'Hubo un problema al cargar los datos del hermano.', false);
    }
}

// Cargar fichas médicas del afiliado
async function cargarFichas(afiliadoId) {
    try {
        // Llama al manejador 'get-affiliate-records'
        const fichas = await window.electronAPI.invoke('get-affiliate-records', parseInt(afiliadoId, 10));
        listaFichas.innerHTML = '';

        if (!fichas || fichas.length === 0) {
            listaFichas.innerHTML = `
                <div class="text-center text-gray-500 py-6">
                    <i class="fas fa-file-medical-alt text-blue-500 text-4xl mb-2"></i>
                    <p class="text-lg font-medium">No hay fichas disponibles para este hermano.</p>
                </div>`;
            return;
        }

        fichas.sort((a, b) => new Date(b.proximo_contacto || 0) - new Date(a.proximo_contacto || 0));

        fichas.forEach(ficha => {
            const fichaDiv = document.createElement('div');
            fichaDiv.classList.add('p-4', 'border', 'rounded-lg', 'shadow-sm', 'flex', 'justify-between', 'items-center');

            fichaDiv.innerHTML = `
                <div>
                    <p><strong>Último Contacto:</strong> ${formatearDato(formatearFecha(ficha.ultimo_contacto))}</p>
                    <p><strong>Fecha Último Evento:</strong> ${formatearDato(formatearFecha(ficha.fecha_ultimo_evento))}</p>
                    <p><strong>Próximo Contacto:</strong> ${formatearDato(formatearFecha(ficha.proximo_contacto))}</p>
                    <p><strong>Antecedentes declarados:</strong> ${formatearDato(ficha.antecedentes)}</p>
                    <p><strong>Hecho:</strong> ${formatearDato(ficha.hecho)}</p>
                    <p><strong>Otros datos de interés:</strong> ${formatearDato(ficha.otros_datos)}</p>
                    <p><strong>Notas/Observaciones:</strong> ${formatearDato(ficha.notas)}</p>
                    <p><strong>Detalle:</strong> ${formatearDato(ficha.detalle)}</p>
                </div>
                <div>
                    <button class="text-red-500 hover:text-red-700" onclick="eliminarFicha(${ficha.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>`;
            listaFichas.appendChild(fichaDiv);
        });
    } catch (error) {
        console.error('Error al cargar fichas:', error);
        showModal('Error', 'Hubo un problema al cargar las fichas del hermano.', false);
    }
}

// Función para eliminar una ficha
async function eliminarFicha(fichaId) {
    showConfirmModal('Eliminar Ficha', '¿Estás seguro de eliminar esta ficha?', async () => {
        try {
            await window.electronAPI.invoke('delete-record', fichaId);
            showModal('Ficha Eliminada', 'Ficha eliminada correctamente.');
            await cargarFichas(obtenerIdDesdeURL());
        } catch (error) {
            console.error('Error al eliminar ficha:', error);
            showModal('Error', 'Hubo un problema al eliminar la ficha.', false);
        }
    });
}

// Manejo de eventos
editarPacienteBtn?.addEventListener('click', () => {
    const afiliadoId = obtenerIdDesdeURL();
    window.location.href = `index.html?afiliadoId=${afiliadoId}`;
});

botonNuevaFicha?.addEventListener('click', () => {
    const afiliadoId = obtenerIdDesdeURL();
    window.location.href = `index.html?afiliadoId=${afiliadoId}&abrirFicha=true`;
});

document.querySelectorAll('ul.flex.border-b li a').forEach(tab => tab.addEventListener('click', cambiarPestana));

// Llamar a las funciones al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await cargarDetalleAfiliado();
    } catch (error) {
        console.error('Error al inicializar la página:', error);
        showModal('Error', 'Hubo un problema al cargar la aplicación. Revisa la consola para más detalles.', false);
    }
});