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

// Referencias al buscador, listado de afiliados y botones
const busquedaAfiliado = document.getElementById('busquedaAfiliado');
const listadoAfiliados = document.getElementById('listadoAfiliados');
const clearBusqueda = document.getElementById('clearBusqueda');
const botonEliminar = document.getElementById('botonEliminar');
const botonActualizar = document.getElementById('botonActualizar');
const botonGuardar = document.getElementById('botonGuardar');
const botonNuevaFicha = document.getElementById('botonNuevaFicha');
const formularioFichaContainer = document.getElementById('formularioFichaContainer');
const formularioFicha = document.getElementById('formularioFicha');

let afiliadosCargados = [];
let afiliadoSeleccionado = null;

// Función para mostrar el modal de notificación
function showModal(title, message, isSuccess = true) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    modalIcon.innerHTML = isSuccess
        ? `<svg class="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`
        : `<svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;

    modal.classList.remove('hidden'); // Mostrar modal
}

// Función para mostrar el modal de confirmación
function showConfirmModal(title, message, onConfirm) {
    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    confirmModal.classList.remove('hidden');

    confirmActionButton.onclick = () => {
        confirmModal.classList.add('hidden');
        onConfirm();
    };

    cancelConfirmButton.onclick = () => {
        confirmModal.classList.add('hidden');
    };
}

// Ocultar el modal al hacer clic en el botón de cerrar
closeModalButton.addEventListener('click', () => {
    modal.classList.add('hidden');
});

// Inicializar el contenido de la aplicación
async function inicializarApp() {
    try {
        // Aquí podrías cargar datos iniciales, como afiliados o fichas, si es necesario.
        console.log("Aplicación inicializada correctamente.");
    } catch (error) {
        console.error('Error durante la inicialización de la aplicación:', error);
        showModal('Error', 'Hubo un problema al cargar la aplicación.', false);
    }
}

// Función para obtener parámetros desde la URL
function obtenerParametrosDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const afiliadoId = params.get('afiliadoId');
    console.log('ID obtenido de la URL:', afiliadoId); // Log para verificar el ID
    return {
        afiliadoId,
        abrirFicha: params.get('abrirFicha'),
    };
}


// Función para cargar los afiliados
async function cargarAfiliados() {
    try {
        afiliadosCargados = await window.electronAPI.invoke('get-all-affiliates');
        afiliadosCargados.sort((a, b) => a.apellido.localeCompare(b.apellido));

        // No mostramos el listado automáticamente
        mostrarListadoAfiliados(''); // Solo carga datos, no muestra el listado
        listadoAfiliados.style.display = 'none'; // Aseguramos que permanezca oculto
    } catch (error) {
        console.error('Error al cargar los hermanos:', error);
        showModal('Error', 'Error al cargar los hermanos. Revisa la consola para más detalles.', false);
    }
}

// Función para inicializar la página con datos del afiliado a editar
async function inicializarEdicionPaciente() {
    const { afiliadoId, abrirFicha } = obtenerParametrosDesdeURL(); // Detectar el parámetro "abrirFicha"

    if (!afiliadoId) {
        console.log('No se encontró el parámetro afiliadoId en la URL.');
        return;
    }

    try {
        const afiliado = await window.electronAPI.invoke('get-affiliate-by-id', parseInt(afiliadoId));

        if (!afiliado) {
            showModal('Error', 'El hermano no fue encontrado.');
            return;
        }

        // Rellenar la barra de búsqueda y los campos del formulario
        busquedaAfiliado.value = `${afiliado.apellido}, ${afiliado.nombre}`;
        clearBusqueda.style.display = 'block'; // Mostrar el botón "X"

        afiliadoSeleccionado = afiliado;

        // Llenar los campos del formulario
        document.getElementById('apellido').value = afiliado.apellido || '';
        document.getElementById('nombre').value = afiliado.nombre || '';
        document.getElementById('direccion').value = afiliado.direccion || '';
        document.getElementById('codigoPostal').value = afiliado.codigo_postal || '';
        document.getElementById('localidad').value = afiliado.localidad || '';
        document.getElementById('provincia').value = afiliado.provincia || '';
        document.getElementById('fechaNacimiento').value = afiliado.fecha_nacimiento || '';
        document.getElementById('sexo').value = afiliado.sexo || '';
        document.getElementById('obraSocial').value = afiliado.obra_social || '';
        document.getElementById('telefono').value = afiliado.telefono || '';
        document.getElementById('grupoSanguineo').value = afiliado.grupo_sanguineo || '';
        document.getElementById('estadoCivil').value = afiliado.estado_civil || '';
        document.getElementById('pareja').value = afiliado.pareja || '';
        document.getElementById('hijo1').value = afiliado.hijo1 || '';
        document.getElementById('hijo2').value = afiliado.hijo2 || '';
        document.getElementById('hijo3').value = afiliado.hijo3 || '';
        document.getElementById('contactoEmergencia').value = afiliado.contacto_emergencia || '';
        document.getElementById('numAfiliado').value = afiliado.num_afiliado || '';

        // Mostrar los botones correspondientes
        botonGuardar.classList.add('hidden');
        botonEliminar.classList.remove('hidden');
        botonActualizar.classList.remove('hidden');
        botonNuevaFicha.classList.remove('hidden'); // Asegúrate de que el botón "Nueva Ficha" esté visible

        // Si el parámetro "abrirFicha" está presente, abre el formulario de fichas automáticamente
        if (abrirFicha === 'true') {
            formularioFichaContainer.classList.remove('hidden');
            formularioFicha.reset(); // Reinicia el formulario de fichas
            botonNuevaFicha.textContent = 'Cerrar Ficha';
        } else {
            formularioFichaContainer.classList.add('hidden');
            botonNuevaFicha.textContent = 'Nueva Ficha';
        }
    } catch (error) {
        console.error('Error al inicializar la edición del hermano:', error);
        showModal('Error', 'Error al cargar los datos del hermano.');
    }
}

// Función para mostrar el listado filtrado
function mostrarListadoAfiliados(filtro = '') {
    listadoAfiliados.innerHTML = '';

    const afiliadosFiltrados = afiliadosCargados.filter((afiliado) =>
        `${afiliado.apellido}, ${afiliado.nombre}`.toLowerCase().includes(filtro.toLowerCase())
    );

    afiliadosFiltrados.forEach((afiliado) => {
        const li = document.createElement('li');
        li.textContent = `${afiliado.apellido}, ${afiliado.nombre}`;
        li.className = 'px-3 py-2 hover:bg-gray-100 cursor-pointer';
        li.addEventListener('click', () => seleccionarAfiliado(afiliado));
        listadoAfiliados.appendChild(li);
    });

    listadoAfiliados.style.display = afiliadosFiltrados.length > 0 ? 'block' : 'none';
}

async function seleccionarAfiliado(afiliado) {
    try {
        console.log('hermano seleccionado:', afiliado); // Verifica los datos
        const afiliadoId = afiliado.afiliado_id || afiliado.id; // Asegúrate de capturar correctamente el ID
        if (!afiliadoId) {
            throw new Error('El hermano no tiene un ID válido.');
        }

        const datosAfiliado = await window.electronAPI.invoke('get-affiliate-by-id', afiliadoId);
        console.log('Datos del hermano obtenidos:', datosAfiliado); // Verifica los datos obtenidos

        // Asignar valores a los campos del formulario
        busquedaAfiliado.value = `${afiliado.apellido}, ${afiliado.nombre}`;
        clearBusqueda.style.display = 'block';
        listadoAfiliados.style.display = 'none';

        afiliadoSeleccionado = datosAfiliado;

        // Mostrar los botones de acciones relevantes
        botonGuardar.classList.add('hidden');
        botonEliminar.classList.remove('hidden');
        botonActualizar.classList.remove('hidden');
        botonNuevaFicha.classList.remove('hidden');

        // Ocultar el formulario de fichas si estaba abierto y restablecer el botón "Nueva Ficha"
        formularioFichaContainer.classList.add('hidden');
        formularioFicha.reset();
        botonNuevaFicha.textContent = 'Nueva Ficha';

        // Asignar valores específicos a los campos
        document.getElementById('apellido').value = datosAfiliado.apellido || '';
        document.getElementById('nombre').value = datosAfiliado.nombre || '';
        document.getElementById('direccion').value = datosAfiliado.direccion || '';
        document.getElementById('codigoPostal').value = datosAfiliado.codigo_postal || '';
        document.getElementById('localidad').value = datosAfiliado.localidad || '';
        document.getElementById('provincia').value = datosAfiliado.provincia || '';
        document.getElementById('fechaNacimiento').value = datosAfiliado.fecha_nacimiento
            ? new Date(datosAfiliado.fecha_nacimiento).toISOString().split('T')[0]
            : '';
        document.getElementById('sexo').value = datosAfiliado.sexo || '';
        document.getElementById('obraSocial').value = datosAfiliado.obra_social || '';
        document.getElementById('telefono').value = datosAfiliado.telefono || '';
        document.getElementById('grupoSanguineo').value = datosAfiliado.grupo_sanguineo || '';
        document.getElementById('estadoCivil').value = datosAfiliado.estado_civil || '';
        document.getElementById('pareja').value = datosAfiliado.pareja || '';
        document.getElementById('hijo1').value = datosAfiliado.hijo1 || '';
        document.getElementById('hijo2').value = datosAfiliado.hijo2 || '';
        document.getElementById('hijo3').value = datosAfiliado.hijo3 || '';
        document.getElementById('contactoEmergencia').value = datosAfiliado.contacto_emergencia || '';
        document.getElementById('numAfiliado').value = datosAfiliado.num_afiliado || '';
    } catch (error) {
        console.error('Error al seleccionar hermano:', error.message || error);
        showModal('Error', 'No se pudieron obtener los datos completos del hermano.', false);
    }
}

// Función para manejar la apertura del formulario de fichas
botonNuevaFicha.addEventListener('click', (event) => {
    event.preventDefault(); // Evita cualquier comportamiento predeterminado

    if (formularioFichaContainer.classList.contains('hidden')) {
        // Mostrar el formulario de fichas
        formularioFichaContainer.classList.remove('hidden');
        formularioFicha.reset(); // Reiniciar el formulario para nuevas fichas
        botonNuevaFicha.textContent = 'Cerrar Ficha';
    } else {
        // Ocultar el formulario de fichas
        formularioFichaContainer.classList.add('hidden');
        botonNuevaFicha.textContent = 'Nueva Ficha';
    }
});

// Función para eliminar afiliado
async function eliminarAfiliadoSeleccionado() {
    if (!afiliadoSeleccionado) {
        showModal('Error', 'No hay ningún hermano seleccionado para eliminar.', false);
        return;
    }

    showConfirmModal(
        'Confirmación de Eliminación',
        `¿Estás seguro de que deseas eliminar al hermano ${afiliadoSeleccionado.apellido}, ${afiliadoSeleccionado.nombre}?`,
        async () => {
            try {
                await window.electronAPI.invoke('delete-affiliate-and-records', afiliadoSeleccionado.id);

                showModal('¡Éxito!', 'El hermano ha sido eliminado correctamente.', true);

                // Limpiar selección, formulario y barra de búsqueda
                limpiarBusqueda();

                // Mostrar botón de guardar afiliado y ocultar los otros botones
                botonGuardar.classList.remove('hidden');
                botonEliminar.classList.add('hidden');
                botonActualizar.classList.add('hidden');

                // Recargar afiliados y actualizar la lista
                await cargarAfiliados();
                mostrarListadoAfiliados();
            } catch (error) {
                console.error('Error al eliminar hermano:', error);
                showModal('Error', error.message || 'No se pudo eliminar el hermano. Intenta nuevamente.', false);
            }
        }
    );
}

// Función para actualizar afiliado
async function actualizarAfiliado() {
    if (!afiliadoSeleccionado) {
        showModal('Error', 'No hay ningún hermano seleccionado para actualizar.', false);
        return;
    }

    const affiliateData = {
        apellido: document.getElementById('apellido').value.trim(),
        nombre: document.getElementById('nombre').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        codigoPostal: document.getElementById('codigoPostal').value.trim(),
        localidad: document.getElementById('localidad').value.trim(),
        provincia: document.getElementById('provincia').value.trim(),
        fechaNacimiento: document.getElementById('fechaNacimiento').value.trim(),
        sexo: document.getElementById('sexo').value.trim(),
        obraSocial: document.getElementById('obraSocial').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        grupoSanguineo: document.getElementById('grupoSanguineo').value.trim(),
        estadoCivil: document.getElementById('estadoCivil').value.trim(),
        pareja: document.getElementById('pareja').value.trim(),
        hijo1: document.getElementById('hijo1').value.trim(),
        hijo2: document.getElementById('hijo2').value.trim(),
        hijo3: document.getElementById('hijo3').value.trim(),
        contactoEmergencia: document.getElementById('contactoEmergencia').value.trim(),
        numAfiliado: document.getElementById('numAfiliado').value.trim(),
    };

    if (!affiliateData.apellido || !affiliateData.nombre || !affiliateData.direccion || !affiliateData.codigoPostal) {
        showModal('Error', 'Por favor, completa todos los campos obligatorios.', false);
        return;
    }

    try {
        await window.electronAPI.updateAffiliate(
            afiliadoSeleccionado.id,
            affiliateData
        );

        showModal('¡Éxito!', 'El hermano ha sido actualizado correctamente.', true);

        // Actualizar el afiliado en la lista global
        afiliadosCargados = afiliadosCargados.map((afiliado) =>
            afiliado.id === afiliadoSeleccionado.id
                ? { ...afiliado, ...affiliateData }
                : afiliado
        );

        // Actualizar el listado desplegable
        await cargarAfiliados();
        mostrarListadoAfiliados(busquedaAfiliado.value);

        // Actualizar el campo de búsqueda
        busquedaAfiliado.value = `${affiliateData.apellido}, ${affiliateData.nombre}`;
    } catch (error) {
        console.error('Error al actualizar hermano:', error);
        showModal('Error', error.message || 'No se pudo actualizar el hermano.', false);
    }
}

// Función para limpiar la búsqueda y el formulario
function limpiarBusqueda() {
    busquedaAfiliado.value = ''; // Limpiar el valor de la barra de búsqueda
    clearBusqueda.style.display = 'none'; // Ocultar el botón "X"
    listadoAfiliados.style.display = 'none'; // Ocultar el listado de resultados
    document.getElementById('formularioPaciente').reset(); // Limpiar formulario de afiliados
    formularioFichaContainer.classList.add('hidden'); // Ocultar el formulario de fichas
    afiliadoSeleccionado = null; // Reiniciar selección de afiliado

    // Mostrar solo el botón de guardar afiliado
    botonGuardar.classList.remove('hidden');
    botonEliminar.classList.add('hidden');
    botonActualizar.classList.add('hidden');
    botonNuevaFicha.classList.add('hidden');
}

// Manejo del formulario para crear un nuevo afiliado
document.getElementById('formularioPaciente').addEventListener('submit', async (event) => {
    event.preventDefault();

    const afiliado = {
        apellido: document.getElementById('apellido').value.trim(),
        nombre: document.getElementById('nombre').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        codigoPostal: document.getElementById('codigoPostal').value.trim(),
        localidad: document.getElementById('localidad').value.trim(),
        provincia: document.getElementById('provincia').value.trim(),
        fechaNacimiento: document.getElementById('fechaNacimiento').value.trim(),
        sexo: document.getElementById('sexo').value.trim(),
        obraSocial: document.getElementById('obraSocial').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        grupoSanguineo: document.getElementById('grupoSanguineo').value.trim(),
        estadoCivil: document.getElementById('estadoCivil').value.trim(),
        pareja: document.getElementById('pareja').value.trim(),
        hijo1: document.getElementById('hijo1').value.trim(),
        hijo2: document.getElementById('hijo2').value.trim(),
        hijo3: document.getElementById('hijo3').value.trim(),
        contactoEmergencia: document.getElementById('contactoEmergencia').value.trim(),
        numAfiliado: document.getElementById('numAfiliado').value.trim(),
    };

    // Validar campos obligatorios
    if (!afiliado.apellido || !afiliado.nombre || !afiliado.direccion || !afiliado.codigoPostal) {
        showModal('Error', 'Por favor, completa todos los campos obligatorios.', false);
        return;
    }

    try {
        await window.electronAPI.invoke('create-affiliate', afiliado);
        showModal('¡Éxito!', 'El hermano ha sido guardado correctamente.', true);

        // Limpiar el formulario y actualizar la lista de afiliados
        document.getElementById('formularioPaciente').reset();
        listadoAfiliados.style.display = 'none';
        await cargarAfiliados();
    } catch (error) {
        console.error('Error al guardar el hermano:', error);
        showModal('Error', error.message || 'No se pudo guardar el hermano. Intenta nuevamente.', false);
    }
});

// Función para manejar el envío del formulario de fichas
formularioFicha.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevenir comportamiento predeterminado

    if (!afiliadoSeleccionado) {
        showModal('Error', 'No se pudo guardar la ficha. Selecciona un hermano primero.', false);
        return;
    }

    // Obtener los valores de los campos del formulario de fichas
    const ficha = {
        ultimoContacto: document.getElementById('ultimoContacto').value.trim(),
        fechaUltimoEvento: document.getElementById('fechaUltimoEvento').value.trim(),
        proximoContacto: document.getElementById('proximoContacto').value.trim(),
        antecedentes: document.getElementById('antecedentes').value.trim(),
        hecho: document.getElementById('hecho').value.trim(),
        otrosDatos: document.getElementById('otrosDatos').value.trim(),
        notas: document.getElementById('notas').value.trim(),
        detalle: document.getElementById('detalle').value.trim(),
    };

    // Verificar si al menos un campo tiene un valor
    const algunCampoLleno = Object.values(ficha).some((valor) => valor !== '');

    if (!algunCampoLleno) {
        showModal('Error', 'Debes completar al menos un campo para guardar la ficha.', false);
        return;
    }

    try {
        await window.electronAPI.invoke('create-affiliate-record', afiliadoSeleccionado.id, ficha);
        showModal('¡Éxito!', 'La ficha ha sido guardada correctamente.', true);
        formularioFicha.reset(); // Reiniciar el formulario de fichas
        formularioFichaContainer.classList.add('hidden'); // Ocultar formulario tras guardar
    } catch (error) {
        console.error('Error al guardar la ficha:', error);
        showModal('Error', error.message || 'No se pudo guardar la ficha. Intenta nuevamente.', false);
    }
});

// Eventos
clearBusqueda.addEventListener('click', limpiarBusqueda);
botonEliminar.addEventListener('click', eliminarAfiliadoSeleccionado);
botonActualizar.addEventListener('click', actualizarAfiliado); // Asociar evento

// Evento para manejar la entrada en la barra de búsqueda
busquedaAfiliado.addEventListener('input', () => {
    if (busquedaAfiliado.value.trim() === '') {
        limpiarBusqueda(); // Si está vacío, limpiar la búsqueda
    } else {
        clearBusqueda.style.display = 'block'; // Mostrar botón "X" si hay texto
        mostrarListadoAfiliados(busquedaAfiliado.value); // Actualizar resultados
    }
});
busquedaAfiliado.addEventListener('focus', () => {
    mostrarListadoAfiliados(busquedaAfiliado.value);
    listadoAfiliados.style.display = 'block'; // Mostrar listado al enfocar
});

// Evento para cerrar el listado al hacer clic fuera
document.addEventListener('click', (event) => {
    if (!busquedaAfiliado.contains(event.target) && !listadoAfiliados.contains(event.target)) {
        listadoAfiliados.style.display = 'none'; // Ocultar el listado si se hace clic fuera
    }
});

// Inicializar eventos y cargar afiliados al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    await cargarAfiliados();
    await inicializarEdicionPaciente(); // Detecta si hay datos a editar
});