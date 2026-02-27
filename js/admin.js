/**
 * Admin Dashboard — Production JS
 * Connects to /api/* serverless functions on Vercel
 */
(function () {
  'use strict';

  // ===== State =====
  let messages = [];
  let pollInterval = null;

  // ===== DOM =====
  const loginPage = document.getElementById('loginPage');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const searchInput = document.getElementById('searchInput');

  // Stats
  const totalEl = document.getElementById('totalRequests');
  const completedEl = document.getElementById('completedRequests');
  const pendingEl = document.getElementById('pendingRequests');
  const newEl = document.getElementById('newRequests');
  const badgeEl = document.getElementById('newRequestsBadge');
  const notifBadge = document.getElementById('notificationBadge');

  // Tables
  const recentTable = document.getElementById('recentRequestsTable');
  const allTable = document.getElementById('allRequestsTable');

  // ===== Init =====
  checkAuth();

  // ===== Auth =====
  async function checkAuth() {
    try {
      const res = await fetch('/api/messages', { credentials: 'include' });
      if (res.ok) {
        showDashboard();
        const data = await res.json();
        handleData(data);
        startPolling();
      } else {
        showLogin();
      }
    } catch {
      showLogin();
    }
  }

  function showLogin() {
    loginPage.style.display = 'flex';
    dashboard.style.display = 'none';
    stopPolling();
  }

  function showDashboard() {
    loginPage.style.display = 'none';
    dashboard.style.display = 'flex';
  }

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ...Signing in';
    btn.disabled = true;

    try {
      const email = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showDashboard();
        fetchMessages();
        startPolling();
      } else {
        showToast(data.error || 'Login failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  });

  // Logout
  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/logout', { credentials: 'include' });
    } catch { }
    showLogin();
  });

  // ===== Data =====
  async function fetchMessages() {
    try {
      const res = await fetch('/api/messages', { credentials: 'include' });
      if (res.status === 401) { showLogin(); return; }
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      handleData(data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }

  function handleData(data) {
    messages = data.messages || [];
    updateStats(data.stats || {});
    renderRecentTable();
    renderAllTable();
  }

  function updateStats(stats) {
    const total = stats.total || 0;
    const unread = stats.unread || 0;
    const read = stats.read || 0;
    totalEl.textContent = total;
    completedEl.textContent = read;
    pendingEl.textContent = 0;
    newEl.textContent = unread;
    badgeEl.textContent = unread;
    notifBadge.textContent = unread;
    badgeEl.style.display = unread > 0 ? 'inline-block' : 'none';
    notifBadge.style.display = unread > 0 ? 'inline-block' : 'none';
  }

  // ===== Tables =====
  function renderRecentTable() {
    const recent = messages.slice(0, 5);
    recentTable.innerHTML = recent.length === 0
      ? '<tr><td colspan="5" style="text-align:center;opacity:.6">لا توجد رسائل</td></tr>'
      : recent.map(tableRow).join('');
  }

  function renderAllTable() {
    const search = (searchInput?.value || '').toLowerCase();
    const filter = document.getElementById('statusFilter')?.value || 'all';

    let filtered = messages;
    if (search) {
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(search) ||
        m.email.toLowerCase().includes(search) ||
        m.subject.toLowerCase().includes(search)
      );
    }
    if (filter === 'NEW') filtered = filtered.filter((m) => !m.read);
    if (filter === 'CONTACTED') filtered = filtered.filter((m) => m.read);

    allTable.innerHTML = filtered.length === 0
      ? '<tr><td colspan="8" style="text-align:center;opacity:.6">لا توجد نتائج</td></tr>'
      : filtered.map((m, i) => tableRowFull(m, i + 1)).join('');
  }

  function tableRow(m) {
    const date = new Date(m.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
    const statusClass = m.read ? 'success' : 'warning';
    const statusText = m.read ? 'مقروء' : 'جديد';
    return `<tr>
      <td>${esc(m.name)}</td>
      <td>${esc(m.subject)}</td>
      <td>${date}</td>
      <td><span class="badge bg-${statusClass}">${statusText}</span></td>
      <td><button class="btn btn-sm btn-outline-primary" onclick="viewMessage('${m.id}')"><i class="fas fa-eye"></i></button></td>
    </tr>`;
  }

  function tableRowFull(m, idx) {
    const date = new Date(m.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
    const statusClass = m.read ? 'success' : 'warning';
    const statusText = m.read ? 'مقروء' : 'جديد';
    return `<tr>
      <td>${idx}</td>
      <td>${esc(m.name)}</td>
      <td>${esc(m.email)}</td>
      <td>${esc(m.subject)}</td>
      <td>${esc(m.budget || '—')}</td>
      <td>${date}</td>
      <td><span class="badge bg-${statusClass}">${statusText}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="viewMessage('${m.id}')" title="عرض"><i class="fas fa-eye"></i></button>
        ${!m.read ? `<button class="btn btn-sm btn-outline-success me-1" onclick="markRead('${m.id}')" title="مقروء"><i class="fas fa-check"></i></button>` : ''}
        <button class="btn btn-sm btn-outline-danger" onclick="deleteMessage('${m.id}')" title="حذف"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }

  // ===== Actions =====
  window.viewMessage = function (id) {
    const m = messages.find((msg) => msg.id === id);
    if (!m) return;
    const details = document.getElementById('requestDetails');
    details.innerHTML = `
      <div class="row g-3">
        <div class="col-md-6"><strong>الاسم:</strong> ${esc(m.name)}</div>
        <div class="col-md-6"><strong>البريد:</strong> ${esc(m.email)}</div>
        <div class="col-md-6"><strong>الهاتف:</strong> ${esc(m.phone || '—')}</div>
        <div class="col-md-6"><strong>الشركة:</strong> ${esc(m.company || '—')}</div>
        <div class="col-md-6"><strong>الموضوع:</strong> ${esc(m.subject)}</div>
        <div class="col-md-6"><strong>الميزانية:</strong> ${esc(m.budget || '—')}</div>
        <div class="col-12"><hr><strong>الرسالة:</strong><p style="white-space:pre-wrap;margin-top:8px">${esc(m.message)}</p></div>
        <div class="col-12" style="opacity:.6;font-size:.85rem">التاريخ: ${new Date(m.createdAt).toLocaleString('ar-EG')}</div>
      </div>`;
    const modal = new bootstrap.Modal(document.getElementById('requestModal'));
    modal.show();
    // Auto-mark as read
    if (!m.read) markRead(id);
  };

  window.markRead = async function (id) {
    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      fetchMessages();
    } catch (err) {
      showToast('Failed to update', 'error');
    }
  };

  window.deleteMessage = async function (id) {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    try {
      await fetch('/api/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      showToast('تم الحذف', 'success');
      fetchMessages();
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  // ===== Navigation =====
  window.showPage = function (page) {
    document.querySelectorAll('.page-content').forEach((el) => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('active'));
    const target = document.getElementById(page + 'Page');
    if (target) target.classList.add('active');
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');
  };

  document.querySelectorAll('.nav-item[data-page]').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(item.dataset.page);
    });
  });

  // Sidebar toggle
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
  }

  // Search
  if (searchInput) {
    searchInput.addEventListener('input', renderAllTable);
  }

  // Filter
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', renderAllTable);
  }

  // ===== Polling =====
  function startPolling() {
    stopPolling();
    pollInterval = setInterval(fetchMessages, 10000);
  }

  function stopPolling() {
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
  }

  // ===== Helpers =====
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function showToast(msg, type) {
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('show'); }, 10);
    setTimeout(() => { toast.remove(); }, 3000);
  }

  // ===== Export =====
  window.exportRequests = function (format) {
    if (format !== 'excel') return;
    let csv = 'Name,Email,Phone,Subject,Budget,Message,Date,Status\n';
    messages.forEach((m) => {
      csv += `"${m.name}","${m.email}","${m.phone || ''}","${m.subject}","${m.budget || ''}","${m.message}","${m.createdAt}","${m.read ? 'Read' : 'New'}"\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'messages.csv'; a.click();
    URL.revokeObjectURL(url);
  };
})();
