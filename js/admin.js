// ============================================
// Admin Dashboard Logic
// Supports live API mode and offline demo mode
// ============================================

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const appConfig = window.APP_CONFIG || {};
const API_BASE_URL = appConfig.apiBaseUrl || (isLocalhost ? 'http://localhost:3000/api' : '');
const HEALTH_ENDPOINT = appConfig.backendHealthEndpoint || '/health';
const REQUEST_TIMEOUT = appConfig.backendRequestTimeout || 6000;
const FORCE_DEMO_MODE = appConfig.demoMode === true;
const HEALTH_CACHE_MS = 60 * 1000;

let backendHealthy = false;
let lastHealthCheck = 0;
let demoMode = FORCE_DEMO_MODE || !API_BASE_URL;
let authToken = localStorage.getItem('authToken');
let cachedRequests = [];

const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

const statusOptions = [
  { value: 'NEW', label: 'New' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'REJECTED', label: 'Rejected' }
];

const statusLabels = statusOptions.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const normalizeEndpoint = (endpoint) => (endpoint.startsWith('/') ? endpoint : `/${endpoint}`);
const healthUrl = () => (API_BASE_URL ? `${API_BASE_URL}${normalizeEndpoint(HEALTH_ENDPOINT)}` : '');

const ensureBackendAvailable = async (forceCheck = false) => {
  if (FORCE_DEMO_MODE || !API_BASE_URL) {
    demoMode = true;
    backendHealthy = false;
    return false;
  }

  const now = Date.now();

  if (!forceCheck && backendHealthy && now - lastHealthCheck < HEALTH_CACHE_MS) {
    return true;
  }

  lastHealthCheck = now;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    const response = await fetch(healthUrl(), { signal: controller.signal });
    clearTimeout(timeout);
    backendHealthy = response.ok;
  } catch (error) {
    backendHealthy = false;
  }

  if (!backendHealthy && !isLocalhost) {
    demoMode = true;
  } else if (backendHealthy) {
    demoMode = false;
  }

  return backendHealthy;
};

const apiCall = async (endpoint, options = {}) => {
  if (!(await ensureBackendAvailable())) {
    throw new Error('Backend API is not accessible');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (response.status === 401) {
    logout();
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Unexpected API error');
  }

  return data;
};

document.addEventListener('DOMContentLoaded', async () => {
  if (authToken && !(await ensureBackendAvailable(true))) {
    authToken = null;
    localStorage.removeItem('authToken');
  }

  if (authToken && !demoMode) {
    await validateTokenAndShowDashboard();
  }
});

const validateTokenAndShowDashboard = async () => {
  try {
    await apiCall('/auth/me');
    showDashboard();
  } catch (error) {
    logout();
  }
};

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;

  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
  submitBtn.disabled = true;

  try {
    const canUseBackend = await ensureBackendAvailable(true);

    if (demoMode || !canUseBackend) {
      if (email === 'admin' && password === 'admin') {
        authToken = 'demo-token';
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('adminUser', JSON.stringify({ name: 'Demo Admin', email: 'admin@demo.com' }));
        showDashboard();
      } else {
        alert('Demo credentials: username admin | password admin');
      }
      return;
    }

    const payload = {
      email: email.includes('@') ? email : 'admin@mohamed.dev',
      password
    };

    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    authToken = data.token;
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('adminUser', JSON.stringify(data.user));
    showDashboard();
  } catch (error) {
    alert(error.message || 'Unable to sign in. Please try again.');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

const logout = () => {
  authToken = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('adminUser');
  loginPage.style.display = 'flex';
  dashboard.style.display = 'none';
};

logoutBtn?.addEventListener('click', logout);

const showDashboard = () => {
  loginPage.style.display = 'none';
  dashboard.style.display = 'flex';
  loadStats();
  loadRequests();
};

sidebarToggle?.addEventListener('click', () => {
  sidebar.classList.toggle('show');
});

document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    const page = item.dataset.page;

    document.querySelectorAll('.page-content').forEach((content) => content.classList.remove('active'));
    document.getElementById(`${page}Page`)?.classList.add('active');

    document.querySelectorAll('.nav-item').forEach((navItem) => navItem.classList.remove('active'));
    item.classList.add('active');

    if (window.innerWidth < 992) {
      sidebar.classList.remove('show');
    }
  });
});

const loadStats = async () => {
  try {
    const canUseBackend = await ensureBackendAvailable();
    let stats;

    if (canUseBackend) {
      stats = await apiCall('/stats');
    } else {
      const requests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
      stats = {
        total: requests.length,
        new: requests.filter((r) => r.status === 'NEW').length,
        inReview: requests.filter((r) => r.status === 'IN_REVIEW').length,
        contacted: requests.filter((r) => r.status === 'CONTACTED').length,
        closed: requests.filter((r) => r.status === 'CLOSED').length,
        completed: requests.filter((r) => r.status === 'CLOSED' || r.status === 'CONTACTED').length
      };
    }

    document.getElementById('totalRequests').textContent = stats.total || 0;
    document.getElementById('newRequests').textContent = stats.new || 0;
    document.getElementById('pendingRequests').textContent = stats.inReview || 0;
    document.getElementById('completedRequests').textContent = stats.completed ?? stats.contacted ?? 0;
    document.getElementById('newRequestsBadge').textContent = stats.new || 0;
    document.getElementById('notificationBadge').textContent = stats.new || 0;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

const loadRequests = async () => {
  try {
    const canUseBackend = await ensureBackendAvailable();
    let requests;

    if (canUseBackend) {
      const data = await apiCall('/contact');
      requests = data.data || data;
    } else {
      requests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
    }

    cachedRequests = requests;
    renderRecentRequests(requests.slice(0, 5));
    renderAllRequests(requests);
    renderCharts(requests);
  } catch (error) {
    console.error('Failed to load requests:', error);
  }
};

const renderRecentRequests = (requests) => {
  const tbody = document.getElementById('recentRequestsTable');
  if (!tbody) return;

  if (!requests.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No requests available</td></tr>';
    return;
  }

  tbody.innerHTML = requests
    .map(
      (request) => `
        <tr>
          <td>${escapeHtml(request.name) || '-'}</td>
          <td>${escapeHtml(request.subject) || '-'}</td>
          <td>${formatDate(request.createdAt)}</td>
          <td><span class="status-badge status-${getStatusClass(request.status)}">${getStatusLabel(request.status)}</span></td>
          <td>
            <button class="action-btn" onclick="viewRequest('${request.id}')">
              <i class="fas fa-eye"></i>
            </button>
          </td>
        </tr>
      `
    )
    .join('');
};

const renderAllRequests = (requests) => {
  const tbody = document.getElementById('allRequestsTable');
  if (!tbody) return;

  const filter = document.getElementById('statusFilter')?.value || 'all';
  const filtered = filter === 'all' ? requests : requests.filter((request) => request.status === filter);

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No requests match the selected filters</td></tr>';
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (request, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(request.name) || '-'}</td>
          <td>${escapeHtml(request.email) || '-'}</td>
          <td>${escapeHtml(request.subject) || '-'}</td>
          <td>${escapeHtml(request.budget) || '-'}</td>
          <td>${formatDate(request.createdAt)}</td>
          <td><span class="status-badge status-${getStatusClass(request.status)}">${getStatusLabel(request.status)}</span></td>
          <td>
            <button class="action-btn" title="View" onclick="viewRequest('${request.id}')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="action-btn" title="Delete" onclick="deleteRequest('${request.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `
    )
    .join('');
};

let currentRequestId = null;

const viewRequest = async (id) => {
  currentRequestId = id;

  try {
    let request;
    if (await ensureBackendAvailable()) {
      request = await apiCall(`/contact/${id}`);
    } else {
      request = cachedRequests.find((item) => item.id == id);
    }

    if (!request) {
      alert('This request could not be found.');
      return;
    }

    const payload = [
      { label: 'Name', value: request.name },
      { label: 'Email', value: request.email, type: 'email' },
      { label: 'Phone', value: request.phone, type: 'tel' },
      { label: 'Company', value: request.company },
      { label: 'Subject', value: request.subject },
      { label: 'Budget', value: request.budget },
      { label: 'Message', value: request.message, multiline: true },
      { label: 'Created At', value: formatDate(request.createdAt) },
      { label: 'Status', value: getStatusLabel(request.status) }
    ];

    document.getElementById('requestDetails').innerHTML = `
      <div class="row">
        ${payload
          .map(
            (field) => `
              <div class="${field.multiline ? 'col-12' : 'col-md-6'}">
                <div class="request-detail">
                  <label>${field.label}</label>
                  <p style="${field.multiline ? 'white-space: pre-wrap;' : ''}">
                    ${renderFieldValue(field)}
                  </p>
                </div>
              </div>
            `
          )
          .join('')}
      </div>
      <div class="status-select">
        <label style="width: 100%; margin-bottom: 10px;">Update status:</label>
        ${statusOptions
          .map(
            (option) => `
              <button
                class="status-btn ${request.status === option.value ? 'active' : ''}"
                onclick="updateStatus('${id}', '${option.value}')"
              >
                ${option.label}
              </button>
            `
          )
          .join('')}
      </div>
    `;

    new bootstrap.Modal(document.getElementById('requestModal')).show();
  } catch (error) {
    alert(error.message || 'Unable to load request details.');
  }
};

const renderFieldValue = (field) => {
  if (!field.value) return '-';

  if (field.type === 'email') {
    return `<a href="mailto:${escapeHtml(field.value)}">${escapeHtml(field.value)}</a>`;
  }

  if (field.type === 'tel') {
    return `<a href="tel:${escapeHtml(field.value)}">${escapeHtml(field.value)}</a>`;
  }

  return escapeHtml(field.value);
};

const updateStatus = async (id, status) => {
  try {
    if (await ensureBackendAvailable()) {
      await apiCall(`/contact/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } else {
      const requests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
      const index = requests.findIndex((item) => item.id == id);
      if (index !== -1) {
        requests[index].status = status;
        localStorage.setItem('contactRequests', JSON.stringify(requests));
      }
    }

    await loadStats();
    await loadRequests();
    viewRequest(id);
  } catch (error) {
    alert(error.message || 'Unable to update the status for this request.');
  }
};

const deleteRequest = async (id) => {
  if (!confirm('Are you sure you want to delete this request?')) {
    return;
  }

  try {
    if (await ensureBackendAvailable()) {
      await apiCall(`/contact/${id}`, { method: 'DELETE' });
    } else {
      const requests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
      const updated = requests.filter((request) => request.id != id);
      localStorage.setItem('contactRequests', JSON.stringify(updated));
    }

    await loadStats();
    await loadRequests();

    const modal = bootstrap.Modal.getInstance(document.getElementById('requestModal'));
    modal?.hide();
  } catch (error) {
    alert(error.message || 'Unable to delete this request.');
  }
};

const exportRequests = async (format) => {
  if (format !== 'excel') {
    return;
  }

  try {
    let requests = cachedRequests;

    if (await ensureBackendAvailable()) {
      const data = await apiCall('/contact');
      requests = data.data || data;
    }

    if (!requests.length) {
      alert('No requests available to export.');
      return;
    }

    let csv = 'Name,Email,Phone,Subject,Budget,Message,Status,Created At\n';
    requests.forEach((request) => {
      csv += `"${(request.name || '').replace(/"/g, '""')}",`;
      csv += `"${(request.email || '').replace(/"/g, '""')}",`;
      csv += `"${(request.phone || '').replace(/"/g, '""')}",`;
      csv += `"${(request.subject || '').replace(/"/g, '""')}",`;
      csv += `"${(request.budget || '').replace(/"/g, '""')}",`;
      csv += `"${(request.message || '').replace(/"/g, '""')}",`;
      csv += `"${getStatusLabel(request.status)}",`;
      csv += `"${formatDate(request.createdAt)}"\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `requests_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  } catch (error) {
    alert(error.message || 'Unable to export requests right now.');
  }
};

const renderCharts = (requests) => {
  const subjectCounts = {};
  const statusCounts = {};

  requests.forEach((request) => {
    subjectCounts[request.subject] = (subjectCounts[request.subject] || 0) + 1;
    const statusLabel = getStatusLabel(request.status);
    statusCounts[statusLabel] = (statusCounts[statusLabel] || 0) + 1;
  });

  const subjectChart = document.getElementById('subjectChart');
  if (subjectChart) {
    subjectChart.innerHTML =
      Object.entries(subjectCounts)
        .map(([subject, count]) => `<div style="margin: 10px 0;"><span>${escapeHtml(subject)}: </span><strong>${count}</strong></div>`)
        .join('') || '<p>No subject data available yet.</p>';
  }

  const statusChart = document.getElementById('statusChart');
  if (statusChart) {
    statusChart.innerHTML =
      Object.entries(statusCounts)
        .map(
          ([status, count]) =>
            `<div style="margin: 10px 0;"><span class="status-badge">${escapeHtml(status)}: ${count}</span></div>`
        )
        .join('') || '<p>No status data available yet.</p>';
  }
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const getStatusClass = (status) => status || 'NEW';
const getStatusLabel = (status) => statusLabels[status] || status || 'New';

document.getElementById('statusFilter')?.addEventListener('change', () => {
  renderAllRequests(cachedRequests);
});

const handleSearchInput = async (event) => {
  const term = event.target.value.trim().toLowerCase();

  if (term.length < 2) {
    renderAllRequests(cachedRequests);
    return;
  }

  try {
    if (await ensureBackendAvailable()) {
      const data = await apiCall(`/contact?search=${encodeURIComponent(term)}`);
      const requests = data.data || data;
      renderAllRequests(requests);
    } else {
      const filtered = cachedRequests.filter(
        (request) =>
          request.name?.toLowerCase().includes(term) ||
          request.email?.toLowerCase().includes(term) ||
          request.subject?.toLowerCase().includes(term)
      );
      renderAllRequests(filtered);
    }
  } catch (error) {
    console.error('Search failed:', error);
  }
};

document.getElementById('searchInput')?.addEventListener('input', (event) => handleSearchInput(event));

window.viewRequest = viewRequest;
window.updateStatus = updateStatus;
window.deleteRequest = deleteRequest;
window.exportRequests = exportRequests;
