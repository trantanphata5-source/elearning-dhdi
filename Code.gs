/**
 * =========================================================================
 * GOOGLE APPS SCRIPT BACKEND CHO E-LEARNING DHDI21AVL
 * Cổng học tập trực tuyến Khóa DHDI21AVL
 * Môn: 4237010467 - Nhà máy điện và trạm biến áp
 * =========================================================================
 */

// CẤU HÌNH HỆ THỐNG
const SPREADSHEET_ID = "14tqLynkXE4gAkya9wSJeBTfE8zGLyIt13GmNiO5JpOM";
const DRIVE_FOLDER_ID = "1ak-ATeVddyCmHI9wvr82917zOZaaQUDE"; // Google Drive Folder lưu ảnh 3x4
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "@A12345678"; // Mật khẩu quản trị viên mới

// Cột trong dữ liệu (1-indexed)
const COLS = {
  STT: 1,           // Cột A: STT
  MASV: 2,          // Cột B: Mã SV
  HODEM: 3,         // Cột C: Họ đệm
  TEN: 4,           // Cột D: Tên
  LOP: 5,           // Cột E: Lớp học
  NHOM: 6,          // Cột F: Nhóm
  GIOITINH: 7,      // Cột G: Giới tính (Nam / Nữ)
  NGAYSINH: 8,      // Cột H: Ngày sinh
  SDT: 9,           // Cột I: Số điện thoại
  EMAIL: 10,        // Cột J: Email
  DIACHI: 11,       // Cột K: Địa chỉ
  QUEQUAN: 12,      // Cột L: Quê quán
  ANH3X4: 13,       // Cột M: Ảnh 3x4
  SOTHICH: 14,      // Cột N: Sở thích
  MATKHAU: 15,      // Cột O: Mật khẩu
  TRANGTHAI_ANH: 16 // Cột P: Duyệt ảnh (ĐÃ DUYỆT / CHỜ DUYỆT / TỪ CHỐI)
};

/**
 * Xử lý GET Request
 */
function doGet(e) {
  return handleRequest(e, 'GET');
}

/**
 * Xử lý POST Request
 */
function doPost(e) {
  return handleRequest(e, 'POST');
}

/**
 * Xử lý chung các yêu cầu API
 */
function handleRequest(e, method) {
  let params = {};
  let action = '';

  try {
    if (e && e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
      action = params.action || '';
    } else if (e && e.parameter) {
      params = e.parameter;
      action = params.action || '';
    }
  } catch (err) {
    if (e && e.parameter) {
      params = e.parameter;
      action = params.action || '';
    }
  }

  let result = { success: false, message: 'Hành động không hợp lệ' };

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    switch (action) {
      case 'ping':
        result = { success: true, message: 'Máy chủ API hoạt động tốt!', timestamp: new Date().toISOString() };
        break;

      case 'getStudents':
        result = apiGetStudents(ss);
        break;

      case 'verifyStudent':
        result = apiVerifyStudent(ss, params.masv);
        break;

      case 'register':
        result = apiRegisterStudent(ss, params);
        break;

      case 'login':
        result = apiLogin(ss, params.username || params.masv, params.password);
        break;

      case 'changePassword':
        result = apiChangePassword(ss, params.masv, params.oldPassword, params.newPassword);
        break;

      case 'uploadPhoto':
        result = apiUploadPhoto(ss, params.masv, params.photoBase64, params.photoUrl);
        break;

      case 'adminApprovePhoto':
        result = apiAdminApprovePhoto(ss, params.masv, params.status, params.adminPass);
        break;

      case 'getAdminData':
        result = apiGetAdminData(ss, params.adminPass);
        break;

      default:
        result = { success: false, message: 'Unknown action: ' + action };
        break;
    }
  } catch (error) {
    result = { success: false, error: error.toString(), message: 'Lỗi máy chủ: ' + error.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 1. Lấy toàn bộ danh sách sinh viên từ 5 sheets
 */
function apiGetStudents(ss) {
  const sheets = ss.getSheets();
  let students = [];

  sheets.forEach((sheet, sheetIndex) => {
    const sheetName = sheet.getName();
    const lastRow = sheet.getLastRow();
    if (lastRow < 3) return;

    const classTitle = sheet.getRange(1, 3).getValue() || sheetName;
    const dataRange = sheet.getRange(3, 1, lastRow - 2, 16);
    const rows = dataRange.getValues();

    rows.forEach((row, idx) => {
      const masv = String(row[COLS.MASV - 1] || '').trim();
      if (!masv) return;

      const hodem = String(row[COLS.HODEM - 1] || '').trim();
      const ten = String(row[COLS.TEN - 1] || '').trim();
      const lop = String(row[COLS.LOP - 1] || '').trim();
      const nhom = String(row[COLS.NHOM - 1] || '').trim();
      const gioitinh = String(row[COLS.GIOITINH - 1] || '').trim();
      const ngaysinh = formatSheetDate(row[COLS.NGAYSINH - 1]);
      const sdt = String(row[COLS.SDT - 1] || '').trim();
      const email = String(row[COLS.EMAIL - 1] || '').trim();
      const diachi = String(row[COLS.DIACHI - 1] || '').trim();
      const quequan = String(row[COLS.QUEQUAN - 1] || '').trim();
      const anh3x4 = String(row[COLS.ANH3X4 - 1] || '').trim();
      const sothich = String(row[COLS.SOTHICH - 1] || '').trim();
      const matkhau = String(row[COLS.MATKHAU - 1] || '').trim();
      const trangthaiAnh = String(row[COLS.TRANGTHAI_ANH - 1] || '').trim();
      const photoApproved = trangthaiAnh.toUpperCase() === 'ĐÃ DUYỆT' || trangthaiAnh.toUpperCase() === 'APPROVED';

      students.push({
        sheetName: sheetName,
        sheetIndex: sheetIndex,
        rowIndex: idx + 3,
        className: classTitle,
        stt: row[COLS.STT - 1] || (students.length + 1),
        masv: masv,
        hodem: hodem,
        ten: ten,
        fullname: (hodem + ' ' + ten).trim(),
        lop: lop,
        nhom: nhom,
        gioitinh: gioitinh,
        ngaysinh: ngaysinh,
        sdt: sdt,
        email: email,
        diachi: diachi,
        quequan: quequan,
        anh3x4: anh3x4,
        photoStatus: trangthaiAnh || (anh3x4 ? 'CHỜ DUYỆT' : 'CHƯA CÓ'),
        photoApproved: photoApproved,
        sothich: sothich,
        isRegistered: !!(matkhau || email)
      });
    });
  });

  return { success: true, total: students.length, students: students };
}

/**
 * 2. Xác thực Mã SV trước khi cho điền thông tin
 */
function apiVerifyStudent(ss, masv) {
  if (!masv) return { success: false, message: 'Vui lòng cung cấp Mã số sinh viên' };

  masv = String(masv).trim();
  const sheets = ss.getSheets();

  for (let sheet of sheets) {
    const lastRow = sheet.getLastRow();
    if (lastRow < 3) continue;

    const data = sheet.getRange(3, 1, lastRow - 2, 16).getValues();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowMasv = String(row[COLS.MASV - 1] || '').trim();

      if (rowMasv === masv) {
        const hodem = String(row[COLS.HODEM - 1] || '').trim();
        const ten = String(row[COLS.TEN - 1] || '').trim();
        const lop = String(row[COLS.LOP - 1] || '').trim();
        const nhom = String(row[COLS.NHOM - 1] || '').trim();
        const gioitinh = String(row[COLS.GIOITINH - 1] || '').trim();
        const email = String(row[COLS.EMAIL - 1] || '').trim();
        const matkhau = String(row[COLS.MATKHAU - 1] || '').trim();
        const ngaysinh = formatSheetDate(row[COLS.NGAYSINH - 1]);
        const sdt = String(row[COLS.SDT - 1] || '').trim();
        const diachi = String(row[COLS.DIACHI - 1] || '').trim();
        const quequan = String(row[COLS.QUEQUAN - 1] || '').trim();
        const sothich = String(row[COLS.SOTHICH - 1] || '').trim();
        const anh3x4 = String(row[COLS.ANH3X4 - 1] || '').trim();

        return {
          success: true,
          found: true,
          isRegistered: !!(matkhau && email),
          student: {
            masv: masv,
            hodem: hodem,
            ten: ten,
            fullname: (hodem + ' ' + ten).trim(),
            lop: lop,
            nhom: nhom,
            gioitinh: gioitinh,
            ngaysinh: ngaysinh,
            sdt: sdt,
            email: email,
            diachi: diachi,
            quequan: quequan,
            sothich: sothich,
            anh3x4: anh3x4
          }
        };
      }
    }
  }

  return { success: false, found: false, message: 'Mã số sinh viên không tồn tại trong danh sách 5 lớp!' };
}

/**
 * 3. Đăng ký thông tin: Lưu dữ liệu + Tạo MK ngẫu nhiên 10 ký tự + Gửi Email
 */
function apiRegisterStudent(ss, data) {
  const masv = String(data.masv || '').trim();
  const ngaysinh = String(data.ngaysinh || '').trim();
  const sdt = String(data.sdt || '').trim();
  const email = String(data.email || '').trim();
  const diachi = String(data.diachi || '').trim();
  const quequan = String(data.quequan || '').trim();
  const sothich = String(data.sothich || '').trim();

  if (!masv) return { success: false, message: 'Mã SV không được để trống' };
  if (!ngaysinh) return { success: false, message: 'Ngày sinh là bắt buộc' };
  if (!sdt) return { success: false, message: 'Số điện thoại là bắt buộc' };
  if (!email) return { success: false, message: 'Email là bắt buộc' };

  const generatedPassword = generateRandomPassword(10);
  const sheets = ss.getSheets();
  let found = false;
  let targetSheet = null;
  let targetRowIndex = -1;
  let studentName = '';
  let studentClass = '';

  for (let sheet of sheets) {
    const lastRow = sheet.getLastRow();
    if (lastRow < 3) continue;

    const values = sheet.getRange(3, 1, lastRow - 2, 16).getValues();

    for (let i = 0; i < values.length; i++) {
      const rowMasv = String(values[i][COLS.MASV - 1] || '').trim();
      if (rowMasv === masv) {
        found = true;
        targetSheet = sheet;
        targetRowIndex = i + 3;
        studentName = (String(values[i][COLS.HODEM - 1] || '') + ' ' + String(values[i][COLS.TEN - 1] || '')).trim();
        studentClass = String(values[i][COLS.LOP - 1] || '').trim();
        break;
      }
    }
    if (found) break;
  }

  if (!found) {
    return { success: false, message: 'Không tìm thấy sinh viên với Mã SV: ' + masv };
  }

  // Lưu thông tin vào hệ thống (theo đúng cột mới)
  targetSheet.getRange(targetRowIndex, COLS.NGAYSINH).setValue(ngaysinh);
  targetSheet.getRange(targetRowIndex, COLS.SDT).setValue("'" + sdt);
  targetSheet.getRange(targetRowIndex, COLS.EMAIL).setValue(email);
  targetSheet.getRange(targetRowIndex, COLS.DIACHI).setValue(diachi);
  targetSheet.getRange(targetRowIndex, COLS.QUEQUAN).setValue(quequan);
  targetSheet.getRange(targetRowIndex, COLS.SOTHICH).setValue(sothich);
  targetSheet.getRange(targetRowIndex, COLS.MATKHAU).setValue(generatedPassword);

  if (targetSheet.getRange(2, COLS.TRANGTHAI_ANH).getValue() === '') {
    targetSheet.getRange(2, COLS.TRANGTHAI_ANH).setValue('Duyệt ảnh');
  }

  // Đảm bảo ghi xuống Sheet ngay lập tức
  SpreadsheetApp.flush();

  // Gửi Email tài khoản và mật khẩu
  let emailSent = false;
  let emailError = '';
  try {
    sendLoginCredentialsEmail(email, studentName, masv, generatedPassword, studentClass);
    emailSent = true;
  } catch (e) {
    emailError = e.toString();
  }

  return {
    success: true,
    message: 'Đăng ký thông tin thành công! Mật khẩu đăng nhập đã được gửi về email: ' + email,
    masv: masv,
    fullname: studentName,
    email: email,
    emailSent: emailSent,
    emailError: emailError,
    tempPassword: generatedPassword
  };
}

/**
 * 4. Đăng nhập hệ thống
 */
function apiLogin(ss, username, password) {
  if (!username || !password) {
    return { success: false, message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' };
  }

  username = String(username).trim();
  password = String(password).trim();

  // Kiểm tra Quản trị viên
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return {
      success: true,
      isAdmin: true,
      user: {
        role: 'ADMIN',
        username: ADMIN_USERNAME,
        fullname: 'Quản trị viên E-Learning',
        email: 'admin@dhdi21avl.edu.vn'
      },
      message: 'Đăng nhập Quản trị viên thành công'
    };
  }

  // Kiểm tra Sinh viên
  const sheets = ss.getSheets();
  for (let sheet of sheets) {
    const lastRow = sheet.getLastRow();
    if (lastRow < 3) continue;

    const data = sheet.getRange(3, 1, lastRow - 2, 16).getValues();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowMasv = String(row[COLS.MASV - 1] || '').trim();
      const rowPass = String(row[COLS.MATKHAU - 1] || '').trim();

      if (rowMasv === username) {
        if (!rowPass) {
          return {
            success: false,
            message: 'Tài khoản chưa được kích hoạt. Vui lòng bấm "Điền thông tin" để nhận mật khẩu!'
          };
        }

        if (rowPass === password) {
          const hodem = String(row[COLS.HODEM - 1] || '').trim();
          const ten = String(row[COLS.TEN - 1] || '').trim();
          const gioitinh = String(row[COLS.GIOITINH - 1] || '').trim();
          const trangthaiAnh = String(row[COLS.TRANGTHAI_ANH - 1] || '').trim();
          const photoApproved = trangthaiAnh.toUpperCase() === 'ĐÃ DUYỆT' || trangthaiAnh.toUpperCase() === 'APPROVED';

          return {
            success: true,
            isAdmin: false,
            user: {
              role: 'STUDENT',
              masv: rowMasv,
              hodem: hodem,
              ten: ten,
              fullname: (hodem + ' ' + ten).trim(),
              lop: String(row[COLS.LOP - 1] || '').trim(),
              nhom: String(row[COLS.NHOM - 1] || '').trim(),
              gioitinh: gioitinh,
              ngaysinh: formatSheetDate(row[COLS.NGAYSINH - 1]),
              sdt: String(row[COLS.SDT - 1] || '').trim(),
              email: String(row[COLS.EMAIL - 1] || '').trim(),
              diachi: String(row[COLS.DIACHI - 1] || '').trim(),
              quequan: String(row[COLS.QUEQUAN - 1] || '').trim(),
              anh3x4: String(row[COLS.ANH3X4 - 1] || '').trim(),
              photoStatus: trangthaiAnh || (row[COLS.ANH3X4 - 1] ? 'CHỜ DUYỆT' : 'CHƯA CÓ'),
              photoApproved: photoApproved,
              sothich: String(row[COLS.SOTHICH - 1] || '').trim(),
              sheetName: sheet.getName(),
              rowIndex: i + 3
            },
            message: 'Đăng nhập thành công'
          };
        } else {
          return { success: false, message: 'Mật khẩu không chính xác. Vui lòng thử lại!' };
        }
      }
    }
  }

  return { success: false, message: 'Mã số sinh viên không tồn tại trong danh sách' };
}

/**
 * 5. Đổi mật khẩu
 */
function apiChangePassword(ss, masv, oldPassword, newPassword) {
  if (!masv || !oldPassword || !newPassword) {
    return { success: false, message: 'Vui lòng cung cấp đầy đủ thông tin đổi mật khẩu' };
  }

  masv = String(masv).trim();
  oldPassword = String(oldPassword).trim();
  newPassword = String(newPassword).trim();

  if (newPassword.length < 6) {
    return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
  }

  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var lastRow = sheet.getLastRow();
    if (lastRow < 3) continue;

    var numRows = lastRow - 2;
    var values = sheet.getRange(3, 1, numRows, 16).getValues();

    for (var i = 0; i < values.length; i++) {
      var rowMasv = String(values[i][COLS.MASV - 1] || '').trim();
      var currentPass = String(values[i][COLS.MATKHAU - 1] || '').trim();

      if (rowMasv === masv) {
        if (currentPass !== oldPassword) {
          return { success: false, message: 'Mật khẩu cũ không chính xác' };
        }

        sheet.getRange(i + 3, COLS.MATKHAU).setValue(newPassword);
        SpreadsheetApp.flush();
        return { success: true, message: 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.' };
      }
    }
  }

  return { success: false, message: 'Không tìm thấy tài khoản sinh viên với Mã SV: ' + masv };
}

/**
 * 6. Upload ảnh 3x4 vào Google Drive + cập nhật Google Sheet
 */
function apiUploadPhoto(ss, masv, photoBase64, photoUrl) {
  if (!masv) return { success: false, message: 'Thiếu Mã số sinh viên' };

  masv = String(masv).trim();
  var finalPhotoUrl = photoUrl || '';
  var driveFileId = '';

  // BƯỚC 1: Upload ảnh lên Google Drive
  if (photoBase64 && photoBase64.indexOf('base64,') > -1) {
    try {
      var contentType = photoBase64.substring(5, photoBase64.indexOf(';'));
      var rawBase64 = photoBase64.split('base64,')[1];
      var bytes = Utilities.base64Decode(rawBase64);
      var fileName = masv + '_3x4_' + new Date().getTime() + '.jpg';
      var blob = Utilities.newBlob(bytes, contentType, fileName);

      var folder;
      try {
        folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      } catch (fe) {
        folder = DriveApp.getRootFolder();
      }

      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      driveFileId = file.getId();
      finalPhotoUrl = 'https://lh3.googleusercontent.com/d/' + driveFileId;
    } catch (driveErr) {
      // Nếu Drive lỗi, dùng base64 làm fallback
      finalPhotoUrl = photoBase64;
    }
  }

  if (!finalPhotoUrl) {
    return { success: false, message: 'Không có dữ liệu ảnh để xử lý' };
  }

  // BƯỚC 2: Cập nhật Google Sheet
  try {
    var sheets = ss.getSheets();
    for (var s = 0; s < sheets.length; s++) {
      var sheet = sheets[s];
      var lastRow = sheet.getLastRow();
      if (lastRow < 3) continue;

      var numRows = lastRow - 2;
      var masvRange = sheet.getRange(3, COLS.MASV, numRows, 1).getValues();

      for (var i = 0; i < masvRange.length; i++) {
        var rowMasv = String(masvRange[i][0] || '').trim();
        if (rowMasv === masv) {
          var rowIdx = i + 3;

          sheet.getRange(rowIdx, COLS.ANH3X4).setValue(finalPhotoUrl);
          sheet.getRange(rowIdx, COLS.TRANGTHAI_ANH).setValue('CHỜ DUYỆT');
          SpreadsheetApp.flush();

          return {
            success: true,
            message: 'Cập nhật ảnh 3x4 thành công! Vui lòng chờ Ban Quản trị phê duyệt.',
            photoUrl: finalPhotoUrl,
            driveFileId: driveFileId,
            photoStatus: 'CHỜ DUYỆT',
            sheetUpdated: true
          };
        }
      }
    }
  } catch (sheetErr) {
    return {
      success: false,
      message: 'Lỗi cập nhật Sheet: ' + sheetErr.message,
      sheetUpdated: false
    };
  }

  return { success: false, message: 'Không tìm thấy sinh viên với mã: ' + masv };
}

/**
 * 7. Admin Duyệt ảnh 3x4
 */
function apiAdminApprovePhoto(ss, masv, status, adminPass) {
  masv = String(masv || '').trim();
  status = String(status || 'ĐÃ DUYỆT').toUpperCase();

  if (!masv) {
    return { success: false, message: 'Vui lòng cung cấp Mã số sinh viên' };
  }

  const sheets = ss.getSheets();
  for (let s = 0; s < sheets.length; s++) {
    const sheet = sheets[s];
    const lastRow = sheet.getLastRow();
    if (lastRow < 3) continue;

    const numRows = lastRow - 2;
    const masvRange = sheet.getRange(3, COLS.MASV, numRows, 1).getValues();

    for (let i = 0; i < masvRange.length; i++) {
      const rowMasv = String(masvRange[i][0] || '').trim();
      if (rowMasv === masv) {
        const rowIdx = i + 3;
        sheet.getRange(rowIdx, COLS.TRANGTHAI_ANH).setValue(status);
        SpreadsheetApp.flush();
        return {
          success: true,
          message: 'Đã cập nhật trạng thái ảnh sinh viên ' + masv + ' thành: ' + status,
          status: status
        };
      }
    }
  }

  return { success: false, message: 'Không tìm thấy sinh viên' };
}

/**
 * 8. Admin lấy dữ liệu tổng hợp
 */
function apiGetAdminData(ss, adminPass) {
  if (adminPass !== ADMIN_PASSWORD) {
    return { success: false, message: 'Sai mật khẩu quản trị viên' };
  }

  const all = apiGetStudents(ss);
  if (!all.success) return all;

  const pendingPhotos = all.students.filter(s => s.anh3x4 && !s.photoApproved);
  const approvedPhotos = all.students.filter(s => s.photoApproved);
  const registeredCount = all.students.filter(s => s.isRegistered).length;

  return {
    success: true,
    stats: {
      totalStudents: all.total,
      registeredStudents: registeredCount,
      pendingApprovalCount: pendingPhotos.length,
      approvedCount: approvedPhotos.length
    },
    pendingPhotos: pendingPhotos,
    students: all.students
  };
}

function generateRandomPassword(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randIndex = Math.floor(Math.random() * chars.length);
    password += chars.charAt(randIndex);
  }
  return password;
}

function formatSheetDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const d = ('0' + val.getDate()).slice(-2);
    const m = ('0' + (val.getMonth() + 1)).slice(-2);
    const y = val.getFullYear();
    return d + '/' + m + '/' + y;
  }
  return String(val).trim();
}

function sendLoginCredentialsEmail(toEmail, studentName, masv, password, className) {
  const subject = "🎓 [E-LEARNING DHDI21AVL] Thông tin tài khoản & Mật khẩu đăng nhập";
  
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">CỔNG HỌC TẬP TRỰC TUYẾN E-LEARNING</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Học phần: Nhà máy điện và trạm biến áp (DHDI21AVL)</p>
      </div>
      
      <div style="padding: 28px 24px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 16px; margin-top: 0;">Kính gửi Anh/Chị: <strong style="color: #1e3a8a; font-size: 17px;">${studentName}</strong>,</p>
        <p style="font-size: 14px; color: #475569;">Hệ thống E-Learning đã ghi nhận thông tin đăng ký của Anh/Chị cho lớp học <strong>${className}</strong>. Dưới đây là thông tin tài khoản để truy cập vào hệ thống:</p>
        
        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 140px;">Tài khoản (Mã SV):</td>
              <td style="padding: 6px 0; color: #0f172a; font-size: 16px; font-weight: 700; font-family: monospace;">${masv}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Mật khẩu khởi tạo:</td>
              <td style="padding: 6px 0; color: #2563eb; font-size: 18px; font-weight: 700; font-family: monospace; letter-spacing: 1px;">${password}</td>
            </tr>
          </table>
        </div>

        <div style="background: #eff6ff; border: 1px dashed #93c5fd; border-radius: 8px; padding: 14px; margin-bottom: 22px;">
          <p style="margin: 0; font-size: 13px; color: #1e40af;">
            📌 <strong>Lưu ý quan trọng:</strong><br>
            • Vui lòng đăng nhập và thực hiện <strong>đổi lại mật khẩu cá nhân</strong> tại biểu tượng tài khoản (góc trên cùng bên phải).<br>
            • Cập nhật <strong>ảnh thẻ 3x4</strong> trên hồ sơ sinh viên để được Ban Quản trị phê duyệt và mở quyền truy cập <em>Chương trình hỗ trợ sư phạm</em>.
          </p>
        </div>

        <div style="text-align: center; margin: 25px 0 10px 0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">Email này được gửi tự động từ Hệ thống E-Learning Khóa DHDI21AVL. Vui lòng không trả lời trực tiếp email này.</p>
        </div>
      </div>
      
      <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        © 2026 Cổng Học Tập E-Learning Đại học CNKT Điện, Điện Tử DHDI21AVL
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: toEmail,
    subject: subject,
    htmlBody: htmlBody
  });
}
