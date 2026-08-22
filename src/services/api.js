/**
 * API Service for E-Learning DHDI21AVL Platform
 * Tích hợp trực tiếp với Google Apps Script Web App và Hệ thống Dữ liệu
 */

import { INITIAL_STUDENTS, CLASS_METADATA } from '../data/studentsData.js';

const STORAGE_KEY_STUDENTS = 'DHDI21AVL_STUDENTS_V1';
const STORAGE_KEY_CURRENT_USER = 'DHDI21AVL_CURRENT_USER';
const STORAGE_KEY_API_URL = 'DHDI21AVL_API_URL';

// URL Google Apps Script chính thức
export const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbwWqWrQ7JyZRhYZR4NH0dNSMfVrgIDUYp1fsb6zgYJpcRjbV2zOD7IfMU_u32WgW28p9Q/exec";

// Cấu hình Quản trị viên (Mật khẩu: @A12345678)
export const ADMIN_CONFIG = {
  username: 'admin',
  password: '@A12345678',
  displayName: 'Quản trị viên E-Learning'
};

class ApiService {
  constructor() {
    this.apiUrl = localStorage.getItem(STORAGE_KEY_API_URL) || DEFAULT_API_URL;
    this.initDatabase();
  }

  // Khởi tạo Database nếu chưa có
  initDatabase() {
    const existing = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    }
  }

  getApiUrl() {
    return this.apiUrl || localStorage.getItem(STORAGE_KEY_API_URL) || DEFAULT_API_URL;
  }

  setApiUrl(url) {
    this.apiUrl = (url || '').trim() || DEFAULT_API_URL;
    localStorage.setItem(STORAGE_KEY_API_URL, this.apiUrl);
  }

  getLocalStudents() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STUDENTS);
      return data ? JSON.parse(data) : [...INITIAL_STUDENTS];
    } catch (e) {
      console.error('Error reading local students:', e);
      return [...INITIAL_STUDENTS];
    }
  }

  saveLocalStudents(students) {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error('Error saving local students:', e);
    }
  }

  // Lấy danh sách tất cả sinh viên
  async getStudents() {
    const localList = this.getLocalStudents();

    if (this.apiUrl) {
      try {
        const response = await fetch(`${this.apiUrl}?action=getStudents`);
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && resJson.students && resJson.students.length > 0) {
            this.saveLocalStudents(resJson.students);
            return resJson.students;
          }
        }
      } catch (err) {
        console.warn('API sync unavailable, using cached database:', err);
      }
    }

    return localList;
  }

  // 1. Kiểm tra Mã số sinh viên trước khi đăng ký
  async verifyStudent(masv) {
    if (!masv) return { success: false, message: 'Vui lòng nhập Mã số sinh viên' };
    const cleanMasv = String(masv).trim();

    if (this.apiUrl) {
      try {
        const res = await fetch(`${this.apiUrl}?action=verifyStudent&masv=${encodeURIComponent(cleanMasv)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.student) {
            return data;
          }
        }
      } catch (err) {
        console.warn('API verify failed, checking local:', err);
      }
    }

    const list = this.getLocalStudents();
    const found = list.find(s => String(s.masv).trim() === cleanMasv);

    if (found) {
      return {
        success: true,
        found: true,
        isRegistered: !!(found.matkhau && found.email),
        student: {
          masv: found.masv,
          hodem: found.hodem,
          ten: found.ten,
          fullname: found.fullname || `${found.hodem} ${found.ten}`.trim(),
          lop: found.lop,
          nhom: found.nhom,
          ngaysinh: found.ngaysinh || '',
          sdt: found.sdt || '',
          email: found.email || '',
          diachi: found.diachi || '',
          quequan: found.quequan || '',
          sothich: found.sothich || '',
          anh3x4: found.anh3x4 || '',
          photoApproved: !!found.photoApproved,
          matkhau: found.matkhau || ''
        }
      };
    }

    return {
      success: false,
      found: false,
      message: `Không tìm thấy Mã SV "${cleanMasv}" trong danh sách 5 lớp của khóa DHDI21AVL!`
    };
  }

  // 2. Đăng ký thông tin sinh viên + tạo mật khẩu ngẫu nhiên + gửi email
  async registerStudent(data) {
    const { masv, ngaysinh, sdt, email, diachi, quequan, sothich } = data;

    if (!masv) throw new Error('Thiếu Mã số sinh viên');
    if (!ngaysinh) throw new Error('Ngày sinh là bắt buộc');
    if (!sdt) throw new Error('Số điện thoại là bắt buộc');
    if (!email) throw new Error('Email là bắt buộc');

    const generatedPassword = this.generateRandomPassword(10);

    const list = this.getLocalStudents();
    const idx = list.findIndex(s => String(s.masv).trim() === String(masv).trim());

    if (idx === -1) {
      throw new Error(`Mã số sinh viên ${masv} không tồn tại trong danh sách`);
    }

    list[idx].ngaysinh = ngaysinh;
    list[idx].sdt = sdt;
    list[idx].email = email;
    list[idx].diachi = diachi || '';
    list[idx].quequan = quequan || '';
    list[idx].sothich = sothich || '';
    list[idx].matkhau = generatedPassword;
    list[idx].isRegistered = true;
    this.saveLocalStudents(list);

    let emailSent = false;
    let remoteSaved = false;

    if (this.apiUrl) {
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'register',
            masv,
            ngaysinh,
            sdt,
            email,
            diachi,
            quequan,
            sothich
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success) {
            emailSent = !!resJson.emailSent;
            remoteSaved = true;
          }
        }
      } catch (err) {
        console.warn('Failed to sync registration:', err);
      }
    }

    return {
      success: true,
      masv: masv,
      fullname: list[idx].fullname,
      email: email,
      tempPassword: generatedPassword,
      emailSent: emailSent,
      remoteSaved: remoteSaved,
      message: `Đăng ký thông tin thành công! Mật khẩu khởi tạo đã được gửi về email: ${email}`
    };
  }

  // 3. Đăng nhập hệ thống
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Vui lòng nhập đầy đủ tài khoản và mật khẩu');
    }

    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();

    // 1. Kiểm tra Admin (Mật khẩu: @A12345678)
    if (cleanUser === ADMIN_CONFIG.username && cleanPass === ADMIN_CONFIG.password) {
      const adminSession = {
        role: 'ADMIN',
        username: ADMIN_CONFIG.username,
        fullname: ADMIN_CONFIG.displayName,
        email: 'admin@dhdi21avl.edu.vn',
        isLoggedIn: true
      };
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(adminSession));
      return { success: true, isAdmin: true, user: adminSession };
    }

    // 2. Thử qua API
    if (this.apiUrl) {
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'login',
            username: cleanUser,
            password: cleanPass
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && resJson.user) {
            localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(resJson.user));
            return resJson;
          }
        }
      } catch (err) {
        console.warn('API login failed, falling back to local:', err);
      }
    }

    // 3. Tra cứu trong Local Cache
    const list = this.getLocalStudents();
    const student = list.find(s => String(s.masv).trim() === cleanUser);

    if (!student) {
      throw new Error('Mã số sinh viên không tồn tại trong hệ thống!');
    }

    if (!student.matkhau) {
      throw new Error('Tài khoản chưa được kích hoạt! Vui lòng nhấn "Điền thông tin" để nhận mật khẩu đăng nhập.');
    }

    if (student.matkhau !== cleanPass) {
      throw new Error('Mật khẩu không chính xác! Vui lòng kiểm tra lại.');
    }

    const userSession = {
      role: 'STUDENT',
      masv: student.masv,
      hodem: student.hodem,
      ten: student.ten,
      fullname: student.fullname || `${student.hodem} ${student.ten}`.trim(),
      lop: student.lop,
      nhom: student.nhom,
      ngaysinh: student.ngaysinh,
      sdt: student.sdt,
      email: student.email,
      diachi: student.diachi,
      quequan: student.quequan,
      anh3x4: student.anh3x4,
      photoStatus: student.photoStatus || (student.anh3x4 ? (student.photoApproved ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT') : 'CHƯA CÓ'),
      photoApproved: !!student.photoApproved,
      sothich: student.sothich,
      className: student.className,
      isLoggedIn: true
    };

    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(userSession));
    return { success: true, isAdmin: false, user: userSession };
  }

  getCurrentUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (!data) return null;
      const user = JSON.parse(data);

      if (user && user.role === 'STUDENT' && user.masv) {
        const list = this.getLocalStudents();
        const latest = list.find(s => String(s.masv).trim() === String(user.masv).trim());
        if (latest) {
          user.photoApproved = !!latest.photoApproved;
          user.photoStatus = latest.photoStatus || (latest.anh3x4 ? (latest.photoApproved ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT') : 'CHƯA CÓ');
          user.anh3x4 = latest.anh3x4;
          user.matkhau = latest.matkhau;
          localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
        }
      }
      return user;
    } catch (e) {
      return null;
    }
  }

  logout() {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  }

  // 6. Đổi mật khẩu
  async changePassword(masv, oldPassword, newPassword) {
    if (!masv || !oldPassword || !newPassword) {
      throw new Error('Vui lòng điền đầy đủ mật khẩu cũ và mật khẩu mới');
    }

    if (newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có độ dài tối thiểu 6 ký tự');
    }

    const list = this.getLocalStudents();
    const idx = list.findIndex(s => String(s.masv).trim() === String(masv).trim());

    if (idx === -1) {
      throw new Error('Không tìm thấy tài khoản sinh viên');
    }

    if (list[idx].matkhau && list[idx].matkhau !== oldPassword) {
      throw new Error('Mật khẩu cũ không chính xác!');
    }

    list[idx].matkhau = newPassword;
    this.saveLocalStudents(list);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.masv === masv) {
      currentUser.matkhau = newPassword;
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    }

    if (this.apiUrl) {
      try {
        await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'changePassword',
            masv,
            oldPassword,
            newPassword
          })
        });
      } catch (err) {
        console.warn('Sync changePassword failed:', err);
      }
    }

    return { success: true, message: 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.' };
  }

  // 7. Cập nhật ảnh 3x4 (Tải lên Google Drive)
  async uploadPhoto(masv, photoBase64OrUrl) {
    if (!masv) throw new Error('Thiếu Mã số sinh viên');

    const list = this.getLocalStudents();
    const idx = list.findIndex(s => String(s.masv).trim() === String(masv).trim());

    if (idx === -1) throw new Error('Không tìm thấy sinh viên');

    list[idx].anh3x4 = photoBase64OrUrl;
    list[idx].photoApproved = false;
    list[idx].photoStatus = 'CHỜ DUYỆT';
    this.saveLocalStudents(list);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.masv === masv) {
      currentUser.anh3x4 = photoBase64OrUrl;
      currentUser.photoApproved = false;
      currentUser.photoStatus = 'CHỜ DUYỆT';
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    }

    if (this.apiUrl) {
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'uploadPhoto',
            masv,
            photoBase64: photoBase64OrUrl
          })
        });
        if (response.ok) {
          const res = await response.json();
          if (res.success && res.photoUrl) {
            list[idx].anh3x4 = res.photoUrl;
            this.saveLocalStudents(list);
            if (currentUser && currentUser.masv === masv) {
              currentUser.anh3x4 = res.photoUrl;
              localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
            }
          }
        }
      } catch (err) {
        console.warn('Sync uploadPhoto to Google Drive failed:', err);
      }
    }

    return {
      success: true,
      message: 'Đã tải lên ảnh 3x4 thành công! Ảnh đang trong trạng thái CHỜ DUYỆT bởi Ban Quản trị.',
      photoUrl: photoBase64OrUrl,
      photoStatus: 'CHỜ DUYỆT'
    };
  }

  // 8. Admin Phê duyệt ảnh 3x4
  async adminApprovePhoto(masv, status = 'ĐÃ DUYỆT', adminPass = ADMIN_CONFIG.password) {
    const list = this.getLocalStudents();
    const idx = list.findIndex(s => String(s.masv).trim() === String(masv).trim());

    if (idx === -1) throw new Error('Không tìm thấy sinh viên');

    const isApproved = status.toUpperCase() === 'ĐÃ DUYỆT' || status.toUpperCase() === 'APPROVED';
    list[idx].photoApproved = isApproved;
    list[idx].photoStatus = status.toUpperCase();
    this.saveLocalStudents(list);

    if (this.apiUrl) {
      try {
        await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'adminApprovePhoto',
            masv,
            status,
            adminPass
          })
        });
      } catch (err) {
        console.warn('Sync admin approval failed:', err);
      }
    }

    return {
      success: true,
      message: `Đã cập nhật trạng thái ảnh của sinh viên ${masv} thành: ${status}`,
      status: status
    };
  }

  // 9. Lấy dữ liệu quản trị
  async getAdminData(adminPass = ADMIN_CONFIG.password) {
    const list = this.getLocalStudents();
    const pendingPhotos = list.filter(s => s.anh3x4 && !s.photoApproved);
    const approvedPhotos = list.filter(s => s.photoApproved);
    const registered = list.filter(s => s.isRegistered || (s.matkhau && s.email));

    return {
      success: true,
      stats: {
        totalStudents: list.length,
        registeredCount: registered.length,
        pendingPhotosCount: pendingPhotos.length,
        approvedPhotosCount: approvedPhotos.length
      },
      pendingPhotos,
      students: list
    };
  }

  generateRandomPassword(length = 10) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const api = new ApiService();
