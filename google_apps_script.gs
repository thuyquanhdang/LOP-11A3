/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: ĐỒNG BỘ ĐIỂM DANH LỚP 11A3 - TRỢ LÝ CHỦ NHIỆM
 * Giáo viên chủ nhiệm: Đặng Thị Thùy Quanh
 * Lớp: 11A3 (Sĩ số: 38 học sinh)
 * ==============================================================================
 * 
 * HƯỚNG DẪN CÀI ĐẶT 4 BƯỚC:
 * 1. Mở một file Google Sheet mới (hoặc file sẵn có của bạn trên Google Drive).
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa hết mã cũ trong tệp Code.gs, dán toàn bộ đoạn mã này vào.
 * 4. Nhấn nút "Triển khai" (Deploy) ở góc trên bên phải:
 *    - Chọn "Tùy chọn triển khai mới" (New deployment).
 *    - Loại: Chọn "Ứng dụng web" (Web app).
 *    - Mô tả: "Điểm danh 11A3".
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me).
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone).
 *    - Nhấn "Triển khai" (Deploy) và cấp quyền truy cập nếu được hỏi.
 *    - Sao chép "URL của ứng dụng web" (Web app URL có đuôi /exec).
 * 5. Dán URL này vào ứng dụng Trợ Lý Chủ Nhiệm để hoàn tất!
 * ==============================================================================
 */

// Xử lý yêu cầu POST khi người dùng bấm "Điểm danh ngay" từ web
function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : null;
    if (!rawData) {
      return createJsonResponse({ status: "error", message: "Không nhận được dữ liệu điểm danh." });
    }

    var payload = JSON.parse(rawData);
    var action = payload.action || 'saveAttendance';

    // 1. Kiểm tra kết nối (Ping)
    if (action === 'ping') {
      return createJsonResponse({
        status: "success",
        message: "Kết nối Google Apps Script thành công!",
        spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
        timestamp: new Date().toISOString()
      });
    }

    // 2. Lưu dữ liệu điểm danh
    if (action === 'saveAttendance') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var className = payload.className || '11A3';
      var homeroomTeacher = payload.homeroomTeacher || 'Đặng Thị Thùy Quanh';
      var date = payload.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
      var records = payload.records || [];
      var summary = payload.summary || {};

      // 2.1. Tạo hoặc chọn Sheet chi tiết điểm danh
      var sheetName = "Điểm_Danh_" + className;
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        setupAttendanceSheetHeader(sheet);
      }

      // Xóa các bản ghi cũ của ngày này nếu đã từng điểm danh trước đó (tránh trùng lặp)
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var dateValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
        for (var i = dateValues.length - 1; i >= 0; i--) {
          var cellDate = dateValues[i][0];
          var cellDateStr = cellDate instanceof Date 
            ? Utilities.formatDate(cellDate, "GMT+7", "yyyy-MM-dd") 
            : String(cellDate).trim();
            
          if (cellDateStr === date) {
            sheet.deleteRow(i + 2);
          }
        }
      }

      // 2.2. Ghi từng dòng điểm danh của 38 học sinh
      var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      var rowsToInsert = [];

      for (var j = 0; j < records.length; j++) {
        var rec = records[j];
        var statusLabel = getStatusLabel(rec.status);

        rowsToInsert.push([
          j + 1,                          // 1. STT
          date,                           // 2. Ngày điểm danh
          className,                      // 3. Lớp
          rec.studentCode || '',          // 4. Mã HS
          rec.fullName || '',             // 5. Họ và tên
          rec.ethnicity || '',            // 6. Dân tộc
          rec.gender || 'Chưa cập nhật',  // 7. Giới tính
          statusLabel,                    // 8. Trạng thái điểm danh
          rec.note || '',                 // 9. Lý do / Ghi chú
          homeroomTeacher,                // 10. GVCN
          nowStr                          // 11. Thời gian ghi nhận
        ]);
      }

      if (rowsToInsert.length > 0) {
        var startRow = sheet.getLastRow() + 1;
        var range = sheet.getRange(startRow, 1, rowsToInsert.length, rowsToInsert[0].length);
        range.setValues(rowsToInsert);

        // Định dạng màu cho cột Trạng thái
        highlightStatusColumn(sheet, startRow, rowsToInsert.length);
      }

      // 2.3. Tự động ghi vào Sheet Tổng Hợp Chuyên Cần
      updateSummarySheet(ss, className, date, homeroomTeacher, records.length, summary, nowStr);

      return createJsonResponse({
        status: "success",
        message: "Đã lưu thành công " + records.length + " học sinh vào Google Sheet!",
        date: date,
        recordedCount: records.length,
        timestamp: nowStr
      });
    }

    return createJsonResponse({ status: "error", message: "Hành động không hợp lệ." });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "Lỗi xử lý Apps Script: " + error.toString()
    });
  }
}

// Xử lý yêu cầu GET để kiểm tra trạng thái hoạt động của Web App
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return createJsonResponse({
    status: "online",
    message: "Google Apps Script Trợ Lý Chủ Nhiệm 11A3 đang hoạt động sẵn sàng.",
    spreadsheetTitle: ss ? ss.getName() : "Chưa liên kết bảng tính",
    serverTime: new Date().toISOString()
  });
}

// Hàm chuẩn hóa nhãn trạng thái điểm danh tiếng Việt
function getStatusLabel(status) {
  switch (status) {
    case 'present': return 'Có mặt';
    case 'excused': return 'Nghỉ có phép';
    case 'unexcused': return 'Nghỉ không phép';
    case 'late': return 'Đi muộn';
    default: return 'Có mặt';
  }
}

// Tạo tiêu đề đẹp cho Sheet Điểm Danh
function setupAttendanceSheetHeader(sheet) {
  var headers = [
    'STT', 
    'Ngày điểm danh', 
    'Lớp', 
    'Mã học sinh', 
    'Họ và tên', 
    'Dân tộc', 
    'Giới tính', 
    'Trạng thái điểm danh', 
    'Lý do / Ghi chú', 
    'GVCN', 
    'Thời gian đồng bộ'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Định dạng hàng tiêu đề
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1e40af'); // Xanh dương đậm
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 35);

  // Đóng băng dòng tiêu đề
  sheet.setFrozenRows(1);

  // Tự động căn chỉnh độ rộng cột
  sheet.setColumnWidth(1, 60);   // STT
  sheet.setColumnWidth(2, 120);  // Ngày
  sheet.setColumnWidth(3, 80);   // Lớp
  sheet.setColumnWidth(4, 100);  // Mã HS
  sheet.setColumnWidth(5, 200);  // Họ và tên
  sheet.setColumnWidth(6, 100);  // Dân tộc
  sheet.setColumnWidth(7, 110);  // Giới tính
  sheet.setColumnWidth(8, 140);  // Trạng thái
  sheet.setColumnWidth(9, 250);  // Ghi chú
  sheet.setColumnWidth(10, 180); // GVCN
  sheet.setColumnWidth(11, 160); // Thời gian
}

// Tô màu nhẹ nhàng trực quan cho trạng thái điểm danh
function highlightStatusColumn(sheet, startRow, numRows) {
  var statusRange = sheet.getRange(startRow, 8, numRows, 1);
  var values = statusRange.getValues();

  for (var k = 0; k < values.length; k++) {
    var val = values[k][0];
    var cell = sheet.getRange(startRow + k, 8);
    cell.setHorizontalAlignment('center');
    cell.setFontWeight('bold');

    if (val === 'Có mặt') {
      cell.setFontColor('#047857'); // Xanh lá
      cell.setBackground('#d1fae5');
    } else if (val === 'Nghỉ có phép') {
      cell.setFontColor('#1d4ed8'); // Xanh dương
      cell.setBackground('#dbeafe');
    } else if (val === 'Nghỉ không phép') {
      cell.setFontColor('#b91c1c'); // Đỏ
      cell.setBackground('#fee2e2');
    } else if (val === 'Đi muộn') {
      cell.setFontColor('#b45309'); // Cam
      cell.setBackground('#fef3c7');
    }
  }
}

// Cập nhật bảng tổng hợp chuyên cần theo ngày
function updateSummarySheet(ss, className, date, teacher, total, summary, timestamp) {
  var summarySheetName = "Tổng_Hợp_Chuyên_Cần";
  var sheet = ss.getSheetByName(summarySheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(summarySheetName);
    var headers = [
      'Ngày', 
      'Lớp', 
      'GVCN', 
      'Sĩ số', 
      'Có mặt', 
      'Nghỉ có phép', 
      'Nghỉ không phép', 
      'Đi muộn', 
      'Tỷ lệ chuyên cần', 
      'Thời gian cập nhật'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#065f46'); // Xanh ngọc lục bảo
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setRowHeight(1, 35);
    sheet.setFrozenRows(1);
  }

  // Xóa ngày cũ trong bảng tổng hợp nếu đã có
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var dateValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = dateValues.length - 1; i >= 0; i--) {
      var cellDate = dateValues[i][0];
      var cellDateStr = cellDate instanceof Date 
        ? Utilities.formatDate(cellDate, "GMT+7", "yyyy-MM-dd") 
        : String(cellDate).trim();
      if (cellDateStr === date) {
        sheet.deleteRow(i + 2);
      }
    }
  }

  var present = summary.presentCount !== undefined ? summary.presentCount : total;
  var excused = summary.excusedCount || 0;
  var unexcused = summary.unexcusedCount || 0;
  var late = summary.lateCount || 0;
  var rate = summary.attendanceRate ? summary.attendanceRate + '%' : '100%';

  sheet.appendRow([
    date,
    className,
    teacher,
    total,
    present,
    excused,
    unexcused,
    late,
    rate,
    timestamp
  ]);
}

// Trả về phản hồi dạng JSON với Header CORS đầy đủ
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
