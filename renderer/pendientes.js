// Elementos DOM
const tablaPendientes = document.getElementById('tablaPendientes');
const sortBySelect = document.getElementById('sortBy');
const searchInput = document.getElementById('searchInput');
const eliminarVencidosBtn = document.getElementById('eliminarFichasVencidas');
let calendar;

// Elementos del modal
const modalEditar = document.getElementById('modalEditar');
const formEditar = document.getElementById('formEditar');
const fechaContactoInput = document.getElementById('fechaContacto');
const fichaIdInput = document.getElementById('fichaId');
const guardarFechaBtn = document.getElementById('guardarFecha');
const cerrarModalBtn = document.getElementById('cerrarModal');

let currentPage = 1;
const recordsPerPage = 5;
let totalRecords = 0; // Se actualiza dinámicamente con `fichasGlobal`

let fichasGlobal = [];

// Formatear fechas al formato dd/mm/yyyy
function formatearFecha(fecha) {
    if (!fecha) return '-';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
}

// Ajusta una fecha al inicio del día
function ajustarHoraPorDefecto(fechaStr) {
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
        const [year, month, day] = partes;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
    }
    console.warn(`Fecha inválida: ${fechaStr}`);
    return new Date(NaN);
}

// Calcula la prioridad del próximo contacto
function calcularPrioridad(fecha) {
    const ahora = new Date();
    const fechaContacto = ajustarHoraPorDefecto(fecha);
    const diferenciaDias = Math.ceil((fechaContacto - ahora) / (1000 * 60 * 60 * 24));

    if (diferenciaDias <= 2) {
        return { nivel: 'Alta', clase: 'bg-red-100 text-red-800' };
    } else if (diferenciaDias <= 7) {
        return { nivel: 'Media', clase: 'bg-yellow-100 text-yellow-800' };
    } else {
        return { nivel: 'Baja', clase: 'bg-green-100 text-green-800' };
    }
}

// Renderiza la tabla con soporte de paginación
function renderizarTabla(fichas) {
    tablaPendientes.innerHTML = '';

    if (fichas.length === 0) {
        tablaPendientes.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">No hay contactos pendientes.</td>
            </tr>
        `;
        eliminarVencidosBtn.disabled = true;
        return;
    }

    // Configuración de paginación
    const totalRecords = fichas.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;

    // Obtén los registros de la página actual
    const fichasPaginadas = fichas.slice(startIndex, endIndex);

    // Renderizar registros paginados
    let hayVencidos = false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Establece la hora al inicio del día

    fichasPaginadas.forEach(ficha => {
        const prioridad = calcularPrioridad(ficha.proximo_contacto);
        const fechaContacto = ajustarHoraPorDefecto(ficha.proximo_contacto);
        const esVencida = fechaContacto < hoy; // Es vencida si la fecha es menor a hoy

        if (esVencida) {
            hayVencidos = true;
        }

        const row = document.createElement('tr');
        row.classList.add('hover:bg-gray-100');
        if (esVencida) {
            row.classList.add('bg-red-100'); // Fondo rojo solo si es vencida
        }

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${ficha.nombre} ${ficha.apellido}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${formatearFecha(ficha.proximo_contacto)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${prioridad.clase}">
                    ${prioridad.nivel}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button 
                    onclick="abrirModalEditar(${JSON.stringify(ficha).replace(/"/g, '&quot;')})"
                    class="text-blue-600 hover:text-blue-900 mr-3"
                >
                    Editar
                </button>
                <button 
                    onclick="mostrarModalConfirmacion(${JSON.stringify(ficha).replace(/"/g, '&quot;')})"
                    class="text-green-600 hover:text-green-900"
                >
                    Contactado
                </button>
            </td>
        `;
        tablaPendientes.appendChild(row);
    });

    eliminarVencidosBtn.disabled = !hayVencidos;

    // Actualizar controles de paginación
    actualizarControlesPaginacion(totalRecords, totalPages);
}

function actualizarControlesPaginacion(totalRecords, totalPages) {
    const paginationContainer = document.getElementById('pagination');
    const pageNumbersContainer = document.getElementById('pageNumbers');
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');

    // Verificar existencia de elementos necesarios
    if (!paginationContainer || !pageNumbersContainer || !prevButton || !nextButton) {
        console.warn('Elementos de paginación no encontrados en el DOM.');
        return;
    }

    const startRecord = (currentPage - 1) * recordsPerPage + 1;
    const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);

    // Actualizar texto de registros mostrados
    document.getElementById('startRecord').textContent = startRecord;
    document.getElementById('endRecord').textContent = endRecord;
    document.getElementById('totalRecords').textContent = totalRecords;

    // Crear controles de paginación dinámicamente
    pageNumbersContainer.innerHTML = ''; // Limpia los números de página existentes

    for (let i = 1; i <= totalPages; i++) {
        const pageLink = document.createElement('a');
        pageLink.href = '#';
        pageLink.classList.add(
            'relative', 'inline-flex', 'items-center', 'px-4', 'py-2',
            'border', 'border-gray-300', 'bg-white', 'text-sm',
            'font-medium', 'text-gray-700', 'hover:bg-gray-50'
        );

        // Destacar la página actual
        if (i === currentPage) {
            pageLink.classList.add('bg-blue-100', 'text-blue-600');
        }

        pageLink.textContent = i;

        // Cambiar página al hacer clic
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage !== i) {
                currentPage = i;
                renderizarTabla(fichasGlobal);
            }
        });

        pageNumbersContainer.appendChild(pageLink);
    }

    // Actualizar estado de los botones "Anterior" y "Siguiente"
    prevButton.classList.toggle('cursor-not-allowed', currentPage === 1);
    nextButton.classList.toggle('cursor-not-allowed', currentPage === totalPages);

    // Eliminar y agregar eventos para evitar acumulación
    prevButton.onclick = null;
    nextButton.onclick = null;

    // Botón "Anterior"
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderizarTabla(fichasGlobal);
        }
    });

    // Botón "Siguiente"
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderizarTabla(fichasGlobal);
        }
    });
}

function renderizarCalendario() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.warn('Elemento del calendario no encontrado en el DOM.');
        return;
    }

    // Destruir el calendario anterior si ya está renderizado
    if (calendar) {
        calendar.destroy();
    }

    // Crear una nueva instancia de FullCalendar
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
        },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
        },
        titleFormat: {
            year: 'numeric',
            month: 'long',
        },
        events: fichasGlobal.map(ficha => ({
            title: `${ficha.nombre} ${ficha.apellido}`,
            start: ficha.proximo_contacto,
            backgroundColor: obtenerColorEventoCalendario(calcularPrioridad(ficha.proximo_contacto).nivel),
            borderColor: obtenerColorEventoCalendario(calcularPrioridad(ficha.proximo_contacto).nivel),
        })),
        eventClick: function (info) {
            showModal(
                'Detalles del contacto',
                `Contacto pendiente con: ${info.event.title}. Fecha: ${formatearFecha(info.event.startStr)}`
            );
        },
    });

    calendar.render(); // Renderiza el calendario
}

function obtenerColorEventoCalendario(prioridad) {
    // Devuelve un color basado en el nivel de prioridad
    switch (prioridad) {
        case 'Alta':
            return '#EF4444'; // Rojo para alta prioridad
        case 'Media':
            return '#FBBF24'; // Amarillo para media prioridad
        case 'Baja':
            return '#10B981'; // Verde para baja prioridad
        default:
            return '#6B7280'; // Gris para valores desconocidos
    }
}

function mostrarModalConfirmacion(ficha) {
    const confirmModal = document.getElementById('confirmModal');
    const confirmTitle = document.getElementById('confirmModalTitle');
    const confirmMessage = document.getElementById('confirmModalMessage');
    const confirmAction = document.getElementById('confirmAction');
    const cancelConfirm = document.getElementById('cancelConfirm');

    // Validar que todos los elementos existen en el DOM
    if (!confirmModal || !confirmTitle || !confirmMessage || !confirmAction || !cancelConfirm) {
        console.warn('Elementos del modal de confirmación no encontrados en el DOM.');
        return;
    }

    // Configurar el contenido del modal
    confirmTitle.textContent = 'Confirmación';
    confirmMessage.textContent = `¿Estás seguro de que deseas marcar como contactado a ${ficha.nombre} ${ficha.apellido}?`;

    // Manejar la acción de confirmación
    confirmAction.onclick = async () => {
        try {
            await window.electronAPI.invoke('mark-ficha-contacted', ficha.ficha_id);
            showModal('¡Éxito!', `Ficha de ${ficha.nombre} ${ficha.apellido} marcada como contactada.`);
            // Actualizar datos globales y renderizar tabla nuevamente
            await cargarFichasPendientes();
            confirmModal.classList.add('hidden');
        } catch (error) {
            console.error('Error al marcar ficha como contactada:', error);
            showModal('Error', 'No se pudo actualizar el estado de la ficha.', false);
        }
    };

    // Manejar la cancelación
    cancelConfirm.onclick = () => {
        confirmModal.classList.add('hidden');
    };

    // Mostrar el modal
    confirmModal.classList.remove('hidden');
}

async function marcarComoContactado(ficha) {
    if (!ficha || !ficha.ficha_id) {
        console.error('Ficha inválida o falta el ID de ficha.');
        showModal('Error', 'No se pudo procesar la solicitud. Verifica los datos.', false);
        return;
    }

    try {
        await window.electronAPI.invoke('mark-ficha-contacted', ficha.ficha_id);

        // Elimina la ficha de la lista global y actualiza la tabla y el calendario
        fichasGlobal = fichasGlobal.filter(f => f.ficha_id !== ficha.ficha_id);
        renderizarTabla(fichasGlobal);
        renderizarCalendario();

        showModal('Éxito', `El hermano ${ficha.nombre} ${ficha.apellido} fue marcado como contactado.`);
    } catch (error) {
        console.error('Error al marcar como contactado:', error);
        showModal('Error', error.message || 'Hubo un problema al marcar como contactado.', false);
    }
}

// Mostrar modal de notificación
function showModal(title, message, isSuccess = true) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const closeModalButton = document.getElementById('close-modal');

    if (!modal || !modalTitle || !modalMessage || !closeModalButton) {
        console.warn('Elementos del modal no encontrados en el DOM.');
        return;
    }

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.remove('hidden');

    closeModalButton.onclick = () => {
        modal.classList.add('hidden');
    };
}

function abrirModalEditar(ficha) {
    if (!ficha || !ficha.ficha_id || !ficha.proximo_contacto) {
        console.error('Ficha inválida o datos faltantes.');
        showModal('Error', 'No se pudo abrir el editor. Datos de ficha inválidos.', false);
        return;
    }

    const hoy = new Date().toISOString().split('T')[0];

    if (!fechaContactoInput || !fichaIdInput || !modalEditar) {
        console.warn('Elementos del modal de edición no encontrados.');
        return;
    }

    fechaContactoInput.setAttribute('min', hoy);
    fichaIdInput.value = ficha.ficha_id;
    fechaContactoInput.value = ficha.proximo_contacto;
    modalEditar.classList.remove('hidden');
}

function cerrarModal() {
    if (!modalEditar) {
        console.warn('El modal de edición no se encuentra en el DOM.');
        return;
    }
    modalEditar.classList.add('hidden');
}

async function guardarFechaEditada() {
    const nuevaFecha = fechaContactoInput.value;
    const fichaId = fichaIdInput.value;
    const errorMessage = document.getElementById('error-message');

    if (!nuevaFecha || !fichaId) {
        console.warn('Datos insuficientes para actualizar la fecha.');
        showModal('Error', 'No se pudo actualizar la fecha. Verifica los datos.', false);
        return;
    }

    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');

    const hoy = new Date().setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(nuevaFecha).setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
        errorMessage.textContent = 'No puedes seleccionar una fecha anterior a la de hoy.';
        errorMessage.classList.remove('hidden');
        return;
    }

    try {
        await window.electronAPI.invoke('update-proximo-contacto', {
            fichaId: parseInt(fichaId, 10),
            proximoContacto: nuevaFecha,
        });

        // Actualizar los datos en fichasGlobal
        const index = fichasGlobal.findIndex(ficha => ficha.ficha_id === parseInt(fichaId, 10));
        if (index !== -1) {
            fichasGlobal[index].proximo_contacto = nuevaFecha;
            fichasGlobal[index].estado = fechaSeleccionada < hoy ? 'vencida' : 'vigente';
        }

        // Renderizar nuevamente la tabla y el calendario
        renderizarTabla(fichasGlobal);
        actualizarCalendario();

        // Cerrar el modal y mostrar mensaje de éxito
        cerrarModal();
        showModal('Éxito', 'La fecha de próximo contacto se actualizó correctamente.', true);
    } catch (error) {
        console.error('Error al actualizar la fecha:', error);
        errorMessage.textContent = error.message || 'No se pudo actualizar la fecha.';
        errorMessage.classList.remove('hidden');
    }
}

function actualizarCalendario() {
    if (!calendar) return;

    // Limpia los eventos actuales
    calendar.removeAllEvents();

    // Agrega los nuevos eventos basados en `fichasGlobal`
    calendar.addEventSource(
        fichasGlobal.map(ficha => ({
            title: `${ficha.nombre} ${ficha.apellido}`,
            start: ficha.proximo_contacto,
            backgroundColor: obtenerColorEventoCalendario(calcularPrioridad(ficha.proximo_contacto).nivel),
            borderColor: obtenerColorEventoCalendario(calcularPrioridad(ficha.proximo_contacto).nivel),
        }))
    );
}

function eliminarFichasVencidas() {
    fichasGlobal = fichasGlobal.filter(ficha => ficha.estado !== 'vencida');
    renderizarTabla(fichasGlobal);
    renderizarCalendario();

    // Verificar nuevamente si hay fichas vencidas después de eliminar
    const hayVencidas = fichasGlobal.some(ficha => ficha.estado === 'vencida');
    actualizarEstadoBotonEliminarVencidas(hayVencidas);
}

// Cargar fichas pendientes
async function cargarFichasPendientes() {
    try {
        const fichas = await window.electronAPI.invoke('get-pending-fichas');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Comparar solo fechas, sin horas

        // Verifica si hay fichas vencidas y actualiza su estado
        fichasGlobal = fichas.map(ficha => {
            const fechaContacto = ajustarHoraPorDefecto(ficha.proximo_contacto);
            return {
                ...ficha,
                estado: fechaContacto < hoy ? 'vencida' : 'vigente',
            };
        });

        const hayVencidas = fichasGlobal.some(ficha => ficha.estado === 'vencida');

        // Actualiza el estado del botón
        actualizarEstadoBotonEliminarVencidas(hayVencidas);

        // Renderiza la tabla y el calendario
        renderizarTabla(fichasGlobal);
        renderizarCalendario();
    } catch (error) {
        console.error('Error al cargar fichas pendientes:', error);
        showModal('Error', 'No se pudieron cargar las fichas pendientes.', false);
    }
}

function actualizarEstadoBotonEliminarVencidas(hayVencidas) {
    if (eliminarVencidosBtn) {
        if (hayVencidas) {
            eliminarVencidosBtn.disabled = false;
            eliminarVencidosBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
            eliminarVencidosBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        } else {
            eliminarVencidosBtn.disabled = true;
            eliminarVencidosBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
            eliminarVencidosBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
        }
    }
}

function ordenarFichas(criterio) {
    const fichasOrdenadas = [...fichasGlobal];
    fichasOrdenadas.sort((a, b) => {
        if (criterio === 'date') {
            return new Date(a.proximo_contacto) - new Date(b.proximo_contacto);
        }
        if (criterio === 'name') {
            return `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`);
        }
    });

    renderizarTabla(fichasOrdenadas);
}

function filtrarPorTexto() {
    const filtro = searchInput.value.toLowerCase().trim(); // Captura el texto ingresado
    const fichasFiltradas = fichasGlobal.filter(ficha =>
        `${ficha.nombre} ${ficha.apellido}`.toLowerCase().includes(filtro)
    );

    currentPage = 1; // Reinicia la paginación al inicio
    renderizarTabla(fichasFiltradas);
}

function iniciarRecargaAutomatica() {
    setInterval(() => {
        cargarFichasPendientes();
    }, 60000);
}

function filtrarFichasVigentes(fichas) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Ajustar a medianoche para comparar solo fechas

    return fichas.map(ficha => {
        const fechaContacto = ajustarHoraPorDefecto(ficha.proximo_contacto);

        if (isNaN(fechaContacto)) {
            console.warn(`Fecha inválida en ficha: ${ficha.proximo_contacto}`);
            return { ...ficha, estado: 'inválido' };
        }

        const estado = fechaContacto < hoy ? 'vencida' : 'vigente';
        return { ...ficha, estado };
    });
}

// Asignar eventos a botones y entradas si existen
if (eliminarVencidosBtn) {
    eliminarVencidosBtn.addEventListener('click', eliminarFichasVencidas);
} else {
    console.warn('El botón "Eliminar fichas vencidas" no existe en el DOM.');
}

if (guardarFechaBtn) {
    guardarFechaBtn.addEventListener('click', guardarFechaEditada);
} else {
    console.warn('El botón "Guardar fecha" no existe en el DOM.');
}

if (cerrarModalBtn) {
    cerrarModalBtn.addEventListener('click', cerrarModal);
} else {
    console.warn('El botón "Cerrar modal" no existe en el DOM.');
}

// Evento para inicializar la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await cargarFichasPendientes(); // Llamar directamente a la función para cargar las fichas
        iniciarRecargaAutomatica(); // Configurar recarga automática

        // Configurar eventos dinámicos
        if (sortBySelect) {
            sortBySelect.addEventListener('change', e => ordenarFichas(e.target.value));
        } else {
            console.warn('El selector "Ordenar por" no está disponible en el DOM.');
        }

        if (searchInput) {
            searchInput.addEventListener('input', filtrarPorTexto);
        } else {
            console.warn('El campo de búsqueda no está disponible en el DOM.');
        }
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        showModal('Error', 'Hubo un problema al cargar la aplicación. Revisa la consola para más detalles.', false);
    }
});