// === Estado y configuración ===
const API = '/api';
let currentAdmin = null;
let calendarDate = new Date();

// === Auth ===
function checkSession() {
  const session = localStorage.getItem('adminSession');
  if (session) {
    currentAdmin = JSON.parse(session);
    showApp();
  }
}

async function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  const errorEl = document.getElementById('loginError');

  if (!username || !password) {
    errorEl.textContent = 'Complete todos los campos.';
    errorEl.style.display = 'block';
    return;
  }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || 'Credenciales inválidas.';
      errorEl.style.display = 'block';
      return;
    }
    localStorage.setItem('adminSession', JSON.stringify(data.admin));
    currentAdmin = data.admin;
    errorEl.style.display = 'none';
    showApp();
  } catch {
    errorEl.textContent = 'Error de conexión.';
    errorEl.style.display = 'block';
  }
}

function doLogout() {
  localStorage.removeItem('adminSession');
  currentAdmin = null;
  document.getElementById('appLayout').classList.remove('active');
  document.getElementById('loginSection').style.display = 'flex';
}

function showApp() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('appLayout').classList.add('active');
  document.getElementById('adminName').textContent = currentAdmin.name;
  loadDashboard();
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-username': currentAdmin.username
  };
}

// === Navegación ===
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(`sec-${name}`).classList.add('active');
  document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
  const link = document.querySelector(`[data-section="${name}"]`);
  if (link) link.classList.add('active');

  if (name === 'dashboard') loadDashboard();
  if (name === 'calendar') loadCalendar();
  if (name === 'appointments') loadAppointments();
  if (name === 'clients') loadClients();
  if (name === 'services') loadServices();
  if (name === 'schedules') loadSchedules();
  if (name === 'users') loadUsers();

  if (window.innerWidth <= 768) toggleSidebar();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('active');
}

function openModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

// === Dashboard ===
async function loadDashboard() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  try {
    const res = await fetch(`${API}/admin/appointments?date=${today}`, { headers: authHeaders() });
    const appointments = await res.json();

    const confirmed = appointments.filter(a => a.status === 'confirmed').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;

    document.getElementById('statsCards').innerHTML = `
      <div class="stat-card"><h4>Turnos hoy</h4><div class="value">${confirmed}</div></div>
      <div class="stat-card"><h4>Cancelados</h4><div class="value" style="color:var(--color-error)">${cancelled}</div></div>
      <div class="stat-card"><h4>Total del día</h4><div class="value">${appointments.length}</div></div>
    `;

    const confirmedAppts = appointments.filter(a => a.status === 'confirmed');
    if (confirmedAppts.length === 0) {
      document.getElementById('todayAppointments').innerHTML = '<p style="color:var(--color-text-muted)">No hay turnos para hoy.</p>';
    } else {
      document.getElementById('todayAppointments').innerHTML = `
        <table class="data-table">
          <thead><tr><th>Hora</th><th>Cliente</th><th>Servicio</th><th>Duración</th><th>Precio</th><th>Acción</th></tr></thead>
          <tbody>${confirmedAppts.map(a => `
            <tr>
              <td>${a.start_time.slice(0,5)} - ${a.end_time.slice(0,5)}</td>
              <td>${a.client_name}</td>
              <td>${a.service_name}</td>
              <td>${a.duration_minutes} min</td>
              <td>$${Number(a.service_price).toLocaleString()}</td>
              <td><button class="btn btn-danger btn-sm" onclick="cancelAppointment('${a.id}')">Cancelar</button></td>
            </tr>
          `).join('')}</tbody>
        </table>
      `;
    }
  } catch {
    document.getElementById('todayAppointments').innerHTML = '<p style="color:var(--color-error)">Error al cargar datos.</p>';
  }
}

// === CALENDARIO / ALMANAQUE ===
async function loadCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  // Obtener primer y último día del mes
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const fromDate = firstDay.toISOString().split('T')[0];
  const toDate = lastDay.toISOString().split('T')[0];

  // Cargar turnos del mes
  let appointments = [];
  try {
    const res = await fetch(`${API}/admin/appointments?from=${fromDate}&to=${toDate}`, { headers: authHeaders() });
    appointments = await res.json();
  } catch {}

  // Agrupar por fecha
  const byDate = {};
  appointments.forEach(a => {
    const d = a.date.split('T')[0];
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(a);
  });

  // Generar calendario
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = new Date().toISOString().split('T')[0];

  let calHtml = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
      <button class="btn btn-sm" onclick="changeMonth(-1)">← Anterior</button>
      <h3 style="font-family:var(--font-display); text-transform:capitalize;">${monthName}</h3>
      <button class="btn btn-sm" onclick="changeMonth(1)">Siguiente →</button>
    </div>
    <div class="calendar-grid">
      <div class="cal-header">Dom</div><div class="cal-header">Lun</div>
      <div class="cal-header">Mar</div><div class="cal-header">Mié</div>
      <div class="cal-header">Jue</div><div class="cal-header">Vie</div>
      <div class="cal-header">Sáb</div>
  `;

  // Espacios vacíos antes del primer día
  for (let i = 0; i < startDayOfWeek; i++) {
    calHtml += '<div class="cal-day empty"></div>';
  }

  // Días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayAppts = byDate[dateStr] || [];
    const confirmedCount = dayAppts.filter(a => a.status === 'confirmed').length;
    const isToday = dateStr === today;
    const classes = `cal-day ${isToday ? 'today' : ''} ${confirmedCount > 0 ? 'has-appts' : ''}`;

    calHtml += `
      <div class="${classes}" onclick="showDayDetail('${dateStr}')">
        <span class="cal-day-num">${day}</span>
        ${confirmedCount > 0 ? `<span class="cal-badge">${confirmedCount}</span>` : ''}
      </div>
    `;
  }

  calHtml += '</div><div id="dayDetail" style="margin-top:1.5rem;"></div>';
  document.getElementById('calendarContent').innerHTML = calHtml;
}

function changeMonth(offset) {
  calendarDate.setMonth(calendarDate.getMonth() + offset);
  loadCalendar();
}

async function showDayDetail(dateStr) {
  try {
    const res = await fetch(`${API}/admin/appointments?date=${dateStr}`, { headers: authHeaders() });
    const appointments = await res.json();
    const confirmed = appointments.filter(a => a.status === 'confirmed');

    const dateFormatted = new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

    let html = `<h3 style="font-family:var(--font-display); margin-bottom:1rem; text-transform:capitalize;">📅 ${dateFormatted}</h3>`;

    if (confirmed.length === 0) {
      html += '<p style="color:var(--color-text-muted)">Sin turnos confirmados para este día.</p>';
    } else {
      html += `<table class="data-table">
        <thead><tr><th>Hora</th><th>Cliente</th><th>Tel</th><th>Servicio</th><th>Dur.</th><th>Precio</th><th>Acción</th></tr></thead>
        <tbody>${confirmed.map(a => `
          <tr>
            <td><strong>${a.start_time.slice(0,5)}</strong> - ${a.end_time.slice(0,5)}</td>
            <td>${a.client_name}</td>
            <td>${a.client_phone || '-'}</td>
            <td>${a.service_name}</td>
            <td>${a.duration_minutes} min</td>
            <td>$${Number(a.service_price).toLocaleString()}</td>
            <td><button class="btn btn-danger btn-sm" onclick="cancelAppointment('${a.id}'); showDayDetail('${dateStr}')">Cancelar</button></td>
          </tr>
        `).join('')}</tbody>
      </table>`;
    }

    document.getElementById('dayDetail').innerHTML = html;
  } catch {
    document.getElementById('dayDetail').innerHTML = '<p style="color:var(--color-error)">Error al cargar turnos.</p>';
  }
}

// === Turnos ===
async function loadAppointments() {
  const date = document.getElementById('filterDate').value;
  const status = document.getElementById('filterStatus').value;
  let url = `${API}/admin/appointments?`;
  if (date) url += `date=${date}&`;
  if (status) url += `status=${status}&`;

  try {
    const res = await fetch(url, { headers: authHeaders() });
    const appointments = await res.json();

    if (appointments.length === 0) {
      document.getElementById('appointmentsTable').innerHTML = '<p style="color:var(--color-text-muted)">No se encontraron turnos.</p>';
      return;
    }

    document.getElementById('appointmentsTable').innerHTML = `
      <table class="data-table">
        <thead><tr><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Servicio</th><th>Duración</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${appointments.map(a => `
          <tr>
            <td>${a.date.split('T')[0]}</td>
            <td>${a.start_time.slice(0,5)} - ${a.end_time.slice(0,5)}</td>
            <td>${a.client_name}</td>
            <td>${a.service_name}</td>
            <td>${a.duration_minutes} min</td>
            <td>$${Number(a.service_price).toLocaleString()}</td>
            <td><span class="badge badge-${a.status}">${a.status}</span></td>
            <td>
              ${a.status === 'confirmed' ? `<button class="btn btn-danger btn-sm" onclick="cancelAppointment('${a.id}')">Cancelar</button>` : ''}
            </td>
          </tr>
        `).join('')}</tbody>
      </table>
    `;
  } catch {
    document.getElementById('appointmentsTable').innerHTML = '<p style="color:var(--color-error)">Error al cargar turnos.</p>';
  }
}

async function cancelAppointment(id) {
  if (!confirm('¿Está seguro de cancelar este turno?')) return;
  try {
    await fetch(`${API}/admin/appointments/${id}/cancel`, { method: 'PATCH', headers: authHeaders() });
    loadDashboard();
    loadAppointments();
  } catch { alert('Error al cancelar el turno.'); }
}

function openNewAppointment() {
  openModal(`
    <h3>Nuevo Turno Manual</h3>
    <div class="form-group">
      <label>Buscar cliente (teléfono o nombre)</label>
      <input type="text" id="searchClientInput" placeholder="Buscar..." oninput="searchClientForAppt()">
      <div id="clientSearchResults" style="margin-top:0.5rem;"></div>
    </div>
    <div id="newClientFields" style="display:none;">
      <div class="form-row">
        <div class="form-group"><label>Nombre</label><input type="text" id="newClientName"></div>
        <div class="form-group"><label>Teléfono</label><input type="text" id="newClientPhone"></div>
      </div>
      <div class="form-group"><label>Email</label><input type="email" id="newClientEmail"></div>
    </div>
    <input type="hidden" id="selectedClientId">
    <div class="form-group">
      <label>Servicio</label>
      <select id="apptService"></select>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Fecha</label><input type="date" id="apptDate"></div>
      <div class="form-group"><label>Hora inicio</label><input type="time" id="apptTime"></div>
    </div>
    <div class="form-group"><label>Notas</label><textarea id="apptNotes" rows="2"></textarea></div>
    <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem;">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveManualAppointment()">Guardar</button>
    </div>
  `);
  loadServicesForSelect();
}

async function loadServicesForSelect() {
  const res = await fetch(`${API}/services`);
  const services = await res.json();
  document.getElementById('apptService').innerHTML = services.map(s =>
    `<option value="${s.id}">${s.name} (${s.duration_minutes} min)</option>`
  ).join('');
}

async function searchClientForAppt() {
  const query = document.getElementById('searchClientInput').value.trim();
  if (query.length < 2) { document.getElementById('clientSearchResults').innerHTML = ''; return; }
  const res = await fetch(`${API}/admin/clients?search=${encodeURIComponent(query)}`, { headers: authHeaders() });
  const clients = await res.json();
  let html = clients.map(c => `
    <div style="padding:0.5rem; cursor:pointer; border-bottom:1px solid var(--color-border);" onclick="selectClientForAppt('${c.id}', '${c.name}')">
      ${c.name} - ${c.phone}
    </div>
  `).join('');
  html += `<div style="padding:0.5rem; cursor:pointer; color:var(--color-sage-dark); font-weight:500;" onclick="showNewClientFields()">+ Crear cliente nuevo</div>`;
  document.getElementById('clientSearchResults').innerHTML = html;
}

function selectClientForAppt(id, name) {
  document.getElementById('selectedClientId').value = id;
  document.getElementById('searchClientInput').value = name;
  document.getElementById('clientSearchResults').innerHTML = '';
  document.getElementById('newClientFields').style.display = 'none';
}

function showNewClientFields() {
  document.getElementById('newClientFields').style.display = 'block';
  document.getElementById('selectedClientId').value = '';
  document.getElementById('clientSearchResults').innerHTML = '';
}

async function saveManualAppointment() {
  const clientId = document.getElementById('selectedClientId').value;
  const body = {
    service_id: document.getElementById('apptService').value,
    date: document.getElementById('apptDate').value,
    start_time: document.getElementById('apptTime').value,
    notes: document.getElementById('apptNotes').value
  };
  if (clientId) { body.client_id = clientId; }
  else {
    body.client_name = document.getElementById('newClientName').value;
    body.client_phone = document.getElementById('newClientPhone').value;
    body.client_email = document.getElementById('newClientEmail').value;
  }
  try {
    const res = await fetch(`${API}/admin/appointments/manual`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    closeModal();
    loadAppointments();
    loadDashboard();
  } catch { alert('Error al crear el turno.'); }
}

// === Clientes ===
async function loadClients() {
  const res = await fetch(`${API}/admin/clients`, { headers: authHeaders() });
  const clients = await res.json();
  renderClientsTable(clients);
}

async function searchClients() {
  const search = document.getElementById('clientSearch').value.trim();
  const url = search ? `${API}/admin/clients?search=${encodeURIComponent(search)}` : `${API}/admin/clients`;
  const res = await fetch(url, { headers: authHeaders() });
  const clients = await res.json();
  renderClientsTable(clients);
}

function renderClientsTable(clients) {
  if (clients.length === 0) {
    document.getElementById('clientsTable').innerHTML = '<p style="color:var(--color-text-muted)">No se encontraron clientes.</p>';
    return;
  }
  document.getElementById('clientsTable').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Acciones</th></tr></thead>
      <tbody>${clients.map(c => `
        <tr>
          <td>${c.name}</td>
          <td>${c.phone}</td>
          <td>${c.email}</td>
          <td><button class="btn btn-sm" onclick="viewClient('${c.id}')">Ver historial</button></td>
        </tr>
      `).join('')}</tbody>
    </table>
  `;
}

async function viewClient(id) {
  const res = await fetch(`${API}/admin/clients/${id}`, { headers: authHeaders() });
  const client = await res.json();

  let apptHtml = '<p style="color:var(--color-text-muted)">Sin historial de turnos.</p>';
  if (client.appointments && client.appointments.length > 0) {
    apptHtml = `<table class="data-table">
      <thead><tr><th>Fecha</th><th>Hora</th><th>Servicio</th><th>Precio</th><th>Estado</th></tr></thead>
      <tbody>${client.appointments.map(a => `
        <tr>
          <td>${a.date.split('T')[0]}</td>
          <td>${a.start_time.slice(0,5)}</td>
          <td>${a.service_name}</td>
          <td>$${Number(a.service_price).toLocaleString()}</td>
          <td><span class="badge badge-${a.status}">${a.status}</span></td>
        </tr>
      `).join('')}</tbody>
    </table>`;
  }

  openModal(`
    <h3>${client.name}</h3>
    <p style="margin-bottom:0.25rem;">📞 ${client.phone}</p>
    <p style="margin-bottom:1rem;">✉️ ${client.email}</p>
    <h4 style="font-family:var(--font-display); margin-bottom:0.75rem;">Historial de turnos</h4>
    ${apptHtml}
    <button class="btn" onclick="closeModal()" style="margin-top:1rem;">Cerrar</button>
  `);
}

function openNewClient() {
  openModal(`
    <h3>Nuevo Cliente</h3>
    <div class="form-group"><label>Nombre</label><input type="text" id="ncName"></div>
    <div class="form-group"><label>Teléfono</label><input type="text" id="ncPhone"></div>
    <div class="form-group"><label>Email</label><input type="email" id="ncEmail"></div>
    <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem;">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveNewClient()">Guardar</button>
    </div>
  `);
}

async function saveNewClient() {
  const body = { name: document.getElementById('ncName').value, phone: document.getElementById('ncPhone').value, email: document.getElementById('ncEmail').value };
  const res = await fetch(`${API}/admin/clients`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) { const d = await res.json(); alert(d.error); return; }
  closeModal();
  loadClients();
}

// === Servicios ===
async function loadServices() {
  const res = await fetch(`${API}/admin/services`, { headers: authHeaders() });
  const services = await res.json();
  document.getElementById('servicesTable').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Nombre</th><th>Duración</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${services.map(s => `
        <tr>
          <td>${s.name}</td>
          <td>${s.duration_minutes} min</td>
          <td>$${Number(s.price).toLocaleString()}</td>
          <td>${s.is_active ? '<span class="badge badge-confirmed">Activo</span>' : '<span class="badge badge-cancelled">Inactivo</span>'}</td>
          <td>
            <button class="btn btn-sm" onclick="editService('${s.id}')">Editar</button>
            ${s.is_active ? `<button class="btn btn-danger btn-sm" onclick="deactivateService('${s.id}')">Desactivar</button>` : ''}
          </td>
        </tr>
      `).join('')}</tbody>
    </table>
  `;
}

function openNewService() {
  openModal(`
    <h3>Nuevo Servicio</h3>
    <div class="form-group"><label>Nombre</label><input type="text" id="svcName"></div>
    <div class="form-group"><label>Descripción</label><textarea id="svcDesc" rows="2"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Duración (min)</label><input type="number" id="svcDuration" min="5"></div>
      <div class="form-group"><label>Precio</label><input type="number" id="svcPrice" min="0" step="0.01"></div>
    </div>
    <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem;">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveNewService()">Guardar</button>
    </div>
  `);
}

async function saveNewService() {
  const body = { name: document.getElementById('svcName').value, description: document.getElementById('svcDesc').value, duration_minutes: parseInt(document.getElementById('svcDuration').value), price: parseFloat(document.getElementById('svcPrice').value) };
  const res = await fetch(`${API}/admin/services`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) { const d = await res.json(); alert(d.error); return; }
  closeModal();
  loadServices();
}

async function editService(id) {
  const res = await fetch(`${API}/admin/services/${id}`, { headers: authHeaders() });
  const s = await res.json();
  openModal(`
    <h3>Editar Servicio</h3>
    <div class="form-group"><label>Nombre</label><input type="text" id="svcName" value="${s.name}"></div>
    <div class="form-group"><label>Descripción</label><textarea id="svcDesc" rows="2">${s.description || ''}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Duración (min)</label><input type="number" id="svcDuration" value="${s.duration_minutes}" min="5"></div>
      <div class="form-group"><label>Precio</label><input type="number" id="svcPrice" value="${s.price}" min="0" step="0.01"></div>
    </div>
    <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem;">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="updateService('${id}')">Guardar</button>
    </div>
  `);
}

async function updateService(id) {
  const body = { name: document.getElementById('svcName').value, description: document.getElementById('svcDesc').value, duration_minutes: parseInt(document.getElementById('svcDuration').value), price: parseFloat(document.getElementById('svcPrice').value) };
  const res = await fetch(`${API}/admin/services/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) { const d = await res.json(); alert(d.error); return; }
  closeModal();
  loadServices();
}

async function deactivateService(id) {
  if (!confirm('¿Desactivar este servicio?')) return;
  await fetch(`${API}/admin/services/${id}/deactivate`, { method: 'PATCH', headers: authHeaders() });
  loadServices();
}

// === Horarios ===
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

async function loadSchedules() {
  const res = await fetch(`${API}/admin/schedules`, { headers: authHeaders() });
  const schedules = await res.json();

  let html = '<div style="display:grid; gap:0.75rem;">';
  for (let day = 0; day < 7; day++) {
    const daySchedules = schedules.filter(s => s.day_of_week === day);
    html += `<div class="stat-card" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
      <strong>${DAYS[day]}</strong>`;
    if (daySchedules.length > 0 && daySchedules.some(s => s.is_active)) {
      html += `<span>${daySchedules.map(s => s.start_time.slice(0,5) + ' - ' + s.end_time.slice(0,5)).join(' | ')}</span>`;
    } else {
      html += `<span style="color:var(--color-text-muted)">Cerrado</span>`;
    }
    html += '</div>';
  }
  html += '</div>';
  html += `<button class="btn btn-primary" onclick="openEditSchedules()" style="margin-top:1rem;">Editar horarios</button>`;
  document.getElementById('schedulesForm').innerHTML = html;

  // Bloqueos
  const bRes = await fetch(`${API}/admin/schedules/blocked`, { headers: authHeaders() });
  const blocked = await bRes.json();
  if (blocked.length === 0) {
    document.getElementById('blockedTable').innerHTML = '<p style="color:var(--color-text-muted)">Sin bloqueos configurados.</p>';
  } else {
    document.getElementById('blockedTable').innerHTML = `
      <table class="data-table">
        <thead><tr><th>Fecha</th><th>Horario</th><th>Motivo</th><th>Acción</th></tr></thead>
        <tbody>${blocked.map(b => `
          <tr>
            <td>${b.date.split('T')[0]}</td>
            <td>${b.start_time ? b.start_time.slice(0,5) + ' - ' + b.end_time.slice(0,5) : 'Día completo'}</td>
            <td>${b.reason || '-'}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteBlock('${b.id}')">Eliminar</button></td>
          </tr>
        `).join('')}</tbody>
      </table>
    `;
  }
}

function openEditSchedules() {
  let html = '<h3>Editar Horarios</h3>';
  for (let day = 0; day < 7; day++) {
    html += `<div style="margin-bottom:0.75rem; padding:0.75rem; border:1px solid var(--color-border); border-radius:var(--radius-sm);">
      <label style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
        <input type="checkbox" id="day${day}Active" ${day >= 1 && day <= 5 ? 'checked' : ''}> <strong>${DAYS[day]}</strong>
      </label>
      <div class="form-row">
        <div class="form-group"><label>Inicio</label><input type="time" id="day${day}Start" value="09:00"></div>
        <div class="form-group"><label>Fin</label><input type="time" id="day${day}End" value="19:00"></div>
        <div class="form-group"><label>Slot (min)</label><input type="number" id="day${day}Slot" value="60" min="5"></div>
      </div>
    </div>`;
  }
  html += `<div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem;">
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveSchedules()">Guardar</button>
  </div>`;
  openModal(html);
}

async function saveSchedules() {
  const schedules = [];
  for (let day = 0; day < 7; day++) {
    const active = document.getElementById(`day${day}Active`).checked;
    if (active) {
      schedules.push({ day_of_week: day, start_time: document.getElementById(`day${day}Start`).value, end_time: document.getElementById(`day${day}End`).value, slot_duration_minutes: parseInt(document.getElementById(`day${day}Slot`).value), is_active: true });
    }
  }
  const res = await fetch(`${API}/admin/schedules`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ schedules }) });
  if (!res.ok) { alert('Error al guardar horarios.'); return; }
  closeModal();
  loadSchedules();
}

function openNewBlock() {
  openModal(`
    <h3>Nuevo Bloqueo</h3>
    <div class="form-group"><label>Fecha</label><input type="date" id="blockDate"></div>
    <div class="form-row">
      <div class="form-group"><label>Hora inicio (vacío = día completo)</label><input type="time" id="blockStart"></div>
      <div class="form-group"><label>Hora fin</label><input type="time" id="blockEnd"></div>
    </div>
    <div class="form-group"><label>Motivo</label><input type="text" id="blockReason" placeholder="Opcional"></div>
    <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem;">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveBlock()">Guardar</button>
    </div>
  `);
}

async function saveBlock() {
  const body = { date: document.getElementById('blockDate').value, start_time: document.getElementById('blockStart').value || null, end_time: document.getElementById('blockEnd').value || null, reason: document.getElementById('blockReason').value || null };
  const res = await fetch(`${API}/admin/schedules/blocked`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) { alert('Error al crear bloqueo.'); return; }
  closeModal();
  loadSchedules();
}

async function deleteBlock(id) {
  if (!confirm('¿Eliminar este bloqueo?')) return;
  await fetch(`${API}/admin/schedules/blocked/${id}`, { method: 'DELETE', headers: authHeaders() });
  loadSchedules();
}

// === Inicialización ===
document.addEventListener('DOMContentLoaded', checkSession);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('loginSection').style.display !== 'none') {
    doLogin();
  }
});

// === Registro ===
function showRegister() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('loginTitle').textContent = 'Crear cuenta';
  document.getElementById('loginSub').textContent = 'Registrá un nuevo administrador';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('loginSuccess').style.display = 'none';
}

function showLogin() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginTitle').textContent = 'Panel de Administración';
  document.getElementById('loginSub').textContent = 'Ingresá tus credenciales para acceder';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('loginSuccess').style.display = 'none';
}

async function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const username = document.getElementById('regUser').value.trim();
  const password = document.getElementById('regPass').value.trim();
  const errorEl = document.getElementById('loginError');
  const successEl = document.getElementById('loginSuccess');

  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  if (!name || !username || !password) {
    errorEl.textContent = 'Completá todos los campos.';
    errorEl.style.display = 'block';
    return;
  }

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error;
      errorEl.style.display = 'block';
      return;
    }
    successEl.textContent = '✓ Cuenta creada. Ya podés iniciar sesión.';
    successEl.style.display = 'block';
    setTimeout(() => showLogin(), 2000);
  } catch {
    errorEl.textContent = 'Error de conexión.';
    errorEl.style.display = 'block';
  }
}

// === Gestión de Usuarios ===
async function loadUsers() {
  try {
    const res = await fetch(`${API}/auth/admins`, { headers: authHeaders() });
    const admins = await res.json();

    document.getElementById('usersTable').innerHTML = `
      <table class="data-table">
        <thead><tr><th>Nombre</th><th>Usuario</th><th>Contraseña</th><th>Creado</th><th>Acciones</th></tr></thead>
        <tbody>${admins.map(a => `
          <tr>
            <td>${a.name}</td>
            <td><strong>${a.username}</strong></td>
            <td><code style="background:var(--color-beige); padding:0.2rem 0.5rem; border-radius:4px; font-size:0.8rem;">${a.password}</code></td>
            <td style="font-size:0.78rem; color:var(--color-text-muted);">${new Date(a.created_at).toLocaleDateString('es-AR')}</td>
            <td>
              <button class="btn btn-sm" onclick="editAdmin('${a.id}', '${a.name}', '${a.username}', '${a.password}')">Editar</button>
              <button class="btn btn-danger btn-sm" onclick="deleteAdmin('${a.id}')">Eliminar</button>
            </td>
          </tr>
        `).join('')}</tbody>
      </table>
    `;
  } catch {
    document.getElementById('usersTable').innerHTML = '<p style="color:var(--color-error)">Error al cargar usuarios.</p>';
  }
}

function editAdmin(id, name, username, password) {
  openModal(`
    <h3>Editar Administrador</h3>
    <div class="form-group"><label>Nombre</label><input type="text" id="editAdminName" value="${name}"></div>
    <div class="form-group"><label>Usuario</label><input type="text" id="editAdminUser" value="${username}"></div>
    <div class="form-group"><label>Contraseña</label><input type="text" id="editAdminPass" value="${password}"></div>
    <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem;">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveAdmin('${id}')">Guardar</button>
    </div>
  `);
}

async function saveAdmin(id) {
  const body = {
    name: document.getElementById('editAdminName').value,
    username: document.getElementById('editAdminUser').value,
    password: document.getElementById('editAdminPass').value
  };
  const res = await fetch(`${API}/auth/admins/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) { const d = await res.json(); alert(d.error); return; }
  closeModal();
  loadUsers();
}

async function deleteAdmin(id) {
  if (!confirm('¿Eliminar este administrador?')) return;
  const res = await fetch(`${API}/auth/admins/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) { const d = await res.json(); alert(d.error); return; }
  loadUsers();
}
