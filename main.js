const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { autoUpdater } = require('electron-updater'); // Importa autoUpdater

// Ruta a la base de datos
const dbPath = path.join(app.getPath('userData'), 'usuarios.db');

// Configuración de la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    inicializarBaseDeDatos();
  }
});

// Crear tablas si no existen
function inicializarBaseDeDatos() {
  db.run(
    `CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS afiliados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      apellido TEXT NOT NULL,
      nombre TEXT NOT NULL,
      direccion TEXT NOT NULL,
      codigo_postal TEXT NOT NULL,
      localidad TEXT NOT NULL,
      provincia TEXT NOT NULL,
      fecha_nacimiento TEXT NOT NULL,
      sexo TEXT NOT NULL,
      obra_social TEXT NOT NULL,
      telefono TEXT NOT NULL,
      grupo_sanguineo TEXT NOT NULL,
      estado_civil TEXT NOT NULL,
      pareja TEXT,
      hijo1 TEXT,
      hijo2 TEXT,
      hijo3 TEXT,
      contacto_emergencia TEXT NOT NULL,
      num_afiliado TEXT NOT NULL
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS fichas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      afiliado_id INTEGER NOT NULL,
      ultimo_contacto TEXT NOT NULL,
      fecha_ultimo_evento TEXT NOT NULL,
      proximo_contacto TEXT NOT NULL,
      antecedentes TEXT,
      hecho TEXT,
      otros_datos TEXT,
      notas TEXT,
      detalle TEXT,
      contactado INTEGER DEFAULT 0,
      FOREIGN KEY (afiliado_id) REFERENCES afiliados (id)
    )`
  );

  // Crear usuario admin si no existe
  db.get('SELECT COUNT(*) AS count FROM usuarios', async (err, row) => {
    if (err) {
      console.error('Error al verificar usuarios:', err.message);
    } else if (row.count === 0) {
      console.log('Creando usuario admin...');
      const hashedPassword = await bcrypt.hash('123', 10);
      db.run(
        'INSERT INTO usuarios (username, password) VALUES (?, ?)',
        ['admin', hashedPassword]
      );
    }
  });
}

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    fullscreen: false,
    frame: true,
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false, // Mejor para seguridad
      nodeIntegration: false,
    },
  });

  mainWindow.maximize();
  mainWindow.loadFile(path.join(__dirname, 'renderer/login.html'));

  // Inicia la búsqueda de actualizaciones
  autoUpdater.checkForUpdatesAndNotify();
});

// Emitir evento cuando haya una actualización disponible
autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});

// Emitir evento cuando la actualización esté descargada
autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});

// Manejar reinicio
ipcMain.handle('restart-app', () => {
  autoUpdater.quitAndInstall();
});

// **Manejadores IPC**
// Iniciar sesión
ipcMain.handle('login', async (event, { username, password }) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM usuarios WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('Error al buscar usuario:', err.message);
        reject(new Error('Error del servidor.'));
      } else if (!user || !(await bcrypt.compare(password, user.password))) {
        reject(new Error('Usuario o contraseña incorrectos.'));
      } else {
        const token = jwt.sign({ id: user.id }, 'mi_secreto', { expiresIn: '1h' });
        resolve({ message: 'Inicio de sesión exitoso.', token });
      }
    });
  });
});

ipcMain.handle('get-logged-user', async (event) => {
  // Esto debería devolver el usuario actualmente logueado. Aquí lo configuré estático como ejemplo.
  // Asegúrate de configurar correctamente el manejo del usuario autenticado.
  return { id: 1, username: 'admin' }; // Asegúrate de devolver los datos reales del usuario logueado.
});

// Resetear usuario y contraseña
ipcMain.handle('reset-credentials', async () => {
  const defaultUsername = 'admin';
  const defaultPassword = '123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  return new Promise((resolve, reject) => {
      db.run(
          'UPDATE usuarios SET username = ?, password = ? WHERE id = 1', // Asume que el ID del usuario admin es 1
          [defaultUsername, hashedPassword],
          function (err) {
              if (err) {
                  console.error('Error al resetear credenciales:', err.message);
                  reject(new Error('No se pudo resetear las credenciales.'));
              } else if (this.changes === 0) {
                  reject(new Error('No se encontró un usuario para resetear.'));
              } else {
                  resolve({ message: 'Credenciales reseteadas correctamente.' });
              }
          }
      );
  });
});

// Actualizar usuario y contraseña
ipcMain.handle('update-user-config', async (event, { userId, username, currentPassword, newPassword }) => {
  if (!userId) {
    throw new Error('El ID del usuario es obligatorio.');
  }

  if (!username || !currentPassword) {
    throw new Error('El nombre de usuario y la contraseña actual son obligatorios.');
  }

  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM usuarios WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) throw new Error('Usuario no encontrado.');

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) throw new Error('La contraseña actual es incorrecta.');

    // Construir las actualizaciones
    const updates = [];
    const params = [];

    if (username !== user.username) {
      updates.push('username = ?');
      params.push(username);
    }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      throw new Error('No se realizaron cambios.');
    }

    params.push(userId);

    await new Promise((resolve, reject) => {
      const sql = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve();
      });
    });

    return { message: 'Datos actualizados correctamente.' };
  } catch (error) {
    console.error('Error al actualizar configuración del usuario:', error.message);
    throw new Error(error.message || 'Error del servidor.');
  }
});

// Crear afiliado
ipcMain.handle('create-affiliate', async (event, affiliateData) => {
  const {
    apellido,
    nombre,
    direccion,
    codigoPostal,
    localidad,
    provincia,
    fechaNacimiento,
    sexo,
    obraSocial,
    telefono,
    grupoSanguineo,
    estadoCivil,
    pareja,
    hijo1,
    hijo2,
    hijo3,
    contactoEmergencia,
    numAfiliado,
  } = affiliateData;

  const sql = `INSERT INTO afiliados (
    apellido, nombre, direccion, codigo_postal, localidad, provincia,
    fecha_nacimiento, sexo, obra_social, telefono, grupo_sanguineo,
    estado_civil, pareja, hijo1, hijo2, hijo3, contacto_emergencia, num_afiliado
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  return new Promise((resolve, reject) => {
    db.run(
      sql,
      [
        apellido, nombre, direccion, codigoPostal, localidad, provincia,
        fechaNacimiento, sexo, obraSocial, telefono, grupoSanguineo, estadoCivil,
        pareja, hijo1, hijo2, hijo3, contactoEmergencia, numAfiliado,
      ],
      function (err) {
        if (err) {
          console.error('Error al guardar el afiliado:', err.message);
          reject({ message: 'Error al guardar el afiliado.' });
        } else {
          resolve({ message: 'Afiliado creado exitosamente.', id: this.lastID });
        }
      }
    );
  });
});

// Obtener todos los afiliados
ipcMain.handle('get-all-affiliates', async () => {
  const sql = `
    SELECT 
      a.id AS afiliado_id,
      a.nombre,
      a.apellido,
      a.obra_social,
      COALESCE(MAX(f.ultimo_contacto), '-') AS ultimo_contacto,
      COALESCE(MAX(f.proximo_contacto), '-') AS proximo_contacto
    FROM 
      afiliados a
    LEFT JOIN 
      fichas f
    ON 
      a.id = f.afiliado_id
    GROUP BY 
      a.id
    ORDER BY 
      a.apellido ASC, 
      a.nombre ASC;
  `;

  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Error al obtener afiliados:', err.message);
        reject(new Error('Error al obtener la lista de afiliados.'));
      } else {
        resolve(rows); // Devuelve la lista con los afiliados y sus datos
      }
    });
  });
});

// Obtener afiliado por ID
ipcMain.handle('get-affiliate-by-id', async (event, id) => {
  console.log('ID recibido en get-affiliate-by-id:', id); // Verifica el ID recibido

  const sql = `SELECT * FROM afiliados WHERE id = ?`;
  return new Promise((resolve, reject) => {
      db.get(sql, [id], (err, row) => {
          if (err) {
              console.error('Error al obtener el afiliado:', err.message);
              reject(new Error('Error al buscar el afiliado en la base de datos.'));
          } else if (!row) {
              console.error(`Afiliado con ID ${id} no encontrado.`);
              reject(new Error('Afiliado no encontrado.'));
          } else {
              console.log('Afiliado encontrado:', row); // Verifica el resultado
              resolve(row);
          }
      });
  });
});


// Eliminar afiliado y sus fichas por ID
ipcMain.handle('delete-affiliate-and-records', async (event, id) => {
  const deleteFichasSql = `DELETE FROM fichas WHERE afiliado_id = ?`;
  const deleteAfiliadoSql = `DELETE FROM afiliados WHERE id = ?`;

  return new Promise((resolve, reject) => {
    // Eliminar fichas del afiliado
    db.run(deleteFichasSql, [id], function (err) {
      if (err) {
        console.error('Error al eliminar las fichas:', err.message);
        return reject({ message: 'Error al eliminar las fichas del afiliado.' });
      }

      // Eliminar el afiliado
      db.run(deleteAfiliadoSql, [id], function (err) {
        if (err) {
          console.error('Error al eliminar el afiliado:', err.message);
          return reject({ message: 'Error al eliminar el afiliado.' });
        }

        if (this.changes === 0) {
          return reject({ message: 'Afiliado no encontrado.' });
        }

        resolve({ message: 'Afiliado y sus fichas eliminados exitosamente.' });
      });
    });
  });
});

// Actualizar afiliado
ipcMain.handle('update-affiliate', async (event, id, affiliateData) => {
  if (!id || !affiliateData) {
      console.error('Faltan parámetros: id o affiliateData son undefined.');
      throw new Error('Faltan parámetros necesarios para actualizar el afiliado.');
  }

  console.log('ID:', id); // Depuración
  console.log('Datos del afiliado:', affiliateData); // Depuración

  const {
      apellido,
      nombre,
      direccion,
      codigoPostal,
      localidad,
      provincia,
      fechaNacimiento,
      sexo,
      obraSocial,
      telefono,
      grupoSanguineo,
      estadoCivil,
      pareja,
      hijo1,
      hijo2,
      hijo3,
      contactoEmergencia,
      numAfiliado,
  } = affiliateData;

  if (
      !apellido ||
      !nombre ||
      !direccion ||
      !codigoPostal ||
      !localidad ||
      !provincia ||
      !fechaNacimiento ||
      !sexo ||
      !obraSocial ||
      !telefono ||
      !grupoSanguineo ||
      !estadoCivil ||
      !contactoEmergencia ||
      !numAfiliado
  ) {
      throw new Error('Todos los campos obligatorios deben estar completos.');
  }

  const sql = `UPDATE afiliados SET
      apellido = ?, nombre = ?, direccion = ?, codigo_postal = ?, localidad = ?, provincia = ?,
      fecha_nacimiento = ?, sexo = ?, obra_social = ?, telefono = ?, grupo_sanguineo = ?, estado_civil = ?,
      pareja = ?, hijo1 = ?, hijo2 = ?, hijo3 = ?, contacto_emergencia = ?, num_afiliado = ?
  WHERE id = ?`;

  return new Promise((resolve, reject) => {
      db.run(
          sql,
          [
              apellido,
              nombre,
              direccion,
              codigoPostal,
              localidad,
              provincia,
              fechaNacimiento,
              sexo,
              obraSocial,
              telefono,
              grupoSanguineo,
              estadoCivil,
              pareja,
              hijo1,
              hijo2,
              hijo3,
              contactoEmergencia,
              numAfiliado,
              id,
          ],
          function (err) {
              if (err) {
                  console.error('Error al actualizar el afiliado:', err.message);
                  return reject(new Error('Error al actualizar el afiliado.'));
              }

              if (this.changes === 0) {
                  return reject(new Error('Afiliado no encontrado.'));
              }

              resolve({ message: 'Afiliado actualizado exitosamente.' });
          }
      );
  });
});

// Crear nueva ficha a un afiliado
ipcMain.handle('create-affiliate-record', async (event, id, recordData) => {
  const {
    ultimoContacto,
    fechaUltimoEvento,
    proximoContacto,
    antecedentes,
    hecho,
    otrosDatos,
    notas,
    detalle,
  } = recordData;

  const sql = `
    INSERT INTO fichas (
      afiliado_id, ultimo_contacto, fecha_ultimo_evento, proximo_contacto,
      antecedentes, hecho, otros_datos, notas, detalle
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  return new Promise((resolve, reject) => {
    db.run(
      sql,
      [
        id,
        ultimoContacto,
        fechaUltimoEvento,
        proximoContacto,
        antecedentes,
        hecho,
        otrosDatos,
        notas,
        detalle,
      ],
      function (err) {
        if (err) {
          console.error('Error al crear la ficha:', err.message);
          return reject(new Error('Error al crear la ficha.'));
        }

        resolve({ message: 'Ficha creada con éxito.', fichaId: this.lastID });
      }
    );
  });
});

// Obtener fichas por afiliado
ipcMain.handle('get-affiliate-records', async (event, afiliadoId) => {
  const sql = `SELECT * FROM fichas WHERE afiliado_id = ? ORDER BY id ASC`;

  return new Promise((resolve, reject) => {
    db.all(sql, [afiliadoId], (err, rows) => {
      if (err) {
        console.error('Error al obtener fichas:', err.message);
        return reject(new Error('Error al obtener fichas.'));
      }
      resolve(rows);
    });
  });
});

// Obtener fichas de un afiliado específico
ipcMain.handle('get-specific-affiliate-records', async (event, afiliadoId) => {
  const sql = 'SELECT * FROM fichas WHERE afiliado_id = ?';

  return new Promise((resolve, reject) => {
    db.all(sql, [afiliadoId], (err, rows) => {
      if (err) {
        console.error('Error al obtener fichas:', err.message);
        return reject(new Error('Error al obtener las fichas del afiliado.'));
      }
      resolve(rows);
    });
  });
});

// Eliminar ficha por ID
ipcMain.handle('delete-record', async (event, recordId) => {
  const sql = `DELETE FROM fichas WHERE id = ?`;

  return new Promise((resolve, reject) => {
    db.run(sql, [recordId], function (err) {
      if (err) {
        console.error('Error al eliminar la ficha:', err.message);
        return reject(new Error('Error al eliminar la ficha.'));
      }

      if (this.changes === 0) {
        return reject(new Error('Ficha no encontrada.'));
      }

      resolve({ message: 'Ficha eliminada exitosamente.' });
    });
  });
});

// Obtener todos los afiliados con sus datos y la información más reciente de sus fichas
ipcMain.handle('get-affiliates-details', async () => {
  const sql = `
    SELECT 
      a.id AS afiliado_id,
      a.nombre,
      a.apellido,
      a.obra_social,
      a.direccion,
      a.localidad,
      a.provincia,
      a.fecha_nacimiento,
      a.sexo,
      a.estado_civil,
      a.telefono,
      a.num_afiliado,
      a.grupo_sanguineo,
      a.contacto_emergencia,
      -- Información de la ficha más reciente
      f.ultimo_contacto,
      f.proximo_contacto,
      f.notas
    FROM 
      afiliados a
    LEFT JOIN 
      (
        SELECT 
          afiliado_id,
          MAX(ultimo_contacto) AS ultimo_contacto,
          proximo_contacto,
          notas
        FROM 
          fichas
        GROUP BY 
          afiliado_id
      ) f
    ON 
      a.id = f.afiliado_id
    ORDER BY 
      a.apellido ASC, 
      a.nombre ASC;
  `;

  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Error al obtener el detalle de afiliados:', err.message);
        return reject(new Error('Error al obtener el detalle de afiliados.'));
      }
      resolve(rows); // Devuelve las filas obtenidas
    });
  });
});

// Obtener todas las fichas con próximo contacto en el futuro
ipcMain.handle('get-pending-fichas', async () => {
    try {
        const sql = `
            SELECT 
                f.id AS ficha_id,
                f.afiliado_id,
                f.proximo_contacto,
                f.notas,
                a.nombre,
                a.apellido
            FROM 
                fichas f
            JOIN 
                afiliados a
            ON 
                f.afiliado_id = a.id
            WHERE 
                f.proximo_contacto >= date('now') AND f.contactado = 0
            ORDER BY 
                f.proximo_contacto ASC;
        `;
        return new Promise((resolve, reject) => {
            db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error al obtener fichas pendientes:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    } catch (error) {
        console.error('Error al manejar get-pending-fichas:', error);
        throw new Error('No se pudieron obtener las fichas pendientes.');
    }
});

// Afiliado contactado
ipcMain.handle('mark-ficha-contacted', async (event, fichaId) => {
  const sql = `UPDATE fichas SET contactado = 1 WHERE id = ?`;

  return new Promise((resolve, reject) => {
    db.run(sql, [fichaId], function (err) {
      if (err) {
        console.error('Error al marcar la ficha como contactada:', err.message);
        return reject(new Error('Error al actualizar la ficha.'));
      }

      if (this.changes === 0) {
        return reject(new Error('Ficha no encontrada.'));
      }

      resolve({ message: 'Ficha marcada como contactada exitosamente.' });
    });
  });
});

// Actualizar la fecha de próximo contacto de una ficha
ipcMain.handle('update-proximo-contacto', async (event, { fichaId, proximoContacto }) => {
  if (!proximoContacto) {
    throw new Error('El campo proximo_contacto es obligatorio.');
  }

  const sql = `UPDATE fichas SET proximo_contacto = ? WHERE id = ?`;

  return new Promise((resolve, reject) => {
    db.run(sql, [proximoContacto, fichaId], function (err) {
      if (err) {
        console.error('Error al actualizar la ficha:', err.message);
        return reject(new Error('Error al actualizar la ficha.'));
      }

      if (this.changes === 0) {
        return reject(new Error('Ficha no encontrada.'));
      }

      resolve({ message: 'Ficha actualizada correctamente.' });
    });
  });
});

app.on('window-all-closed', () => {
  try {
    db.close();
    console.log('Base de datos cerrada correctamente.');
  } catch (err) {
    console.error('Error al cerrar la base de datos:', err.message);
  }
  app.quit();
});