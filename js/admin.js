// ============================================
// Admin Dashboard JavaScript
// Works with Backend API or localStorage (Demo Mode)
// ============================================

// Check if running locally with backend
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalhost ? 'http://localhost:3000/api' : null;
const DEMO_MODE = !isLocalhost; // GitHub Pages = Demo Mode

// Auth Token
let authToken = localStorage.getItem('authToken');

// DOM Elements
const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

// ============================================
// API Helper Functions
// ============================================
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
  };
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      logout();
      throw new Error('انتهت صلاحية الجلسة');
    }
    
    if (!response.ok) {
      throw new Error(data.error || 'حدث خطأ');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============================================
// Authentication
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin dashboard loaded');
  console.log('Auth token:', authToken ? 'exists' : 'none');
  
  if (authToken) {
    validateTokenAndShowDashboard();
  }
});

async function validateTokenAndShowDashboard() {
  try {
    await apiCall('/auth/me');
    showDashboard();
  } catch (error) {
    logout();
  }
}

// Login Handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الدخول...';
  submitBtn.disabled = true;
  
  // Demo Mode - Simple login for GitHub Pages
  if (DEMO_MODE) {
    if (email === 'admin' && password === 'admin') {
      authToken = 'demo-token';
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('adminUser', JSON.stringify({ name: 'المدير', email: 'admin@demo.com' }));
      showDashboard();
    } else {
      alert('في الوضع التجريبي: اسم المستخدم: admin | كلمة المرور: admin');
    }
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    return;
  }
  
  console.log('Attempting login with:', email);
  console.log('API URL:', API_URL);
  
  try {
    const loginEmail = email.includes('@') ? email : 'admin@mohamed.dev';
    
    console.log('Sending request to:', `${API_URL}/auth/login`);
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password })
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      console.log('Login successful, showing dashboard');
      showDashboard();
    } else {
      alert(data.error || 'بيانات الدخول غير صحيحة');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('خطأ في الاتصال بالخادم: ' + error.message);
  }
  
  submitBtn.innerHTML = originalText;
  submitBtn.disabled = false;
});

// Logout Handler
function logout() {
  authToken = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('adminUser');
  loginPage.style.display = 'flex';
  dashboard.style.display = 'none';
}

logoutBtn.addEventListener('click', logout);

// Show Dashboard
function showDashboard() {
  loginPage.style.display = 'none';
  dashboard.style.display = 'flex';
  loadStats();
  loadRequests();
}

// Sidebar Toggle
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('show');
});

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.dataset.page;
    showPage(page);
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    // Close sidebar on mobile
    if (window.innerWidth < 992) {
      sidebar.classList.remove('show');
    }
  });
});

function showPage(pageId) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId + 'Page');
  if (page) page.classList.add('active');
  
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });
}

// ============================================
// Load Statistics
// ============================================
async function loadStats() {
  try {
    let stats;
    
    if (DEMO_MODE) {
      // Demo Mode - Calculate from localStorage
      const requests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
      stats = {
        total: requests.length,
        new: requests.filter(r => r.status === 'NEW').length,
        inReview: requests.filter(r => r.status === 'IN_REVIEW').length,
        completed: requests.filter(r => r.status === 'COMPLETED').length
      };
    } else {
      stats = await apiCall('/stats');
    }
    
    document.getElementById('totalRequests').textContent = stats.total || 0;
    document.getElementById('newRequests').textContent = stats.new || 0;
    document.getElementById('pendingRequests').textContent = stats.inReview || 0;
    document.getElementById('completedRequests').textContent = stats.completed || 0;
    
    // Update badges
    document.getElementById('newRequestsBadge').textContent = stats.new || 0;
    document.getElementById('notificationBadge').textContent = stats.new || 0;
  } catch (error) {
    console.error('Load stats error:', error);
  }
}

// ============================================
// Load Requests
// ============================================
async function loadRequests() {
  try {
    let requests;
    
    if (DEMO_MODE) {
      // Demo Mode - Load from localStorage
      requests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
    } else {
      const data = await apiCall('/contact');
      requests = data.data || data;
    }
    
    renderRecentRequests(requests.slice(0, 5));
    renderAllRequests(requests);
    renderCharts(requests);
  } catch (error) {
    console.error('Load requests error:', error);
  }
}


// Render Recent Requests Table
function renderRecentRequests(requests) {
  const tbody = document.getElementById('recentRequestsTable');
  if (!tbody) return;
  
  if (requests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">لا توجد طلبات</td></tr>';
    return;
  }
  
  tbody.innerHTML = requests.map(r => `
    <tr>
      <td>${escapeHtml(r.name) || '-'}</td>
      <td>${escapeHtml(r.subject) || '-'}</td>
      <td>${formatDate(r.createdAt)}</td>
      <td><span class="status-badge status-${getStatusClass(r.status)}">${getStatusLabel(r.status)}</span></td>
      <td>
        <button class="action-btn" onclick="viewRequest('${r.id}')">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Render All Requests Table
function renderAllRequests(requests) {
  const tbody = document.getElementById('allRequestsTable');
  if (!tbody) return;
  
  const filterEl = document.getElementById('statusFilter');
  const filter = filterEl ? filterEl.value : 'all';
  
  let filtered = requests;
  if (filter !== 'all') {
    filtered = requests.filter(r => r.status === filter);
  }
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">لا توجد طلبات</td></tr>';
    return;
  }
  
  tbody.innerHTML = filtered.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(r.name) || '-'}</td>
      <td>${escapeHtml(r.email) || '-'}</td>
      <td>${escapeHtml(r.subject) || '-'}</td>
      <td>${escapeHtml(r.budget) || '-'}</td>
      <td>${formatDate(r.createdAt)}</td>
      <td><span class="status-badge status-${getStatusClass(r.status)}">${getStatusLabel(r.status)}</span></td>
      <td>
        <button class="action-btn" onclick="viewRequest('${r.id}')" title="عرض">
          <i class="fas fa-eye"></i>
        </button>
        <button class="action-btn" onclick="deleteRequest('${r.id}')" title="حذف">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// ============================================
// View Request Details
// ============================================
let currentRequestId = null;

async function viewRequest(id) {
  currentRequestId = id;
  
  try {
    let request;
    
    if (DEMO_MODE) {
      // Demo Mode - Find from localStorage
      const requests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
      request = requests.find(r => r.id == id);
      if (!request) throw new Error('الطلب غير موجود');
    } else {
      request = await apiCall(`/contact/${id}`);
    }
    
    const statuses = [
      { value: 'NEW', label: 'جديد' },
      { value: 'IN_REVIEW', label: 'قيد المراجعة' },
      { value: 'CONTACTED', label: 'تم التواصل' },
      { value: 'CLOSED', label: 'مغلق' },
      { value: 'REJECTED', label: 'مرفوض' }
    ];
    
    document.getElementById('requestDetails').innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="request-detail">
            <label>الاسم</label>
            <p>${escapeHtml(request.name) || '-'}</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="request-detail">
            <label>البريد الإلكتروني</label>
            <p><a href="mailto:${escapeHtml(request.email)}">${escapeHtml(request.email) || '-'}</a></p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="request-detail">
            <label>الهاتف</label>
            <p>${request.phone ? `<a href="tel:${escapeHtml(request.phone)}">${escapeHtml(request.phone)}</a>` : '-'}</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="request-detail">
            <label>الشركة</label>
            <p>${escapeHtml(request.company) || '-'}</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="request-detail">
            <label>الموضوع</label>
            <p>${escapeHtml(request.subject) || '-'}</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="request-detail">
            <label>الميزانية</label>
            <p>${escapeHtml(request.budget) || '-'}</p>
          </div>
        </div>
        <div class="col-12">
          <div class="request-detail">
            <label>الرسالة</label>
            <p style="white-space: pre-wrap;">${escapeHtml(request.message) || '-'}</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="request-detail">
            <label>التاريخ</label>
            <p>${formatDate(request.createdAt)}</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="request-detail">
            <label>الحالة الحالية</label>
            <p><span class="status-badge status-${getStatusClass(request.status)}">${getStatusLabel(request.status)}</span></p>
          </div>
        </div>
      </div>
      <div class="status-select">
        <label style="width: 100%; margin-bottom: 10px;">تغيير الحالة:</label>
        ${statuses.map(s => `
          <button class="status-btn ${request.status === s.value ? 'active' : ''}" onclick="updateStatus('${id}', '${s.value}')">${s.label}</button>
        `).join('')}
      </div>
    `;
    
    new bootstrap.Modal(document.getElementById('requestModal')).show();
  } catch (error) {
    alert('خطأ في جلب بيانات الطلب');
  }
}

// Update Request Status
async function updateStatus(id, status) {
  try {
    if (DEMO_MODE) {
      // Demo Mode - Update in localStorage
      const requests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
      const index = requests.findIndex(r => r.id == id);
      if (index !== -1) {
        requests[index].status = status;
        localStorage.setItem('contactRequests', JSON.stringify(requests));
      }
    } else {
      await apiCall(`/contact/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    }
    
    loadStats();
    loadRequests();
    viewRequest(id);
  } catch (error) {
    alert('خطأ في تحديث الحالة');
  }
}

// Delete Request
async function deleteRequest(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
  
  try {
    if (DEMO_MODE) {
      // Demo Mode - Delete from localStorage
      let requests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
      requests = requests.filter(r => r.id != id);
      localStorage.setItem('contactRequests', JSON.stringify(requests));
    } else {
      await apiCall(`/contact/${id}`, { method: 'DELETE' });
    }
    
    loadStats();
    loadRequests();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('requestModal'));
    if (modal) modal.hide();
  } catch (error) {
    alert('خطأ في حذف الطلب');
  }
}

// ============================================
// Export Requests
// ============================================
async function exportRequests(format) {
  try {
    let requests;
    
    if (DEMO_MODE) {
      requests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
    } else {
      const data = await apiCall('/contact');
      requests = data.data || data;
    }
    
    if (format === 'excel') {
      let csv = 'الاسم,البريد,الهاتف,الموضوع,الميزانية,الرسالة,الحالة,التاريخ\n';
      requests.forEach(r => {
        csv += `"${r.name || ''}","${r.email || ''}","${r.phone || ''}","${r.subject || ''}","${r.budget || ''}","${(r.message || '').replace(/"/g, '""')}","${getStatusLabel(r.status)}","${formatDate(r.createdAt)}"\n`;
      });
      
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'requests_' + new Date().toISOString().split('T')[0] + '.csv';
      link.click();
    }
  } catch (error) {
    alert('خطأ في تصدير البيانات');
  }
}

// ============================================
// Charts
// ============================================
function renderCharts(requests) {
  const subjectCounts = {};
  const statusCounts = {};
  
  requests.forEach(r => {
    subjectCounts[r.subject] = (subjectCounts[r.subject] || 0) + 1;
    const statusLabel = getStatusLabel(r.status);
    statusCounts[statusLabel] = (statusCounts[statusLabel] || 0) + 1;
  });
  
  const subjectChart = document.getElementById('subjectChart');
  if (subjectChart) {
    subjectChart.innerHTML = Object.entries(subjectCounts)
      .map(([k, v]) => `<div style="margin: 10px 0;"><span>${escapeHtml(k)}: </span><strong>${v}</strong></div>`)
      .join('') || '<p>لا توجد بيانات</p>';
  }
  
  const statusChart = document.getElementById('statusChart');
  if (statusChart) {
    statusChart.innerHTML = Object.entries(statusCounts)
      .map(([k, v]) => `<div style="margin: 10px 0;"><span class="status-badge">${k}: ${v}</span></div>`)
      .join('') || '<p>لا توجد بيانات</p>';
  }
}

// ============================================
// Utility Functions
// ============================================
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getStatusClass(status) {
  const classes = {
    'NEW': 'جديد',
    'IN_REVIEW': 'قيد-المراجعة',
    'CONTACTED': 'تم-التواصل',
    'CLOSED': 'مغلق',
    'REJECTED': 'مرفوض'
  };
  return classes[status] || status || 'جديد';
}

function getStatusLabel(status) {
  const labels = {
    'NEW': 'جديد',
    'IN_REVIEW': 'قيد المراجعة',
    'CONTACTED': 'تم التواصل',
    'CLOSED': 'مغلق',
    'REJECTED': 'مرفوض'
  };
  return labels[status] || status || 'جديد';
}

// ============================================
// Event Listeners
// ============================================
document.getElementById('statusFilter')?.addEventListener('change', () => {
  loadRequests();
});

document.getElementById('searchInput')?.addEventListener('input', async (e) => {
  const term = e.target.value.toLowerCase();
  
  if (term.length < 2) {
    loadRequests();
    return;
  }
  
  try {
    const data = await apiCall(`/contact?search=${encodeURIComponent(term)}`);
    const requests = data.data || data;
    renderAllRequests(requests);
  } catch (error) {
    console.error('Search error:', error);
  }
});
