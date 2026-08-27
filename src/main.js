/**
 * Main Application Logic for E-Learning DHDI21AVL Platform
 * Trường Đại học Công nghiệp TP. Hồ Chí Minh
 */

import { api, ADMIN_CONFIG, formatPhoneNumber } from './services/api.js';
import { COURSE_INFO, ANNOUNCEMENTS, CHAPTERS, ASSIGNMENTS, SCHEDULE } from './data/courseData.js';
import { CLASS_METADATA } from './data/studentsData.js';
import { LECTURE_MATERIALS } from './data/lectureMaterials.js';

// Application State
const state = {
  currentUser: null,
  students: [],
  currentTab: 'dashboard',
  selectedClassId: 'ALL',
  selectedGroup: 'ALL',
  searchQuery: '',
  verifiedStudentData: null,
  activeModal: null,
  tempUploadedPhoto: null,
  theme: localStorage.getItem('DHDI21AVL_THEME') || 'dark',
  quizState: {}
};

window.state = state;

// =========================================================================
// 1. GLOBAL FUNCTIONS EXPORTED TO WINDOW IMMEDIATELY (ZERO-LATENCY BINDING)
// =========================================================================

window.switchTab = function(tabName) {
  if (tabName === 'admin' && (!state.currentUser || state.currentUser.role !== 'ADMIN')) {
    showToast('Chức năng Quản trị chỉ dành riêng cho Ban Quản Trị hệ thống!', 'error');
    state.currentTab = 'dashboard';
  } else if (tabName === 'courses' && (!state.currentUser || state.currentUser.role !== 'ADMIN')) {
    showToast('Học phần đang được cập nhật nội dung bài giảng & bài tập!', 'info');
    state.currentTab = 'dashboard';
  } else {
    state.currentTab = tabName || 'dashboard';
  }
  renderAppHeader();
  renderActiveTab();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.toggleTheme = function() {
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  showToast(`Đã chuyển sang giao diện ${newTheme === 'dark' ? 'Ban Đêm (Tối)' : 'Ban Ngày (Sáng)'}`, 'info');
};

window.setTheme = function(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('DHDI21AVL_THEME', theme);
  updateThemeToggleIcons();
};

window.openModal = function(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    state.activeModal = id;
  }
};

window.closeModal = function(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('active');
    state.activeModal = null;
  }
};

window.showToast = function(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? 'circle-check' : (type === 'error' ? 'triangle-exclamation' : 'circle-info');
  toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

window.handleLogout = function() {
  api.logout();
  state.currentUser = null;
  showToast('Đã đăng xuất tài khoản', 'info');
  checkAuthAndRender();
};

window.selectClassFilter = function(classId) {
  state.selectedClassId = classId;
  renderActiveTab();
};

window.selectGroupFilter = function(group) {
  state.selectedGroup = group;
  renderActiveTab();
};

window.filterAndOpenClass = function(classId) {
  state.selectedClassId = classId;
  state.selectedGroup = 'ALL';
  window.switchTab('students');
};

window.toggleChapter = function(id) {
  const el = document.getElementById(`chap-${id}`);
  if (el) el.classList.toggle('expanded');
};

window.saveAdminApiUrl = function() {
  const input = document.getElementById('adminApiUrlInput');
  if (input) {
    const url = input.value.trim();
    api.setApiUrl(url);
    showToast('Đã lưu cấu hình Máy Chủ API URL thành công!', 'success');
  }
};

window.refreshAdminData = async function() {
  showToast('Đang làm mới dữ liệu...', 'info');
  state.students = await api.getStudents();
  renderActiveTab();
  showToast('Đã cập nhật dữ liệu mới nhất!', 'success');
};

window.adminApproveStudentPhoto = async function(masv, status) {
  try {
    const res = await api.adminApprovePhoto(masv, status);
    showToast(res.message, status === 'ĐÃ DUYỆT' ? 'success' : 'info');
    
    // 1. Immediately update state from local cache for instant UI refresh
    state.students = api.getLocalStudents();
    
    // 2. If the current logged-in user is this student, update session
    if (state.currentUser && String(state.currentUser.masv).trim() === String(masv).trim()) {
      state.currentUser.photoApproved = (status === 'ĐÃ DUYỆT');
      state.currentUser.photoStatus = status;
      renderAppHeader();
    }
    
    // 3. Immediately re-render active tab view
    renderActiveTab();
  } catch (err) {
    showToast(err.message || 'Lỗi duyệt ảnh', 'error');
  }
};

// =========================================================================
// 2. INITIALIZATION (SYNCHRONOUS INSTANT RENDER + BACKGROUND SYNC)
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Instant theme init
  setTheme(state.theme);
  
  // 2. Start Live Clock
  initLiveClock();

  // 3. Load local cache immediately (0ms delay)
  state.currentUser = api.getCurrentUser();
  state.students = api.getLocalStudents();

  // 4. Initial Render immediately
  checkAuthAndRender();

  // 5. Setup event bindings
  setupGlobalEvents();

  // 6. Background sync with remote Google Sheets without blocking UI
  syncRemoteDataInBackground();
});

async function syncRemoteDataInBackground() {
  try {
    const remoteStudents = await api.getStudents();
    if (remoteStudents && remoteStudents.length > 0) {
      state.students = remoteStudents;
      if (state.currentUser) {
        renderAppHeader();
        renderActiveTab();
      }
    }
  } catch (err) {
    console.warn('Background sync:', err);
  }
}

function updateThemeToggleIcons() {
  const isDark = state.theme === 'dark';
  const iconClass = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  
  const headerBtn = document.querySelector('#headerThemeToggleBtn i');
  if (headerBtn) headerBtn.className = iconClass;

  const loginBtn = document.querySelector('#loginThemeToggleBtn i');
  if (loginBtn) loginBtn.className = iconClass;
}

function initLiveClock() {
  function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
    const el = document.getElementById('liveClockText');
    if (el) el.textContent = `${dateStr} | ${timeStr}`;
  }
  updateTime();
  setInterval(updateTime, 1000);
}

function checkAuthAndRender() {
  const authWrapper = document.getElementById('authWrapper');
  const mainApp = document.getElementById('mainApp');

  if (!state.currentUser) {
    if (authWrapper) authWrapper.style.display = 'flex';
    if (mainApp) mainApp.style.display = 'none';
    renderLoginPage();
  } else {
    if (authWrapper) authWrapper.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
    renderAppHeader();
    renderActiveTab();
  }
  updateThemeToggleIcons();
}

// ==========================================
// AUTH & LOGIN VIEWS
// ==========================================

function renderLoginPage() {
  const container = document.getElementById('authCardContent');
  if (!container) return;

  container.innerHTML = `
    <div class="auth-header">
      <div class="auth-logo-wrap">
        <img src="/logo.jpg" alt="Logo Trường" class="auth-logo" onerror="this.src='/logo.jpg'">
      </div>
      <div class="auth-university-title">TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP TP. HỒ CHÍ MINH</div>
      <h1 class="auth-title">CỔNG HỌC TẬP E-LEARNING</h1>
      <p class="auth-subtitle">Học phần: <strong>${COURSE_INFO.code} - ${COURSE_INFO.name}</strong></p>
      <div class="auth-cohort-tag">Khóa học: ${COURSE_INFO.cohort} (${COURSE_INFO.semester})</div>
    </div>

    <form id="loginForm" class="auth-form">
      <div class="form-group">
        <label class="form-label" for="loginUsername">
          <i class="fa-solid fa-id-card"></i> Tài khoản (Mã số sinh viên)
        </label>
        <div class="input-with-icon">
          <i class="fa-solid fa-user input-icon"></i>
          <input type="text" id="loginUsername" class="form-control" placeholder="Nhập mã số sinh viên (VD: 25001651)..." required autocomplete="username">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="loginPassword">
          <i class="fa-solid fa-lock"></i> Mật khẩu
        </label>
        <div class="input-with-icon">
          <i class="fa-solid fa-key input-icon"></i>
          <input type="password" id="loginPassword" class="form-control" placeholder="Nhập mật khẩu..." required autocomplete="current-password">
          <button type="button" class="toggle-pass-btn" id="toggleLoginPass">
            <i class="fa-regular fa-eye"></i>
          </button>
        </div>
      </div>

      <div class="auth-actions">
        <label class="auth-checkbox-label">
          <input type="checkbox" id="rememberMe" checked>
          <span>Ghi nhớ đăng nhập</span>
        </label>
        <a href="javascript:void(0)" id="btnOpenRegisterModal" class="auth-register-link">
          <i class="fa-solid fa-user-plus"></i> Điền thông tin kích hoạt
        </a>
      </div>

      <button type="submit" id="btnLoginSubmit" class="btn btn-primary auth-submit-btn">
        <i class="fa-solid fa-right-to-bracket"></i> Đăng nhập hệ thống
      </button>
    </form>

    <div class="auth-footer">
      <p>Chưa có mật khẩu đăng nhập? <a href="javascript:void(0)" id="btnOpenRegisterModal2" class="auth-register-link">Điền thông tin kích hoạt tài khoản</a></p>
    </div>

    <div class="auth-demo-hint">
      <p>💡 <strong>Hướng dẫn đăng nhập:</strong></p>
      <p>• Sinh viên: Nhập <strong>Mã số sinh viên</strong> và mật khẩu đã nhận qua Email (nếu chưa kích hoạt, hãy bấm <em>"Điền thông tin kích hoạt"</em> để nhận mật khẩu).</p>
    </div>
  `;

  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('toggleLoginPass')?.addEventListener('click', () => {
    const input = document.getElementById('loginPassword');
    const icon = document.querySelector('#toggleLoginPass i');
    if (input && icon) {
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-regular fa-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'fa-regular fa-eye';
      }
    }
  });

  document.getElementById('btnOpenRegisterModal')?.addEventListener('click', openRegisterModal);
  document.getElementById('btnOpenRegisterModal2')?.addEventListener('click', openRegisterModal);
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('btnLoginSubmit');
  const user = document.getElementById('loginUsername')?.value.trim();
  const pass = document.getElementById('loginPassword')?.value.trim();

  if (!user || !pass) {
    showToast('Vui lòng nhập đầy đủ tài khoản và mật khẩu', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner spin"></i> Đang xác thực...`;
  }

  try {
    const result = await api.login(user, pass);
    if (result.success) {
      state.currentUser = result.user;
      showToast(result.message || 'Đăng nhập thành công!', 'success');
      state.students = api.getLocalStudents();
      checkAuthAndRender();
    } else {
      showToast(result.message || 'Đăng nhập thất bại', 'error');
    }
  } catch (error) {
    showToast(error.message || 'Lỗi đăng nhập', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Đăng nhập hệ thống`;
    }
  }
}

// ==========================================
// APP HEADER & TABS
// ==========================================

function renderAppHeader() {
  const user = state.currentUser;
  const userAvatar = document.getElementById('headerUserAvatar');
  const userName = document.getElementById('headerUserName');
  const userRole = document.getElementById('headerUserRole');
  const userPhotoDot = document.getElementById('userPhotoStatusDot');
  const dropdownUserName = document.getElementById('dropdownUserName');
  const dropdownUserRole = document.getElementById('dropdownUserRole');

  if (user) {
    if (user.role === 'ADMIN') {
      if (userName) userName.textContent = user.fullname;
      if (userRole) userRole.textContent = 'Quản trị viên';
      if (dropdownUserName) dropdownUserName.textContent = user.fullname;
      if (dropdownUserRole) dropdownUserRole.textContent = 'Ban Quản Trị';
      if (userAvatar) userAvatar.innerHTML = `<i class="fa-solid fa-user-shield" style="font-size: 1.1rem; color: #f59e0b;"></i>`;
      if (userPhotoDot) userPhotoDot.style.display = 'none';
    } else {
      if (userName) userName.textContent = user.fullname;
      if (userRole) userRole.textContent = `${user.lop} • Tổ ${user.nhom || '1'}`;
      if (dropdownUserName) dropdownUserName.textContent = user.fullname;
      if (dropdownUserRole) dropdownUserRole.textContent = `Mã SV: ${user.masv}`;
      if (userAvatar) {
        if (user.anh3x4) {
          userAvatar.innerHTML = `<img src="${user.anh3x4}" class="user-avatar-img" alt="3x4">`;
        } else {
          const initials = user.ten ? user.ten.charAt(0) : 'SV';
          userAvatar.innerHTML = `<span>${initials}</span>`;
        }
      }
      if (userPhotoDot) {
        userPhotoDot.style.display = 'block';
        userPhotoDot.className = `user-status-dot ${user.photoApproved ? '' : 'pending'}`;
      }
    }
  }

  const isAdmin = user && user.role === 'ADMIN';

  // 1. Hide or Show Admin Tab on Navbar based on user role
  const adminNavBtn = document.getElementById('navTabAdminBtn') || document.querySelector('.nav-tab-btn[data-tab="admin"]');
  if (adminNavBtn) {
    adminNavBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  }

  // 2. Hide or Show Courses Tab on Navbar based on user role (Only Admin can see)
  const coursesNavBtn = document.getElementById('navTabCoursesBtn') || document.querySelector('.nav-tab-btn[data-tab="courses"]');
  if (coursesNavBtn) {
    coursesNavBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  }

  // 3. Hide or Show Admin Dropdown Item based on user role
  const adminDropdownItem = document.getElementById('dropdownAdminItem');
  if (adminDropdownItem) {
    adminDropdownItem.style.display = isAdmin ? 'flex' : 'none';
  }

  // Update active tab button classes
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    const tab = btn.getAttribute('data-tab');
    if (tab === state.currentTab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  updateThemeToggleIcons();
}

function renderActiveTab() {
  const contentArea = document.getElementById('mainContentArea');
  if (!contentArea) return;

  switch (state.currentTab) {
    case 'dashboard':
      contentArea.innerHTML = renderDashboardView();
      break;

    case 'students':
      contentArea.innerHTML = renderStudentsView();
      bindStudentsEvents();
      break;

    case 'courses':
      contentArea.innerHTML = renderCoursesView();
      break;

    case 'support':
      contentArea.innerHTML = renderSupportView();
      break;

    case 'admin':
      contentArea.innerHTML = renderAdminView();
      break;

    default:
      contentArea.innerHTML = renderDashboardView();
      break;
  }
}

// ==========================================
// 1. DASHBOARD VIEW
// ==========================================

function renderDashboardView() {
  const totalRegistered = state.students.filter(s => s.isRegistered || (s.matkhau && s.email)).length;
  const approvedPhotos = state.students.filter(s => s.photoApproved).length;

  return `
    <div class="dashboard-container">
      <div class="course-hero-card">
        <div class="hero-glow-pattern"></div>
        <div class="hero-content">
          <div class="hero-main-info">
            <div class="hero-badge-group">
              <span class="badge badge-primary"><i class="fa-solid fa-graduation-cap"></i> ${COURSE_INFO.degree}</span>
              <span class="badge badge-success"><i class="fa-solid fa-book-open"></i> ${COURSE_INFO.credits} Tín chỉ</span>
              <span class="badge badge-warning"><i class="fa-solid fa-calendar-check"></i> ${COURSE_INFO.semester}</span>
            </div>
            <h1 class="hero-title">${COURSE_INFO.code} - ${COURSE_INFO.name}</h1>
            <p class="hero-desc">${COURSE_INFO.description}</p>
            
            <div class="hero-instructor-card">
              <img src="${COURSE_INFO.instructor.avatar}" class="instructor-avatar" alt="Giảng viên">
              <div class="instructor-info">
                <h5>${COURSE_INFO.instructor.name}</h5>
                <p>${COURSE_INFO.instructor.title}</p>
              </div>
            </div>
          </div>

          <div class="hero-quick-actions">
            <div class="quick-action-title"><i class="fa-solid fa-bolt"></i> Thao tác nhanh</div>
            <button class="btn btn-primary btn-sm" onclick="switchTab('students')">
              <i class="fa-solid fa-users"></i> Xem Danh sách 5 Lớp
            </button>
            <button class="btn btn-accent btn-sm" onclick="switchTab('support')">
              <i class="fa-solid fa-chalkboard-user"></i> Chương trình Hỗ trợ SP
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openPhotoUploadModal()">
              <i class="fa-solid fa-camera"></i> Cập nhật Ảnh 3x4
            </button>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon-wrap stat-icon-blue">
            <i class="fa-solid fa-user-graduate"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">${COURSE_INFO.totalStudents}</div>
            <div class="stat-label">Tổng sinh viên (5 Lớp)</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap stat-icon-green">
            <i class="fa-solid fa-id-card-clip"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">${totalRegistered} / ${COURSE_INFO.totalStudents}</div>
            <div class="stat-label">Đã kích hoạt tài khoản</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap stat-icon-amber">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">${approvedPhotos}</div>
            <div class="stat-label">Ảnh 3x4 đã duyệt</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap stat-icon-purple">
            <i class="fa-solid fa-layer-group"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">5 Lớp</div>
            <div class="stat-label">Điện - Điện tử VLVH</div>
          </div>
        </div>
      </div>

      <div class="dashboard-layout">
        <div class="dashboard-main-col">
          <div class="section-header">
            <h2 class="section-title"><i class="fa-solid fa-bullhorn" style="color: #2563eb;"></i> Thông báo học tập mới nhất</h2>
          </div>

          <div class="announcements-list">
            ${ANNOUNCEMENTS.map(a => `
              <div class="announcement-item">
                <div class="announcement-top">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="badge badge-${a.type === 'important' ? 'danger' : (a.type === 'success' ? 'success' : 'primary')}">${a.badge}</span>
                    <h4 class="announcement-title">${a.title}</h4>
                  </div>
                  <span class="announcement-date"><i class="fa-regular fa-clock"></i> ${a.date}</span>
                </div>
                <p class="announcement-body">${a.content}</p>
              </div>
            `).join('')}
          </div>

          <div class="section-header" style="margin-top: 10px;">
            <h2 class="section-title"><i class="fa-solid fa-list-check" style="color: #059669;"></i> Tiến độ bài giảng</h2>
          </div>

          <div class="stat-card" style="padding: 32px 20px; text-align: center; color: var(--text-muted); border: 1px dashed var(--border-subtle); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(5, 150, 105, 0.12); color: #059669; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 2px;">
              <i class="fa-solid fa-hourglass-half"></i>
            </div>
            <h4 style="color: var(--text-title); font-size: 1.08rem; font-weight: 700; margin: 0;">Đang cập nhật</h4>
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0; max-width: 440px;">Hệ thống bài giảng, slide và bài tập trắc nghiệm đang được cập nhật và sẽ mở theo lịch trình giảng dạy của học phần.</p>
          </div>
        </div>

        <div class="dashboard-side-col">
          <div class="section-header">
            <h2 class="section-title"><i class="fa-solid fa-calendar-days" style="color: #d97706;"></i> Lịch học & Sự kiện</h2>
          </div>

          <div class="stat-card" style="padding: 32px 20px; text-align: center; color: var(--text-muted); border: 1px dashed var(--border-subtle); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(217, 119, 6, 0.12); color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 2px;">
              <i class="fa-solid fa-calendar-check"></i>
            </div>
            <h4 style="color: var(--text-title); font-size: 1.08rem; font-weight: 700; margin: 0;">Đang cập nhật</h4>
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0;">Thời khóa biểu và lịch học chi tiết các tuần sẽ được thông báo sớm nhất.</p>
          </div>

          <div class="section-header" style="margin-top: 10px;">
            <h2 class="section-title"><i class="fa-solid fa-school" style="color: #7c3aed;"></i> 5 Lớp học thuộc khóa</h2>
          </div>

          <div class="stat-card" style="display: flex; flex-direction: column; align-items: stretch; gap: 10px; padding: 16px;">
            ${CLASS_METADATA.map(c => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-glass-strong); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); cursor: pointer;" onclick="filterAndOpenClass('${c.id}')">
                <div>
                  <strong style="color: var(--text-title); font-size: 0.92rem;">${c.id}</strong>
                  <div style="font-size: 0.78rem; color: var(--text-muted);">${c.name}</div>
                </div>
                <span class="badge badge-primary">${getClassCount(c)} SV</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function isStudentInClass(s, targetMeta) {
  if (!s || !targetMeta) return false;

  // 1. Khớp chính xác theo vị trí Sheet (sheetIndex: 0..4)
  if (s.sheetIndex !== undefined && targetMeta.sheetIndex !== undefined) {
    if (s.sheetIndex === targetMeta.sheetIndex) return true;
  }

  // 2. Khớp theo tên Sheet ("Sheet1", "Sheet1 (2)", ...)
  if (s.sheet && targetMeta.sheet && s.sheet === targetMeta.sheet) return true;
  if (s.sheetName && targetMeta.sheet && s.sheetName === targetMeta.sheet) return true;

  // 3. Khớp theo Mã Lớp ở đầu chuỗi className (startsWith để tránh nhầm mã 423701046702 ở đuôi của lớp 5)
  if (s.className && targetMeta.code) {
    if (s.className.startsWith(targetMeta.code)) return true;
  }

  // 4. Khớp theo Lớp ID
  if (s.lop && targetMeta.id) {
    if (targetMeta.id === 'DHDI19BVL_GL') {
      return s.lop === 'DHDI19BVL' || s.lop === 'DHDI20BVL';
    }
    if (s.lop === targetMeta.id) return true;
  }

  return false;
}

function getClassCount(targetMeta) {
  if (!state.students || state.students.length === 0) return targetMeta.count || 0;
  const count = state.students.filter(s => isStudentInClass(s, targetMeta)).length;
  return count || targetMeta.count || 0;
}

// ==========================================
// 2. STUDENTS GRID VIEW
// ==========================================

function renderStudentsView() {
  const filtered = getFilteredStudents();

  return `
    <div class="students-container">
      <div class="students-header-panel">
        <div class="students-title-group">
          <h2><i class="fa-solid fa-users-viewfinder" style="color: #2563eb;"></i> Danh Sách 5 Lớp Khóa DHDI21AVL</h2>
          <p>Hiển thị danh sách sinh viên dạng lưới theo Lớp & Tổ, bấm vào từng sinh viên để xem chi tiết thông tin và ảnh thẻ 3x4.</p>
        </div>

        <div class="students-controls">
          <div class="search-input-wrap">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" id="studentSearchInput" class="form-control" placeholder="Tìm theo tên, Mã SV, số điện thoại..." value="${state.searchQuery}">
          </div>

          <button class="btn btn-secondary btn-sm" onclick="openPhotoUploadModal()">
            <i class="fa-solid fa-camera"></i> Cập nhật ảnh 3x4
          </button>
        </div>
      </div>

      <div class="class-tabs-scroll">
        <button class="class-pill-btn ${state.selectedClassId === 'ALL' ? 'active' : ''}" onclick="selectClassFilter('ALL')">
          <i class="fa-solid fa-layer-group"></i> Tất cả 5 Lớp <span class="class-pill-count">${state.students.length || 70}</span>
        </button>
        ${CLASS_METADATA.map(c => `
          <button class="class-pill-btn ${state.selectedClassId === c.id ? 'active' : ''}" onclick="selectClassFilter('${c.id}')">
            ${c.id} <span class="class-pill-count">${getClassCount(c)}</span>
          </button>
        `).join('')}
      </div>

      <div class="group-filter-bar">
        <span class="group-filter-label"><i class="fa-solid fa-filter"></i> Lọc theo Tổ:</span>
        <button class="group-chip ${state.selectedGroup === 'ALL' ? 'active' : ''}" onclick="selectGroupFilter('ALL')">Tất cả tổ</button>
        <button class="group-chip ${state.selectedGroup === '1' ? 'active' : ''}" onclick="selectGroupFilter('1')">Tổ / Nhóm 1</button>
        <button class="group-chip ${state.selectedGroup === '2' ? 'active' : ''}" onclick="selectGroupFilter('2')">Tổ / Nhóm 2</button>
        <button class="group-chip ${state.selectedGroup === '3' ? 'active' : ''}" onclick="selectGroupFilter('3')">Tổ / Nhóm 3</button>
        <button class="group-chip ${state.selectedGroup === '4' ? 'active' : ''}" onclick="selectGroupFilter('4')">Tổ / Nhóm 4</button>
      </div>

      <div class="class-sections-wrapper">
        ${renderClassSections(filtered)}
      </div>
    </div>
  `;
}

function getFilteredStudents() {
  return state.students.filter(s => {
    if (state.selectedClassId !== 'ALL') {
      const targetMeta = CLASS_METADATA.find(m => m.id === state.selectedClassId || m.code === state.selectedClassId);
      if (targetMeta && !isStudentInClass(s, targetMeta)) {
        return false;
      }
    }

    if (state.selectedGroup !== 'ALL') {
      if (String(s.nhom).trim() !== String(state.selectedGroup).trim()) {
        return false;
      }
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase().trim();
      const matchName = (s.fullname || `${s.hodem || ''} ${s.ten || ''}`).toLowerCase().includes(q);
      const matchId = String(s.masv || '').toLowerCase().includes(q);
      const matchPhone = String(s.sdt || '').includes(q);
      const matchEmail = String(s.email || '').toLowerCase().includes(q);
      const matchLop = String(s.lop || '').toLowerCase().includes(q);
      const matchGender = String(s.gioitinh || '').toLowerCase() === q;
      if (!matchName && !matchId && !matchPhone && !matchEmail && !matchLop && !matchGender) return false;
    }

    return true;
  });
}

function renderClassSections(students) {
  if (students.length === 0) {
    return `
      <div class="stat-card empty-students-notice">
        <i class="fa-solid fa-user-slash"></i>
        <h3>Không tìm thấy sinh viên phù hợp</h3>
        <p>Thử đổi điều kiện tìm kiếm hoặc chọn lại lớp học / tổ nhóm khác.</p>
      </div>
    `;
  }

  const renderedSections = [];
  const matchedStudentIds = new Set();

  CLASS_METADATA.forEach(c => {
    const classList = students.filter(s => isStudentInClass(s, c));
    if (classList.length > 0) {
      classList.forEach(s => matchedStudentIds.add(s.masv));
      renderedSections.push(`
        <div class="class-section-block">
          <div class="class-section-title-wrap">
            <div class="class-section-title">
              <i class="fa-solid fa-graduation-cap" style="color: #2563eb;"></i>
              <span>${c.code} - ${c.name}</span>
              <span class="badge badge-primary">${classList.length} Sinh viên</span>
            </div>
          </div>

          <div class="students-grid">
            ${classList.map(s => renderStudentCard(s)).join('')}
          </div>
        </div>
      `);
    }
  });

  const unclassified = students.filter(s => !matchedStudentIds.has(s.masv));
  if (unclassified.length > 0) {
    renderedSections.push(`
      <div class="class-section-block">
        <div class="class-section-title-wrap">
          <div class="class-section-title">
            <i class="fa-solid fa-graduation-cap" style="color: #2563eb;"></i>
            <span>Khác</span>
            <span class="badge badge-primary">${unclassified.length} Sinh viên</span>
          </div>
        </div>

        <div class="students-grid">
          ${unclassified.map(s => renderStudentCard(s)).join('')}
        </div>
      </div>
    `);
  }

  return renderedSections.join('');
}

function renderStudentCard(s) {
  const fullname = s.fullname || `${s.hodem || ''} ${s.ten || ''}`.trim();
  const initials = s.ten ? s.ten.charAt(0) : 'SV';
  const hasPhoto = !!s.anh3x4;
  const isApproved = !!s.photoApproved;

  let statusTag = '';
  if (isApproved) {
    statusTag = `<span class="photo-status-tag approved"><i class="fa-solid fa-circle-check"></i> Đã duyệt</span>`;
  } else if (hasPhoto) {
    statusTag = `<span class="photo-status-tag pending"><i class="fa-solid fa-hourglass-half"></i> Chờ duyệt</span>`;
  } else {
    statusTag = `<span class="photo-status-tag none">Chưa có ảnh</span>`;
  }

  return `
    <div class="student-card" onclick="openStudentDetailModal('${s.masv}')">
      <div class="student-photo-wrapper">
        ${hasPhoto 
          ? `<img src="${s.anh3x4}" class="student-photo-img" alt="${fullname}">` 
          : `<div class="student-photo-placeholder">
               <span class="placeholder-initials">${initials}</span>
               <span class="placeholder-ratio">Ảnh 3x4</span>
             </div>`
        }
        ${statusTag}
      </div>

      <h4 class="student-card-name">${fullname}</h4>
      <div class="student-card-id">${s.masv}</div>

      <div class="student-meta-chips">
        <span class="meta-chip">Lớp: ${s.lop}</span>
        <span class="meta-chip">Tổ ${s.nhom || '1'}</span>
        ${s.gioitinh ? `<span class="meta-chip" style="${s.gioitinh.toLowerCase() === 'nữ' ? 'color: #ec4899; background: rgba(236, 72, 153, 0.1);' : 'color: #2563eb; background: rgba(37, 99, 235, 0.1);'}">${s.gioitinh.toLowerCase() === 'nữ' ? '<i class="fa-solid fa-venus"></i>' : '<i class="fa-solid fa-mars"></i>'} ${s.gioitinh}</span>` : ''}
      </div>

      <div class="student-card-footer">
        <span>${s.email ? '<i class="fa-solid fa-envelope" style="color: #10b981;"></i> Đã kích hoạt' : '<i class="fa-solid fa-circle-xmark"></i> Chưa kích hoạt'}</span>
        <span style="color: var(--primary); font-weight: 600;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Chi tiết</span>
      </div>
    </div>
  `;
}

function bindStudentsEvents() {
  const searchInput = document.getElementById('studentSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      const filtered = getFilteredStudents();
      const wrap = document.querySelector('.class-sections-wrapper');
      if (wrap) wrap.innerHTML = renderClassSections(filtered);
    });
  }
}

// ==========================================
// 3. COURSES & LESSONS VIEW
// ==========================================

function renderCoursesView() {
  return `
    <div class="courses-container">
      <div class="stat-card" style="display: flex; flex-direction: column; align-items: stretch; padding: 28px;">
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 1.6rem; color: var(--text-title);"><i class="fa-solid fa-book" style="color: #2563eb;"></i> Đề Cương & Bài Giảng Trực Tuyến</h2>
          <p style="color: var(--text-secondary); margin-top: 4px;">Toàn bộ video bài giảng, slide PDF tài liệu và bài tập cho khóa học Nhà máy điện và trạm biến áp.</p>
        </div>

        <div class="course-modules-list">
          ${CHAPTERS.map(chap => `
            <div class="module-card expanded" id="chap-${chap.id}">
              <div class="module-header" onclick="toggleChapter(${chap.id})">
                <div class="module-title-group">
                  <span class="module-week-tag">${chap.week}</span>
                  <h4 class="module-title">${chap.title}</h4>
                </div>
                <div class="module-meta">
                  <div class="module-progress-bar-wrap">
                    <div class="module-progress-fill" style="width: ${chap.progress}%"></div>
                  </div>
                  <span style="font-size: 0.85rem; color: var(--text-muted);">${chap.progress}%</span>
                  <i class="fa-solid fa-chevron-down module-toggle-icon"></i>
                </div>
              </div>
              <div class="module-body">
                ${chap.items.map(item => `
                  <div class="lesson-item">
                    <div class="lesson-left">
                      <div class="lesson-icon icon-${item.type}">
                        <i class="fa-solid fa-${item.type === 'video' ? 'play' : (item.type === 'pdf' ? 'file-pdf' : (item.type === 'quiz' ? 'circle-question' : 'pencil'))}"></i>
                      </div>
                      <div>
                        <div class="lesson-title">${item.title}</div>
                        <div class="lesson-sub">${item.duration || item.size || item.deadline || 'Tài liệu bắt buộc'}</div>
                      </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span class="badge ${item.completed ? 'badge-success' : 'badge-muted'}">
                        ${item.completed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                      </span>
                      <button class="btn btn-secondary btn-sm" onclick="openLessonViewer('${item.id}')">
                        <i class="fa-solid fa-eye"></i> Xem bài học
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="stat-card" style="display: flex; flex-direction: column; align-items: stretch; padding: 28px;">
        <h2 style="font-size: 1.45rem; color: var(--text-title); margin-bottom: 18px;">
          <i class="fa-solid fa-file-pen" style="color: #d97706;"></i> Bài Tập & Nhiệm Vụ Đồ Án
        </h2>
        <div class="assignments-grid">
          ${ASSIGNMENTS.map(asg => `
            <div class="assignment-card">
              <div class="assignment-top">
                <span class="badge badge-warning">${asg.status}</span>
                <span style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-regular fa-clock"></i> ${asg.deadline}</span>
              </div>
              <h3 class="assignment-title">${asg.title}</h3>
              <div class="assignment-reqs"><strong>Yêu cầu:</strong> ${asg.requirements}</div>
              <div class="assignment-footer">
                <span style="font-size: 0.85rem; color: var(--primary);">Thang điểm: <strong>${asg.maxScore}</strong></span>
                <button class="btn btn-primary btn-sm" onclick="openLessonViewer('${asg.id}')">
                  <i class="fa-solid fa-upload"></i> Chi tiết & Nộp bài
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 4. SUPPORT PROGRAM VIEW
// ==========================================

function renderSupportView() {
  const user = state.currentUser;
  const isApproved = user && (user.role === 'ADMIN' || user.photoApproved);
  const hasPhoto = user && !!user.anh3x4;

  return `
    <div class="support-container">
      <div class="support-hero-banner">
        <div class="support-hero-text">
          <h1><i class="fa-solid fa-chalkboard-user"></i> Chương Trình Hỗ Trợ Sư Phạm</h1>
          <p>
            Chương trình đào tạo, đồng hành sư phạm và bổ trợ kỹ năng thực tế dành riêng cho sinh viên khóa DHDI21AVL. 
            Theo dõi video giới thiệu và cập nhật đầy đủ hồ sơ ảnh thẻ 3x4 để mở khóa quyền truy cập trực tiếp vào hệ thống chương trình.
          </p>
        </div>
      </div>

      <div class="support-video-wrapper">
        <div class="section-header">
          <h2 class="section-title"><i class="fa-brands fa-youtube" style="color: #ef4444;"></i> Video Giới Thiệu Chương Trình Sư Phạm</h2>
        </div>
        <div class="video-frame-card">
          <iframe 
            src="${COURSE_INFO.supportVideoEmbed}" 
            title="Video Giới thiệu Chương trình Hỗ trợ Sư phạm" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen>
          </iframe>
        </div>
      </div>

      <div class="support-access-card">
        <div class="access-status-box">
          <div class="access-icon-circle ${isApproved ? 'unlocked' : 'locked'}">
            <i class="fa-solid ${isApproved ? 'fa-lock-open' : 'fa-lock'}"></i>
          </div>
          <div class="access-details">
            <h3>Quyền Truy Cập Chương Trình</h3>
            <p>
              ${isApproved 
                ? '✅ Hồ sơ của bạn đã được xác thực ảnh 3x4 và phê duyệt bởi Ban Quản trị. Bạn có toàn quyền truy cập chương trình!' 
                : (hasPhoto 
                    ? '⏳ Ảnh thẻ 3x4 của bạn đã được tải lên và đang trong danh sách <strong>CHỜ DUYỆT</strong> bởi Ban Quản trị.' 
                    : '❌ Bạn chưa tải lên ảnh thẻ 3x4. Vui lòng cập nhật ảnh thẻ để Ban Quản trị duyệt và mở khóa nút truy cập.')
              }
            </p>
          </div>
        </div>

        <div class="access-action-wrap">
          ${isApproved ? `
            <a href="${COURSE_INFO.supportProgramUrl}" target="_blank" class="btn btn-accent btn-lg" style="box-shadow: 0 0 25px var(--accent-glow);">
              <i class="fa-solid fa-play"></i> Mở Chương Trình Mô Phỏng Tương Tác
            </a>
            <small style="color: var(--accent); font-size: 0.8rem; font-weight: 600;">Mô phỏng tương tác — Chương 3: Khí cụ điện và hồ quang</small>
          ` : `
            <button class="btn btn-secondary btn-lg" disabled title="Vui lòng cập nhật ảnh 3x4 và chờ duyệt">
              <i class="fa-solid fa-lock"></i> Chưa Đủ Điều Kiện Truy Cập
            </button>
            <button class="btn btn-primary btn-sm" onclick="openPhotoUploadModal()" style="margin-top: 8px;">
              <i class="fa-solid fa-camera"></i> ${hasPhoto ? 'Cập nhật lại ảnh 3x4' : 'Tải lên Ảnh 3x4 ngay'}
            </button>
          `}
        </div>
      </div>

      ${(user && user.role === 'ADMIN') ? `
      <div class="support-features-grid">
        <div class="feature-card">
          <div class="feature-icon-box"><i class="fa-solid fa-chalkboard"></i></div>
          <h4>Hỗ Trợ Phương Pháp Sư Phạm</h4>
          <p>Cung cấp kỹ năng thuyết trình kỹ thuật, xây dựng giáo án bài giảng và mô phỏng thực hành trạm biến áp chuyên nghiệp.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon-box"><i class="fa-solid fa-network-wired"></i></div>
          <h4>Tài Liệu Chuyên Môn Ngành Điện</h4>
          <p>Kho tài liệu tiêu chuẩn EVN, bản vẽ mẫu TBA 110kV/22kV và các quy trình vận hành an toàn điện hiện đại nhất.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon-box"><i class="fa-solid fa-certificate"></i></div>
          <h4>Chứng Nhận Hoàn Thành</h4>
          <p>Cấp chứng nhận hoàn thành khóa hỗ trợ sư phạm kỹ thuật cho toàn bộ học viên đạt chuẩn hồ sơ và bài kiểm tra.</p>
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

// ==========================================
// 5. ADMIN VIEW & MODERATION
// ==========================================

function renderAdminView() {
  const pendingPhotos = state.students.filter(s => s.anh3x4 && !s.photoApproved);
  const approvedPhotos = state.students.filter(s => s.photoApproved);
  const registeredCount = state.students.filter(s => s.isRegistered || (s.matkhau && s.email)).length;

  return `
    <div class="admin-container">
      <div class="admin-header">
        <div>
          <h2 style="font-size: 1.6rem; color: var(--text-title);"><i class="fa-solid fa-shield-halved" style="color: #d97706;"></i> Bảng Quản Trị Hệ Thống E-Learning</h2>
          <p style="color: var(--text-secondary); margin-top: 4px;">Duyệt ảnh thẻ 3x4 sinh viên và quản lý danh sách học viên 5 lớp khóa DHDI21AVL.</p>
        </div>
        <button class="btn btn-secondary" onclick="refreshAdminData()">
          <i class="fa-solid fa-rotate"></i> Làm mới dữ liệu
        </button>
      </div>

      <div class="admin-stats-bar">
        <div class="admin-stat-box">
          <div class="admin-stat-num">${state.students.length}</div>
          <div class="admin-stat-title">Tổng Sinh viên</div>
        </div>
        <div class="admin-stat-box">
          <div class="admin-stat-num" style="color: #2563eb;">${registeredCount}</div>
          <div class="admin-stat-title">Đã có tài khoản</div>
        </div>
        <div class="admin-stat-box">
          <div class="admin-stat-num" style="color: #d97706;">${pendingPhotos.length}</div>
          <div class="admin-stat-title">Ảnh Chờ Phê Duyệt</div>
        </div>
        <div class="admin-stat-box">
          <div class="admin-stat-num" style="color: #059669;">${approvedPhotos.length}</div>
          <div class="admin-stat-title">Ảnh Đã Phê Duyệt</div>
        </div>
      </div>

      <div class="stat-card" style="display: flex; flex-direction: column; align-items: stretch; padding: 28px;">
        <div class="section-header">
          <h3 class="section-title"><i class="fa-solid fa-images" style="color: #059669;"></i> Danh Sách Ảnh 3x4 Cần Phê Duyệt (${pendingPhotos.length})</h3>
        </div>

        ${pendingPhotos.length === 0 ? `
          <div style="text-align: center; padding: 40px; color: var(--text-muted);">
            <i class="fa-solid fa-circle-check" style="font-size: 2.5rem; color: #10b981; margin-bottom: 10px;"></i>
            <p>Tuyệt vời! Hiện không có ảnh 3x4 nào đang chờ duyệt.</p>
          </div>
        ` : `
          <div class="admin-queue-grid">
            ${pendingPhotos.map(s => `
              <div class="queue-card">
                <div class="queue-photo-box">
                  <img src="${s.anh3x4}" class="queue-photo-img" alt="${s.fullname}">
                </div>
                <div class="queue-student-info">
                  <h4>${s.fullname || `${s.hodem || ''} ${s.ten || ''}`}</h4>
                  <p>Mã SV: ${s.masv}</p>
                  <div class="queue-student-class">${s.lop} • Tổ ${s.nhom || '1'}</div>
                </div>
                <div class="queue-actions">
                  <button class="btn btn-accent btn-sm" onclick="adminApproveStudentPhoto('${s.masv}', 'ĐÃ DUYỆT')">
                    <i class="fa-solid fa-check"></i> Duyệt
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="adminApproveStudentPhoto('${s.masv}', 'TỪ CHỐI')">
                    <i class="fa-solid fa-xmark"></i> Từ chối
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

// ==========================================
// 6. LESSON & COURSE MATERIAL VIEWER MODAL
// ==========================================

window.openLessonViewer = function(itemId) {
  const modal = document.getElementById('lessonViewerModal');
  const titleEl = document.getElementById('lessonViewerTitle');
  const bodyEl = document.getElementById('lessonViewerBody');
  if (!modal || !bodyEl) return;

  const mat = LECTURE_MATERIALS[itemId];
  const asg = ASSIGNMENTS.find(a => a.id === itemId);

  if (mat) {
    if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-book-open" style="color: #60a5fa;"></i> ${mat.title}`;
    
    if (mat.type === 'video') {
      bodyEl.innerHTML = `
        <div class="lesson-modal-content">
          <div class="lesson-meta-bar">
            <span><i class="fa-solid fa-film" style="color: #ef4444;"></i> Video Bài Giảng Trực Tuyến</span>
            <span class="badge badge-primary"><i class="fa-regular fa-clock"></i> Thời lượng: ${mat.duration}</span>
          </div>

          <div class="lesson-video-box">
            <iframe src="${mat.videoEmbedUrl}" allowfullscreen title="${mat.title}"></iframe>
          </div>

          <div class="lesson-doc-reader">
            <h3><i class="fa-solid fa-list-ul"></i> Tóm Tắt Trọng Tâm Bài Giảng</h3>
            <p style="margin-bottom: 16px;">${mat.description}</p>
            ${mat.sections ? mat.sections.map(sec => `
              <h4>${sec.heading}</h4>
              <div>${sec.content}</div>
            `).join('') : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <button class="btn btn-secondary" onclick="closeModal('lessonViewerModal')">Đóng cửa sổ</button>
            <button class="btn btn-primary" onclick="showToast('Đã ghi nhận hoàn thành bài học!', 'success'); closeModal('lessonViewerModal');">
              <i class="fa-solid fa-circle-check"></i> Đánh dấu đã học xong
            </button>
          </div>
        </div>
      `;
    } else if (mat.type === 'pdf' || mat.type === 'doc') {
      const isDocType = mat.type === 'doc' || mat.id === '1.3';
      const typeBadgeIcon = isDocType ? 'fa-book-bookmark' : 'fa-file-pdf';
      const typeBadgeColor = isDocType ? '#059669' : '#d97706';
      const typeBadgeTitle = isDocType ? 'Tài Liệu Đọc Thêm / Hồ Sơ Tiêu Chuẩn Kỹ Thuật EVN' : 'Slide Bài Giảng / Giáo Trình Trực Tuyến';
      const typeBadgeClass = isDocType ? 'badge-success' : 'badge-warning';
      const typeBadgeText = isDocType ? (mat.size + ' • File Chuẩn EVN') : (mat.size + ' • ' + (mat.pages ? mat.pages + ' Trang' : 'PDF Chuẩn'));
      const downloadBtnText = (mat.driveFolderUrl || mat.fileUrl) ? 'Tải File Tài Liệu EVN' : 'Tải tài liệu về máy';

      bodyEl.innerHTML = `
        <div class="lesson-modal-content">
          <div class="lesson-meta-bar">
            <span><i class="fa-solid ${typeBadgeIcon}" style="color: ${typeBadgeColor};"></i> ${typeBadgeTitle}</span>
            <span class="badge ${typeBadgeClass}">${typeBadgeText}</span>
          </div>

          <div class="lesson-doc-reader">
            ${mat.contentSummary}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-secondary" onclick="closeModal('lessonViewerModal')">Đóng</button>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-secondary" onclick="printLectureDocument('${mat.id}')">
                <i class="fa-solid fa-print"></i> In / Xuất PDF
              </button>
              <button class="btn btn-primary" onclick="downloadLectureDocument('${mat.id}')">
                <i class="fa-solid fa-file-arrow-down"></i> ${downloadBtnText}
              </button>
            </div>
          </div>
        </div>
      `;
    } else if (mat.type === 'quiz') {
      state.quizState = {
        answers: {},
        submitted: false
      };
      renderQuizContent(mat);
    } else if (mat.type === 'exercise') {
      bodyEl.innerHTML = `
        <div class="lesson-modal-content">
          <div class="lesson-meta-bar">
            <span><i class="fa-solid fa-pencil" style="color: #9333ea;"></i> Nhiệm Vụ Bài Tập Thực Hành</span>
            <span class="badge badge-danger">Hạn chót: ${mat.deadline}</span>
          </div>

          <div class="lesson-doc-reader">
            ${mat.specification}
          </div>

          <div style="background: var(--bg-glass-strong); padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <h4 style="margin-bottom: 10px; color: var(--text-title);"><i class="fa-solid fa-cloud-arrow-up" style="color: #2563eb;"></i> Nộp bài làm của bạn</h4>
            <div class="form-group">
              <input type="text" id="asgSubmitLink" class="form-control" placeholder="Dán link Google Drive hoặc GitHub báo cáo bài làm...">
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
              <button class="btn btn-secondary" onclick="closeModal('lessonViewerModal')">Đóng</button>
              <button class="btn btn-accent" onclick="handleAssignmentSubmit('${mat.id}')">
                <i class="fa-solid fa-paper-plane"></i> Gửi bài nộp
              </button>
            </div>
          </div>
        </div>
      `;
    }
  } else if (asg) {
    if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-file-pen" style="color: #d97706;"></i> ${asg.title}`;
    bodyEl.innerHTML = `
      <div class="lesson-modal-content">
        <div class="lesson-meta-bar">
          <span class="badge badge-warning">${asg.status}</span>
          <span><i class="fa-regular fa-clock"></i> Hạn nộp: <strong>${asg.deadline}</strong></span>
          <span class="badge badge-primary">Thang điểm: ${asg.maxScore}</span>
        </div>

        <div class="lesson-doc-reader">
          <h3>HƯỚNG DẪN THỰC HIỆN BÀI TẬP & ĐỒ ÁN</h3>
          <p><strong>Yêu cầu chi tiết:</strong> ${asg.requirements}</p>
          <h4 style="margin-top: 14px;">Quy cách nộp bài:</h4>
          <ul>
            <li>File thuyết minh tính toán: Định dạng PDF (đặt tên theo cú pháp: <code>MaSV_HoTen_BTL01.pdf</code>).</li>
            <li>Bản vẽ AutoCAD: Định dạng DWG hoặc xuất PDF khổ A3 (Sơ đồ nối điện chính, mặt bằng trạm).</li>
            <li>Nộp file trực tuyến hoặc lưu vào Google Drive và dán đường dẫn công khai vào ô bên dưới.</li>
          </ul>
        </div>

        <div style="background: var(--bg-glass-strong); padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <h4 style="margin-bottom: 10px; color: var(--text-title);"><i class="fa-solid fa-cloud-arrow-up" style="color: #2563eb;"></i> Cổng Nộp Bài Trực Tuyến</h4>
          <div class="form-group">
            <input type="text" id="asgSubmitLink" class="form-control" placeholder="Dán link bài nộp Google Drive / OneDrive...">
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button class="btn btn-secondary" onclick="closeModal('lessonViewerModal')">Đóng</button>
            <button class="btn btn-accent" onclick="handleAssignmentSubmit('${asg.id}')">
              <i class="fa-solid fa-paper-plane"></i> Xác nhận nộp bài
            </button>
          </div>
        </div>
      </div>
    `;
  }

  openModal('lessonViewerModal');
};

function renderQuizContent(mat) {
  const bodyEl = document.getElementById('lessonViewerBody');
  if (!bodyEl) return;

  const isSubmitted = state.quizState.submitted;
  let correctCount = 0;

  if (isSubmitted) {
    mat.questions.forEach(q => {
      if (state.quizState.answers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });
  }

  bodyEl.innerHTML = `
    <div class="lesson-modal-content">
      <div class="quiz-header">
        <div>
          <strong style="color: #059669; font-size: 1.05rem;"><i class="fa-solid fa-list-check"></i> Trắc Nghiệm Chuyên Môn</strong>
          <span style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 10px;">${mat.totalQuestions} câu hỏi • Thời gian: ${mat.duration}</span>
        </div>
        ${isSubmitted ? `
          <span class="badge ${correctCount >= 8 ? 'badge-success' : 'badge-warning'}" style="font-size: 0.95rem;">
            Kết quả: ${correctCount}/${mat.totalQuestions} Điểm (${(correctCount / mat.totalQuestions * 10).toFixed(1)}/10)
          </span>
        ` : `
          <span class="badge badge-primary"><i class="fa-solid fa-stopwatch"></i> Đang làm bài</span>
        `}
      </div>

      ${isSubmitted ? `
        <div class="quiz-score-banner">
          <div style="font-size: 2.2rem; color: ${correctCount >= 8 ? '#10b981' : '#f59e0b'}; margin-bottom: 8px;">
            <i class="fa-solid ${correctCount >= 8 ? 'fa-award' : 'fa-clipboard-check'}"></i>
          </div>
          <h3 style="color: var(--text-title); margin-bottom: 4px;">
            ${correctCount >= 8 ? 'Xuất Sắc! Bạn đã nắm vững kiến thức!' : 'Hoàn thành bài kiểm tra!'}
          </h3>
          <p style="color: var(--text-secondary);">
            Số câu trả lời đúng: <strong>${correctCount} / ${mat.totalQuestions}</strong> câu (${((correctCount / mat.totalQuestions) * 100).toFixed(0)}%).
          </p>
        </div>
      ` : ''}

      <div class="quiz-container">
        ${mat.questions.map((q, idx) => {
          const selectedOpt = state.quizState.answers[q.id];
          return `
            <div class="quiz-question-card">
              <div class="quiz-q-num">Câu ${idx + 1} / ${mat.totalQuestions}</div>
              <div class="quiz-q-text">${q.question}</div>
              
              <div class="quiz-options-list">
                ${q.options.map((opt, optIdx) => {
                  let optClass = '';
                  if (isSubmitted) {
                    if (optIdx === q.correctIndex) {
                      optClass = 'correct';
                    } else if (selectedOpt === optIdx && selectedOpt !== q.correctIndex) {
                      optClass = 'wrong';
                    }
                  } else if (selectedOpt === optIdx) {
                    optClass = 'selected';
                  }

                  return `
                    <button type="button" class="quiz-opt-btn ${optClass}" ${isSubmitted ? 'disabled' : ''} onclick="selectQuizOption('${mat.id}', ${q.id}, ${optIdx})">
                      <span style="font-weight: 700; width: 22px;">${String.fromCharCode(65 + optIdx)}.</span>
                      <span>${opt}</span>
                      ${isSubmitted && optIdx === q.correctIndex ? '<i class="fa-solid fa-check" style="margin-left: auto; color: #10b981;"></i>' : ''}
                      ${isSubmitted && selectedOpt === optIdx && selectedOpt !== q.correctIndex ? '<i class="fa-solid fa-xmark" style="margin-left: auto; color: #ef4444;"></i>' : ''}
                    </button>
                  `;
                }).join('')}
              </div>

              ${isSubmitted ? `
                <div class="quiz-explanation-box">
                  <strong><i class="fa-solid fa-circle-info"></i> Giải thích đáp án:</strong> ${q.explanation}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
        <button class="btn btn-secondary" onclick="closeModal('lessonViewerModal')">Đóng</button>
        ${isSubmitted ? `
          <button class="btn btn-primary" onclick="resetQuiz('${mat.id}')">
            <i class="fa-solid fa-rotate-left"></i> Làm lại bài kiểm tra
          </button>
        ` : `
          <button class="btn btn-accent btn-lg" onclick="submitQuiz('${mat.id}')">
            <i class="fa-solid fa-paper-plane"></i> Nộp bài kiểm tra
          </button>
        `}
      </div>
    </div>
  `;
}

window.selectQuizOption = function(matId, questionId, optionIndex) {
  if (state.quizState.submitted) return;
  state.quizState.answers[questionId] = optionIndex;
  renderQuizContent(LECTURE_MATERIALS[matId]);
};

window.submitQuiz = function(matId) {
  const mat = LECTURE_MATERIALS[matId];
  const answeredCount = Object.keys(state.quizState.answers).length;
  if (answeredCount < mat.questions.length) {
    if (!confirm(`Bạn mới trả lời ${answeredCount}/${mat.questions.length} câu. Bạn có chắc muốn nộp bài sớm không?`)) {
      return;
    }
  }
  state.quizState.submitted = true;
  renderQuizContent(mat);
  showToast('Đã nộp bài kiểm tra trắc nghiệm thành công!', 'success');
};

window.resetQuiz = function(matId) {
  state.quizState = {
    answers: {},
    submitted: false
  };
  renderQuizContent(LECTURE_MATERIALS[matId]);
};

window.handleAssignmentSubmit = function(asgId) {
  const link = document.getElementById('asgSubmitLink')?.value.trim();
  if (!link) {
    showToast('Vui lòng nhập đường dẫn link bài nộp của bạn!', 'error');
    return;
  }
  showToast('Đã gửi bài tập thành công đến hệ thống giảng viên!', 'success');
  closeModal('lessonViewerModal');
};

window.printLectureDocument = function(itemId) {
  const mat = LECTURE_MATERIALS[itemId];
  if (!mat) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Vui lòng cho phép mở cửa sổ popup để in tài liệu!', 'error');
    return;
  }
  const content = mat.contentSummary || mat.specification || (mat.sections ? mat.sections.map(s => `<h4>${s.heading}</h4><div>${s.content}</div>`).join('') : '');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>${mat.title} - DHDI21AVL IUH</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 800px; margin: 20px auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 20px; }
        .header h2 { margin: 0; color: #1e3a8a; font-size: 1.25rem; text-transform: uppercase; }
        .header h3 { margin: 6px 0; color: #2563eb; font-size: 1.1rem; }
        .header p { margin: 3px 0; font-size: 0.88rem; color: #475569; }
        .doc-meta { background: #f8fafc; padding: 10px 14px; border-radius: 6px; margin-bottom: 18px; font-size: 0.88rem; border-left: 4px solid #2563eb; }
        .content h3 { color: #1e40af; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 18px; }
        .content h4 { color: #0f172a; margin-top: 14px; }
        .formula-box { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 6px; font-weight: bold; margin: 4px 0; border: 1px solid #bae6fd; }
        table { width: 100%; border-collapse: collapse; margin: 14px 0; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 0.88rem; }
        th { background: #f1f5f9; color: #0f172a; }
        .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP TP. HỒ CHÍ MINH</h2>
        <h3>KHOA CÔNG NGHỆ ĐIỆN - BỘ MÔN HỆ THỐNG ĐIỆN</h3>
        <p>Học phần: <strong>4237010467 - Nhà máy điện và trạm biến áp</strong> (Khóa DHDI21AVL)</p>
        <p>Giảng viên: <strong>TS. Nguyễn Ngọc Tuyến</strong></p>
      </div>
      <div class="doc-meta">
        <div><strong>Tài liệu:</strong> ${mat.title}</div>
        <div><strong>Thời gian phát hành:</strong> Học kỳ 1 (2026 - 2027)</div>
      </div>
      <div class="content">${content}</div>
      <div class="footer">
        <div>Cổng học tập E-Learning DHDI21AVL - ĐH Công nghiệp TP.HCM</div>
        <div>Giảng viên: TS. Nguyễn Ngọc Tuyến</div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

window.downloadLectureDocument = function(itemId) {
  const mat = LECTURE_MATERIALS[itemId];
  if (!mat) {
    showToast('Tài liệu đang được cập nhật!', 'info');
    return;
  }

  // If item has direct Google Drive / file URL, open and download the original file directly
  if (mat.downloadUrl || mat.fileUrl || mat.driveFolderUrl) {
    const targetUrl = mat.downloadUrl || mat.fileUrl || mat.driveFolderUrl;
    showToast('Đang mở và tải trực tiếp file tài liệu từ Google Drive...', 'success');
    window.open(targetUrl, '_blank');
    return;
  }

  showToast('Đang tạo và tải tài liệu về máy...', 'info');
  const content = mat.contentSummary || mat.specification || (mat.sections ? mat.sections.map(s => `<h4>${s.heading}</h4><div>${s.content}</div>`).join('') : '');
  const printTitle = `${mat.title} - DHDI21AVL IUH`;
  const docHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${printTitle}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 800px; margin: 30px auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 20px; }
    .header h2 { margin: 0; color: #1e3a8a; font-size: 1.25rem; text-transform: uppercase; }
    .header h3 { margin: 6px 0; color: #2563eb; font-size: 1.1rem; }
    .header p { margin: 3px 0; font-size: 0.88rem; color: #475569; }
    .doc-meta { background: #f8fafc; padding: 10px 14px; border-radius: 6px; margin-bottom: 18px; font-size: 0.88rem; border-left: 4px solid #2563eb; }
    .content h3 { color: #1e40af; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 18px; }
    .content h4 { color: #0f172a; margin-top: 14px; }
    .formula-box { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 6px; font-weight: bold; margin: 4px 0; border: 1px solid #bae6fd; font-family: 'Segoe UI', sans-serif; }
    table { width: 100%; border-collapse: collapse; margin: 14px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 0.88rem; }
    th { background: #f1f5f9; color: #0f172a; }
    .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <h2>TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP TP. HỒ CHÍ MINH</h2>
    <h3>KHOA CÔNG NGHỆ ĐIỆN - BỘ MÔN HỆ THỐNG ĐIỆN</h3>
    <p>Học phần: <strong>4237010467 - Nhà máy điện và trạm biến áp</strong> (Khóa DHDI21AVL)</p>
    <p>Giảng viên: <strong>TS. Nguyễn Ngọc Tuyến</strong></p>
  </div>
  <div class="doc-meta">
    <div><strong>Tài liệu:</strong> ${mat.title}</div>
    <div><strong>Thời gian phát hành:</strong> Học kỳ 1 (2026 - 2027)</div>
  </div>
  <div class="content">${content}</div>
  <div class="footer">
    <div>Cổng học tập E-Learning DHDI21AVL - ĐH Công nghiệp TP.HCM</div>
    <div>Giảng viên: TS. Nguyễn Ngọc Tuyến</div>
  </div>
</body>
</html>
  `;

  const blob = new Blob([docHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = `Tai_Lieu_${mat.id.replace('.', '_')}_DHDI21AVL_IUH.html`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);

  showToast(`Đã tải về máy file: ${fileName}`, 'success');
};

// ==========================================
// MODALS LOGIC
// ==========================================

window.openRegisterModal = function() {
  state.verifiedStudentData = null;
  const body = document.getElementById('registerModalBody');
  if (!body) return;

  body.innerHTML = `
    <div class="reg-stepper-header">
      <p style="color: var(--text-secondary); font-size: 0.9rem;">
        Hệ thống yêu cầu xác thực <strong>Mã số sinh viên</strong> có trong danh sách 5 lớp của khóa DHDI21AVL. Sau khi xác thực đúng, các thông tin họ tên, lớp, tổ sẽ được tự động điền.
      </p>
    </div>

    <div id="regStep1">
      <div class="form-group">
        <label class="form-label" for="regMasvInput">
          <i class="fa-solid fa-id-badge"></i> Bước 1: Nhập Mã số sinh viên của bạn <span class="required">*</span>
        </label>
        <div class="reg-search-box">
          <input type="text" id="regMasvInput" class="form-control" placeholder="Nhập mã SV (VD: 25001651, 25003401, 25000255...)">
          <button type="button" id="btnVerifyMasv" class="btn btn-primary" style="padding: 0 20px;">
            <i class="fa-solid fa-magnifying-glass"></i> Kiểm tra
          </button>
        </div>
      </div>
      <div id="verifyMessageArea"></div>
    </div>

    <form id="regStep2Form" style="display: none;">
      <div id="regStudentBanner" class="reg-student-badge"></div>

      <div class="reg-grid-form">
        <div class="form-group">
          <label class="form-label">Họ đệm</label>
          <input type="text" id="regHodem" class="form-control" readonly>
        </div>

        <div class="form-group">
          <label class="form-label">Tên sinh viên</label>
          <input type="text" id="regTen" class="form-control" readonly>
        </div>

        <div class="form-group">
          <label class="form-label">Lớp học</label>
          <input type="text" id="regLop" class="form-control" readonly>
        </div>

        <div class="form-group">
          <label class="form-label">Tổ / Nhóm</label>
          <input type="text" id="regNhom" class="form-control" readonly>
        </div>

        <div class="form-group">
          <label class="form-label">Giới tính</label>
          <input type="text" id="regGioitinh" class="form-control" readonly>
        </div>

        <div class="form-group">
          <label class="form-label">Ngày sinh</label>
          <input type="text" id="regNgaysinh" class="form-control" readonly>
        </div>

        <div class="form-group">
          <label class="form-label">Số điện thoại</label>
          <input type="tel" id="regSdt" class="form-control" readonly>
        </div>

        <div class="form-group grid-col-full">
          <label class="form-label" for="regEmail">
            Địa chỉ Email (Nhận mật khẩu đăng nhập) <span class="required">*</span>
          </label>
          <input type="email" id="regEmail" class="form-control" placeholder="Nhập Email để nhận mật khẩu khởi tạo (VD: sinhvien@gmail.com)" required>
          <small style="color: var(--primary); font-size: 0.82rem; margin-top: 4px; display: block;">
            <i class="fa-solid fa-circle-info"></i> Mật khẩu ngẫu nhiên 10 ký tự sẽ được tạo tự động và gửi về Email này!
          </small>
        </div>

        <div class="form-group">
          <label class="form-label" for="regDiachi">Địa chỉ hiện tại</label>
          <input type="text" id="regDiachi" class="form-control" placeholder="VD: TP. Vũng Tàu...">
        </div>

        <div class="form-group">
          <label class="form-label" for="regQuequan">Quê quán</label>
          <input type="text" id="regQuequan" class="form-control" placeholder="VD: Bà Rịa - Vũng Tàu...">
        </div>

        <div class="form-group grid-col-full">
          <label class="form-label" for="regSothich">Sở thích / Giới thiệu thêm</label>
          <input type="text" id="regSothich" class="form-control" placeholder="VD: Nghiên cứu SCADA, Tự động hóa, Thể thao...">
        </div>
      </div>

      <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
        <button type="button" class="btn btn-secondary" onclick="closeModal('registerModal')">Hủy bỏ</button>
        <button type="submit" id="btnSaveRegistration" class="btn btn-accent btn-lg">
          <i class="fa-solid fa-paper-plane"></i> Kích hoạt tài khoản & Nhận mật khẩu
        </button>
      </div>
    </form>
  `;

  document.getElementById('btnVerifyMasv')?.addEventListener('click', handleVerifyMasv);
  document.getElementById('regMasvInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerifyMasv();
    }
  });

  document.getElementById('regStep2Form')?.addEventListener('submit', handleSaveRegistration);
  openModal('registerModal');
};

async function handleVerifyMasv() {
  const masvInput = document.getElementById('regMasvInput');
  const btn = document.getElementById('btnVerifyMasv');
  const msgArea = document.getElementById('verifyMessageArea');
  const masv = masvInput?.value.trim();

  if (!masv) {
    showToast('Vui lòng nhập Mã số sinh viên', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner spin"></i>`;
  }
  if (msgArea) msgArea.innerHTML = '';

  try {
    const res = await api.verifyStudent(masv);
    if (res.success && res.student) {
      state.verifiedStudentData = res.student;
      showToast(`Đã tìm thấy sinh viên: ${res.student.fullname}`, 'success');

      document.getElementById('regHodem').value = res.student.hodem || '';
      document.getElementById('regTen').value = res.student.ten || '';
      document.getElementById('regLop').value = res.student.lop || '';
      document.getElementById('regNhom').value = res.student.nhom ? `Tổ / Nhóm ${res.student.nhom}` : '';
      document.getElementById('regGioitinh').value = res.student.gioitinh || '';
      document.getElementById('regNgaysinh').value = res.student.ngaysinh || '';
      document.getElementById('regSdt').value = res.student.sdt || '';
      document.getElementById('regEmail').value = res.student.email || '';
      document.getElementById('regDiachi').value = res.student.diachi || '';
      document.getElementById('regQuequan').value = res.student.quequan || '';
      document.getElementById('regSothich').value = res.student.sothich || '';

      document.getElementById('regStudentBanner').innerHTML = `
        <div class="badge-icon"><i class="fa-solid fa-circle-check" style="color: #34d399;"></i></div>
        <div class="badge-details">
          <h4>${res.student.fullname} (Mã SV: ${res.student.masv})</h4>
          <p>Lớp: <strong>${res.student.lop}</strong> • Nhóm: <strong>${res.student.nhom || '1'}</strong> • SĐT: <strong>${res.student.sdt || 'Chưa có'}</strong></p>
        </div>
      `;

      document.getElementById('regStep2Form').style.display = 'block';
      document.getElementById('regEmail').focus();
    } else {
      if (msgArea) {
        msgArea.innerHTML = `
          <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md); padding: 12px; color: #ef4444; font-size: 0.88rem; margin-top: 10px;">
            <i class="fa-solid fa-triangle-exclamation"></i> ${res.message || 'Mã số sinh viên không tồn tại trong danh sách khóa DHDI21AVL!'}
          </div>
        `;
      }
    }
  } catch (err) {
    showToast(err.message || 'Lỗi kiểm tra mã sinh viên', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> Kiểm tra`;
    }
  }
}

async function handleSaveRegistration(e) {
  e.preventDefault();
  if (!state.verifiedStudentData) return;

  const btn = document.getElementById('btnSaveRegistration');
  const email = document.getElementById('regEmail')?.value.trim();
  const diachi = document.getElementById('regDiachi')?.value.trim();
  const quequan = document.getElementById('regQuequan')?.value.trim();
  const sothich = document.getElementById('regSothich')?.value.trim();

  if (!email) {
    showToast('Vui lòng nhập địa chỉ Email để nhận mật khẩu đăng nhập!', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner spin"></i> Đang kích hoạt tài khoản...`;
  }

  try {
    const payload = {
      masv: state.verifiedStudentData.masv,
      email,
      diachi,
      quequan,
      sothich,
      ngaysinh: state.verifiedStudentData.ngaysinh,
      sdt: state.verifiedStudentData.sdt
    };
    const res = await api.registerStudent(payload);
    if (res.success) {
      closeModal('registerModal');
      openSuccessRegisterModal(res);
      state.students = api.getLocalStudents();
    }
  } catch (err) {
    showToast(err.message || 'Lỗi đăng ký', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Kích hoạt tài khoản & Nhận mật khẩu`;
    }
  }
}

function openSuccessRegisterModal(data) {
  const body = document.getElementById('registerSuccessBody');
  if (!body) return;

  body.innerHTML = `
    <div style="text-align: center; padding: 10px 0;">
      <div style="width: 72px; height: 72px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 2.4rem; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 2px solid #10b981;">
        <i class="fa-solid fa-envelope-circle-check"></i>
      </div>
      <h3 style="font-size: 1.4rem; color: var(--text-title); margin-bottom: 8px;">Kích Hoạt Tài Khoản Thành Công!</h3>
      <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 18px;">
        Mật khẩu đăng nhập đã được hệ thống tạo và <strong>gửi trực tiếp về hòm thư Email</strong> của bạn:
      </p>

      <div style="background: var(--bg-card); border: 1px solid var(--border-glass); border-radius: var(--radius-lg); padding: 18px; text-align: left; margin-bottom: 20px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
          <span style="color: var(--text-muted);">Sinh viên:</span>
          <strong style="color: var(--text-title); font-size: 1rem;">${data.fullname}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
          <span style="color: var(--text-muted);">Tài khoản đăng nhập (Mã SV):</span>
          <strong style="color: var(--primary); font-family: monospace; font-size: 1.1rem;">${data.masv}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
          <span style="color: var(--text-muted);">Email nhận mật khẩu:</span>
          <strong style="color: #059669; font-size: 0.95rem;"><i class="fa-solid fa-envelope"></i> ${data.email}</strong>
        </div>
        <div style="padding: 10px 0 2px 0;">
          <div style="background: rgba(37, 99, 235, 0.1); border: 1px dashed rgba(37, 99, 235, 0.4); border-radius: 8px; padding: 12px; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
            📩 <strong>Hướng dẫn bảo mật:</strong> Mật khẩu <strong>chỉ gửi về email</strong> (không hiển thị trên trang web để đảm bảo quyền riêng tư). Vui lòng mở hòm thư <code>${data.email}</code> (kiểm tra cả mục <em>Thư đến / Spam / Quảng cáo</em>) để lấy mật khẩu đăng nhập.
          </div>
        </div>
      </div>

      <button type="button" class="btn btn-primary btn-lg" style="width: 100%;" onclick="closeSuccessAndGoToLogin('${data.masv}')">
        <i class="fa-solid fa-arrow-right-to-bracket"></i> Đã nhận mật khẩu & Quay lại đăng nhập
      </button>
    </div>
  `;

  openModal('registerSuccessModal');
}

window.closeSuccessAndGoToLogin = function(masv) {
  closeModal('registerSuccessModal');
  const userEl = document.getElementById('loginUsername');
  const passEl = document.getElementById('loginPassword');
  if (userEl) userEl.value = masv;
  if (passEl) {
    passEl.value = '';
    passEl.focus();
  }
};

window.openStudentDetailModal = function(masv) {
  // Close the user dropdown menu if open
  const dropdown = document.getElementById('userDropdownMenu');
  if (dropdown) dropdown.classList.remove('show');

  const targetMasv = masv || state.currentUser?.masv;
  if (!targetMasv) {
    showToast('Vui lòng đăng nhập để xem thông tin hồ sơ!', 'info');
    return;
  }

  let student = state.students.find(s => String(s.masv).trim() === String(targetMasv).trim());
  if (!student && state.currentUser && String(state.currentUser.masv).trim() === String(targetMasv).trim()) {
    student = state.currentUser;
  }

  if (!student) {
    showToast(`Không tìm thấy dữ liệu hồ sơ cho Mã SV: ${targetMasv}`, 'error');
    return;
  }

  const title = document.getElementById('studentDetailTitle');
  const body = document.getElementById('studentDetailBody');
  const fullname = student.fullname || `${student.hodem || ''} ${student.ten || ''}`.trim() || 'Sinh viên';
  if (title) title.innerHTML = `<i class="fa-solid fa-id-card"></i> Hồ Sơ Sinh Viên: ${fullname}`;

  const hasPhoto = !!student.anh3x4;
  const isApproved = !!student.photoApproved;

  if (body) {
    body.innerHTML = `
      <div class="student-detail-body">
        <div class="detail-photo-col">
          <div class="detail-photo-frame">
            ${hasPhoto 
              ? `<img src="${student.anh3x4}" alt="${fullname}">` 
              : `<div class="student-photo-placeholder" style="height: 100%;">
                   <span class="placeholder-initials">${student.ten ? student.ten.charAt(0) : 'SV'}</span>
                   <span class="placeholder-ratio">Ảnh 3x4</span>
                 </div>`
            }
          </div>
          <span class="badge ${isApproved ? 'badge-success' : (hasPhoto ? 'badge-warning' : 'badge-muted')}">
            ${isApproved ? 'Ảnh: ĐÃ DUYỆT' : (hasPhoto ? 'Ảnh: CHỜ DUYỆT' : 'Chưa có ảnh thẻ')}
          </span>

          ${(state.currentUser?.masv === student.masv || state.currentUser?.role === 'ADMIN') ? `
            <button class="btn btn-primary btn-sm" style="width: 100%; margin-top: 6px;" onclick="closeModal('studentDetailModal'); openPhotoUploadModal('${student.masv}')">
              <i class="fa-solid fa-camera"></i> Cập nhật ảnh
            </button>
          ` : ''}
        </div>

        <div class="detail-info-col">
          <div class="detail-row">
            <div class="detail-label">Mã số sinh viên:</div>
            <div class="detail-value" style="color: var(--primary); font-family: monospace; font-size: 1.05rem;">${student.masv}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Họ và tên:</div>
            <div class="detail-value">${fullname}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Lớp học phần:</div>
            <div class="detail-value">${student.lop} (${student.className || 'DHDI21AVL'})</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Tổ / Nhóm:</div>
            <div class="detail-value">Tổ / Nhóm ${student.nhom || '1'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Giới tính:</div>
            <div class="detail-value">${student.gioitinh ? (student.gioitinh.toLowerCase() === 'nữ' ? '<span style="color: #ec4899; font-weight: 600;"><i class="fa-solid fa-venus"></i> Nữ</span>' : '<span style="color: #2563eb; font-weight: 600;"><i class="fa-solid fa-mars"></i> Nam</span>') : '<em style="color: var(--text-muted);">Chưa cập nhật</em>'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Ngày sinh:</div>
            <div class="detail-value">${student.ngaysinh || '<em style="color: var(--text-muted);">Chưa cập nhật</em>'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Số điện thoại:</div>
            <div class="detail-value">${student.sdt ? formatPhoneNumber(student.sdt) : '<em style="color: var(--text-muted);">Chưa cập nhật</em>'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Địa chỉ Email:</div>
            <div class="detail-value">${student.email || '<em style="color: var(--text-muted);">Chưa cập nhật</em>'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Địa chỉ:</div>
            <div class="detail-value">${student.diachi || '<em style="color: var(--text-muted);">Chưa cập nhật</em>'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Quê quán:</div>
            <div class="detail-value">${student.quequan || '<em style="color: var(--text-muted);">Chưa cập nhật</em>'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Sở thích:</div>
            <div class="detail-value">${student.sothich || '<em style="color: var(--text-muted);">Chưa cập nhật</em>'}</div>
          </div>
        </div>
      </div>
    `;
  }

  openModal('studentDetailModal');
};

window.openChangePasswordModal = function() {
  const user = state.currentUser;
  if (!user) return;

  const form = document.getElementById('changePasswordForm');
  if (form) form.reset();
  openModal('changePasswordModal');
};

async function handleChangePasswordSubmit(e) {
  e.preventDefault();
  const user = state.currentUser;
  if (!user) return;

  const oldPass = document.getElementById('oldPassInput')?.value.trim();
  const newPass = document.getElementById('newPassInput')?.value.trim();
  const confirmPass = document.getElementById('confirmPassInput')?.value.trim();
  const btn = document.getElementById('btnSubmitChangePass');

  if (!oldPass || !newPass || !confirmPass) {
    showToast('Vui lòng nhập đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận', 'error');
    return;
  }

  if (newPass.length < 6) {
    showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
    return;
  }

  if (newPass !== confirmPass) {
    showToast('Mật khẩu mới và mật khẩu xác nhận không khớp nhau!', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner spin"></i> Đang đổi mật khẩu...`;
  }

  try {
    const res = await api.changePassword(user.masv, oldPass, newPass);
    if (res.success) {
      showToast(res.message, 'success');
      closeModal('changePasswordModal');
    }
  } catch (err) {
    showToast(err.message || 'Lỗi đổi mật khẩu', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-key"></i> Lưu Mật Khẩu Mới`;
    }
  }
}

window.openPhotoUploadModal = function(targetMasv) {
  const user = state.currentUser;
  const masv = targetMasv || user?.masv;
  if (!masv) {
    showToast('Vui lòng đăng nhập để cập nhật ảnh', 'error');
    return;
  }

  state.tempUploadedPhoto = null;
  const previewBox = document.getElementById('photoUploadPreview');
  if (previewBox) previewBox.innerHTML = '';
  const fileInput = document.getElementById('photoFileInput');
  if (fileInput) fileInput.value = '';
  const masvInput = document.getElementById('photoTargetMasv');
  if (masvInput) masvInput.value = masv;

  openModal('photoUploadModal');
};

function handlePhotoSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('Dung lượng ảnh tối đa là 5MB', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    state.tempUploadedPhoto = event.target.result;
    const previewBox = document.getElementById('photoUploadPreview');
    if (previewBox) {
      previewBox.innerHTML = `
        <div class="photo-preview-container">
          <p style="font-size: 0.85rem; color: var(--text-muted);">Xem trước tỷ lệ chuẩn 3x4:</p>
          <div class="photo-preview-box">
            <img src="${state.tempUploadedPhoto}" alt="3x4 Preview">
          </div>
        </div>
      `;
    }
  };
  reader.readAsDataURL(file);
}

async function handleSaveUploadedPhoto() {
  const masv = document.getElementById('photoTargetMasv')?.value;
  if (!state.tempUploadedPhoto) {
    showToast('Vui lòng chọn file ảnh trước khi lưu!', 'error');
    return;
  }

  const btn = document.getElementById('btnSavePhoto');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner spin"></i> Đang tải ảnh lên hệ thống...`;
  }

  try {
    const res = await api.uploadPhoto(masv, state.tempUploadedPhoto);
    
    if (res.syncedToServer) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'info');
    }
    
    closeModal('photoUploadModal');
    state.students = api.getLocalStudents();
    state.currentUser = api.getCurrentUser();
    renderAppHeader();
    renderActiveTab();
  } catch (err) {
    showToast(err.message || 'Lỗi tải ảnh', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Lưu Ảnh 3x4`;
    }
  }
}

function setupGlobalEvents() {
  // User Profile Dropdown Toggle
  const profileBtn = document.getElementById('userProfileBtn');
  const userDropdown = document.getElementById('userDropdownMenu');

  profileBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown?.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu-wrapper')) {
      userDropdown?.classList.remove('show');
    }
  });

  // Change Password Form Submit
  document.getElementById('changePasswordForm')?.addEventListener('submit', handleChangePasswordSubmit);

  // Photo Upload Events
  document.getElementById('photoFileInput')?.addEventListener('change', handlePhotoSelected);
  document.getElementById('btnSavePhoto')?.addEventListener('click', handleSaveUploadedPhoto);

  // Close modals on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
}
