// Referencias a elementos de la interfaz
const tablaPacientes = document.getElementById('tablaPacientes');
const busquedaAfiliado = document.getElementById('busquedaAfiliado');
const clearBusqueda = document.getElementById('clearBusqueda');

let afiliadosGlobal = []; // Variable global para almacenar los datos
let afiliadosFiltrados = []; // Lista filtrada para renderizado
let ordenActual = {
    columna: 'apellido',
    ascendente: true, // 'true' para ascendente, 'false' para descendente
};

// Función para formatear datos (cambiar valores nulos o vacíos por "-")
function formatearDato(dato) {
    return dato === null || dato === undefined || dato.trim() === '' ? '-' : dato;
}

// Función para formatear una fecha de yyyy-mm-dd a dd/mm/yyyy
function formatearFecha(fecha) {
    if (!fecha || fecha === '-' || fecha.trim() === '' || fecha.toLowerCase().includes('undefined')) {
        return '-'; // Manejo de fechas inválidas
    }
    const [year, month, day] = fecha.split('-');
    if (!year || !month || !day) return '-'; // Validación de formato
    return `${day}/${month}/${year}`;
}

// Función para cargar afiliados y llenar la tabla
async function cargarAfiliados() {
    try {
        const afiliados = await window.electronAPI.invoke('get-all-affiliates'); // Cambiado a 'get-all-affiliates'
        afiliadosGlobal = afiliados || [];
        afiliadosFiltrados = [...afiliadosGlobal]; // Inicializar los filtrados con todos los datos

        // Por defecto, ordenar por apellido ascendente
        ordenarTabla('apellido', true);
    } catch (error) {
        console.error('Error al cargar afiliados:', error);
        alert('Hubo un problema al cargar los datos. Revisa la consola para más detalles.');
    }
}

// Función para ordenar la tabla
function ordenarTabla(columna, ascendente) {
    afiliadosFiltrados.sort((a, b) => {
        const valorA = a[columna] || ''; // Manejar valores nulos o indefinidos
        const valorB = b[columna] || '';

        if (typeof valorA === 'string' && typeof valorB === 'string') {
            return ascendente
                ? valorA.localeCompare(valorB)
                : valorB.localeCompare(valorA);
        }

        return ascendente ? valorA - valorB : valorB - valorA; // Orden numérico
    });

    renderizarTabla();
    actualizarFlechasOrdenamiento(columna, ascendente);
}

// Función para renderizar la tabla
function renderizarTabla() {
    // Limpiar tabla
    tablaPacientes.innerHTML = '';

    if (afiliadosFiltrados.length === 0) {
        tablaPacientes.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    No hay resultados para mostrar.
                </td>
            </tr>`;
        return;
    }

    afiliadosFiltrados.forEach(afiliado => {
        const row = document.createElement('tr');
        row.classList.add('hover:bg-gray-100', 'cursor-pointer');

        row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">${formatearDato(afiliado.nombre)} ${formatearDato(afiliado.apellido)}</td>
        <td class="px-6 py-4 whitespace-nowrap">${formatearDato(afiliado.obra_social)}</td>
        <td class="px-6 py-4 whitespace-nowrap">${formatearFecha(afiliado.ultimo_contacto)}</td>
        <td class="px-6 py-4 whitespace-nowrap">${formatearFecha(afiliado.proximo_contacto)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-blue-500">
            <a href="ver-paciente.html?id=${afiliado.afiliado_id}" class="hover:underline">Ver Detalle</a>
        </td>`;
        tablaPacientes.appendChild(row);
    });
}

// Función para manejar el clic en los encabezados de la tabla
function manejarOrdenamiento(event) {
    const columna = event.target.getAttribute('data-columna');
    if (!columna) return;

    const ascendente = ordenActual.columna === columna ? !ordenActual.ascendente : true;
    ordenActual = { columna, ascendente };

    ordenarTabla(columna, ascendente);
}

// Función para actualizar las flechas de ordenamiento
function actualizarFlechasOrdenamiento(columna, ascendente) {
    document.querySelectorAll('th[data-columna]').forEach((th) => {
        const span = th.querySelector('.orden-indicador');
        if (span) span.textContent = ''; // Limpiar todas las flechas
    });

    const th = document.querySelector(`th[data-columna="${columna}"]`);
    const span = th.querySelector('.orden-indicador');
    if (span) span.textContent = ascendente ? '↑' : '↓';
}

// Función para filtrar afiliados por la barra de búsqueda
function filtrarAfiliados(texto) {
    const filtro = texto.toLowerCase().trim();

    afiliadosFiltrados = afiliadosGlobal.filter(afiliado => {
        const nombreCompleto = `${afiliado.nombre} ${afiliado.apellido}`.toLowerCase();
        return nombreCompleto.includes(filtro);
    });

    renderizarTabla();
}

// Evento para manejar la barra de búsqueda
busquedaAfiliado.addEventListener('input', () => {
    const texto = busquedaAfiliado.value;

    if (texto.trim() === '') {
        clearBusqueda.classList.add('hidden'); // Ocultar el botón "✕"
        afiliadosFiltrados = [...afiliadosGlobal]; // Restablecer la lista completa
    } else {
        clearBusqueda.classList.remove('hidden'); // Mostrar el botón "✕"
        filtrarAfiliados(texto); // Filtrar resultados
    }

    renderizarTabla();
});

// Evento para limpiar la barra de búsqueda
clearBusqueda.addEventListener('click', () => {
    busquedaAfiliado.value = '';
    clearBusqueda.classList.add('hidden');
    afiliadosFiltrados = [...afiliadosGlobal]; // Restablecer la lista completa
    renderizarTabla();
});

// Evento para agregar interactividad a los encabezados
function configurarOrdenamiento() {
    document.querySelectorAll('th[data-columna]').forEach(th => {
        const span = document.createElement('span');
        span.classList.add('orden-indicador', 'ml-2'); // Indicador para las flechas
        th.appendChild(span);

        th.addEventListener('click', manejarOrdenamiento);
    });
}

// Llamar a las funciones al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await cargarAfiliados();
        configurarOrdenamiento();
    } catch (error) {
        console.error('Error al inicializar la página:', error);
        alert('Error: No se pudieron cargar los datos. Verifica la consola para más detalles.');
    }
});