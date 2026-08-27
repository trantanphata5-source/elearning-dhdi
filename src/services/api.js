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
          gioitinh: found.gioitinh || '',
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
          } else {
            throw new Error(resJson.message || 'Lỗi lưu thông tin trên Google Sheets');
          }
        } else if (response.status === 403) {
          throw new Error('Lỗi 403 Forbidden: Bản triển khai Google Apps Script chưa được cấp quyền "Anyone (Bất kỳ ai)". Vui lòng kiểm tra lại cấu hình phân quyền trong Google Apps Script.');
        } else {
          throw new Error(`Lỗi máy chủ Google Apps Script (HTTP ${response.status})`);
        }
      } catch (err) {
        console.error('Failed to sync registration:', err);
        throw err;
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
          redirect: 'follow',
          body: JSON.stringify({
            action: 'login',
            username: cleanUser,
            password: cleanPass
          })
        });

        const responseText = await response.text();
        let resJson;
        try {
          resJson = JSON.parse(responseText);
        } catch (e) {
          console.warn('API login response parse error:', responseText.substring(0, 100));
        }

        if (resJson && resJson.success && resJson.user) {
          const userSession = {
            ...resJson.user,
            matkhau: cleanPass,
            isLoggedIn: true
          };
          localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(userSession));

          // Đồng bộ mật khẩu và thông tin vào local student cache
          const list = this.getLocalStudents();
          const idx = list.findIndex(s => String(s.masv).trim() === cleanUser);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...userSession, matkhau: cleanPass };
            this.saveLocalStudents(list);
          }

          return { success: true, isAdmin: !!resJson.isAdmin, user: userSession };
        } else if (resJson && !resJson.success) {
          throw new Error(resJson.message || 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.');
        }
      } catch (err) {
        if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed to fetch')) {
          throw err;
        }
        console.warn('API login failed, falling back to local:', err);
      }
    }

    // 3. Tra cứu trong Local Cache (Chế độ offline)
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
      gioitinh: student.gioitinh || '',
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
      matkhau: cleanPass,
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
          if (latest.matkhau) user.matkhau = latest.matkhau;
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

    const cleanMasv = String(masv).trim();
    const cleanOld = String(oldPassword).trim();
    const cleanNew = String(newPassword).trim();

    if (cleanNew.length < 6) {
      throw new Error('Mật khẩu mới phải có độ dài tối thiểu 6 ký tự');
    }

    const apiUrl = this.getApiUrl();
    if (!apiUrl) {
      throw new Error('Chưa cấu hình URL máy chủ API Google Apps Script!');
    }

    let resJson;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({
          action: 'changePassword',
          masv: cleanMasv,
          oldPassword: cleanOld,
          newPassword: cleanNew
        })
      });

      const responseText = await response.text();
      try {
        resJson = JSON.parse(responseText);
      } catch (e) {
        console.error('GAS response:', responseText);
        throw new Error('Máy chủ phản hồi không hợp lệ. Vui lòng kiểm tra lại Deployment Apps Script!');
      }
    } catch (fetchErr) {
      console.error('Change password fetch error:', fetchErr);
      throw new Error(fetchErr.message || 'Không thể kết nối đến máy chủ Google Apps Script.');
    }

    if (resJson && resJson.success) {
      // Cập nhật Local Storage sau khi Google Sheet đã lưu thành công
      const list = this.getLocalStudents();
      const idx = list.findIndex(s => String(s.masv).trim() === cleanMasv);
      if (idx !== -1) {
        list[idx].matkhau = cleanNew;
        this.saveLocalStudents(list);
      }

      const currentUser = this.getCurrentUser();
      if (currentUser && String(currentUser.masv).trim() === cleanMasv) {
        currentUser.matkhau = cleanNew;
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
      }

      return {
        success: true,
        message: resJson.message || 'Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật vào Google Sheet.'
      };
    } else {
      throw new Error((resJson && resJson.message) || 'Đổi mật khẩu thất bại trên Google Sheet!');
    }
  }

  // 7. Cập nhật ảnh 3x4 (Lưu trực tiếp vào Google Sheet)
  async uploadPhoto(masv, photoBase64OrUrl) {
    if (!masv) throw new Error('Thiếu Mã số sinh viên');

    const list = this.getLocalStudents();
    const idx = list.findIndex(s => String(s.masv).trim() === String(masv).trim());

    if (idx === -1) throw new Error('Không tìm thấy sinh viên');

    // Compress for local display (800px, 70% quality)
    let localPhoto = photoBase64OrUrl;
    if (photoBase64OrUrl && photoBase64OrUrl.startsWith('data:image')) {
      try {
        localPhoto = await this._compressImage(photoBase64OrUrl, 800, 0.7);
      } catch (compErr) {
        console.warn('Image compression failed, using original:', compErr);
      }
    }

    // Compress MORE for server/Sheet storage (300px, 50% quality ≈ 8-15KB base64)
    let serverPhoto = photoBase64OrUrl;
    if (photoBase64OrUrl && photoBase64OrUrl.startsWith('data:image')) {
      try {
        serverPhoto = await this._compressImage(photoBase64OrUrl, 300, 0.5);
      } catch (compErr) {
        serverPhoto = localPhoto; // Fallback to local version
      }
    }

    // Save to localStorage immediately (higher quality version)
    list[idx].anh3x4 = localPhoto;
    list[idx].photoApproved = false;
    list[idx].photoStatus = 'CHỜ DUYỆT';
    this.saveLocalStudents(list);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.masv === masv) {
      currentUser.anh3x4 = localPhoto;
      currentUser.photoApproved = false;
      currentUser.photoStatus = 'CHỜ DUYỆT';
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    }

    // Sync to Google Apps Script (lưu base64 trực tiếp vào Sheet, không qua Drive)
    let syncSuccess = false;
    let syncError = '';
    if (this.apiUrl) {
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          redirect: 'follow',
          body: JSON.stringify({
            action: 'uploadPhoto',
            masv,
            photoBase64: serverPhoto
          })
        });

        const responseText = await response.text();
        let res;
        try {
          res = JSON.parse(responseText);
        } catch (parseErr) {
          console.warn('GAS response not JSON:', responseText.substring(0, 200));
          throw new Error('Server returned invalid response');
        }

        if (res.success) {
          syncSuccess = true;
          // If server returned a different URL (e.g. Drive URL), use it
          if (res.photoUrl && !res.photoUrl.startsWith('PENDING')) {
            list[idx].anh3x4 = res.photoUrl;
            this.saveLocalStudents(list);
            if (currentUser && currentUser.masv === masv) {
              currentUser.anh3x4 = res.photoUrl;
              localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
            }
          }
        } else {
          syncError = res.message || 'Server sync failed';
          console.warn('GAS uploadPhoto returned error:', res);
        }
      } catch (err) {
        syncError = err.message || 'Network error';
        console.warn('Sync uploadPhoto failed:', err);
      }
    }

    return {
      success: true,
      message: syncSuccess 
        ? 'Đã tải lên ảnh 3x4 thành công! Ảnh đang trong trạng thái CHỜ DUYỆT bởi Ban Quản trị.'
        : 'Đã lưu ảnh 3x4 tạm thời. ' + (syncError ? '⚠️ Chưa đồng bộ được (' + syncError + ')' : ''),
      syncedToServer: syncSuccess,
      photoUrl: localPhoto,
      photoStatus: 'CHỜ DUYỆT'
    };
  }

  // Helper: Compress image to reduce base64 payload size for GAS upload
  _compressImage(base64Str, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = reject;
      img.src = base64Str;
    });
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

    const currentUser = this.getCurrentUser();
    if (currentUser && String(currentUser.masv).trim() === String(masv).trim()) {
      currentUser.photoApproved = isApproved;
      currentUser.photoStatus = status.toUpperCase();
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    }

    if (this.apiUrl) {
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'adminApprovePhoto',
            masv,
            status,
            adminPass
          })
        });
        if (response.ok) {
          const resJson = await response.json();
          if (!resJson.success) {
            console.warn('Apps Script admin approval response:', resJson.message);
          }
        }
      } catch (err) {
        console.warn('Sync admin approval to Google Apps Script failed:', err);
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
