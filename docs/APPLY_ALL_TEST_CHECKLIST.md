# Checklist Test Chức Năng "Áp Dụng Tất Cả"

## Chuẩn Bị
- [ ] Đảm bảo đã pull code mới nhất từ repository
- [ ] Chạy `bun install` để cài đặt dependencies
- [ ] Chạy `bun run build` để verify không có lỗi compile
- [ ] Khởi động dev server: `bun run dev`

## Test Case 1: Apply All với Experience Section
**Mục đích:** Verify array sections không bị mất dữ liệu

### Steps:
1. [ ] Đăng nhập vào hệ thống
2. [ ] Tạo CV mới hoặc mở CV có sẵn
3. [ ] Thêm ít nhất 2 experience entries với đầy đủ thông tin:
   - Company: "ABC Corp"
   - Position: "Software Engineer"
   - Bullets: ["Developed features", "Fixed bugs"]
4. [ ] Paste Job Description và score CV
5. [ ] Verify có suggestions cho experience section
6. [ ] Click nút "Áp dụng tất cả (X)"
7. [ ] **Expected Results:**
   - [ ] Thông báo "Đã áp dụng thành công X gợi ý!"
   - [ ] Experience entry được suggest có thay đổi
   - [ ] CÁC EXPERIENCE ENTRIES KHÁC VẪN CÒN NGUYÊN VẸN
   - [ ] Không bị mất dữ liệu nào

### Debug:
- [ ] Mở Console (F12) và check logs:
  ```
  Apply all result: { appliedCount: X, ... }
  CV sections reloaded successfully after applying all suggestions
  ```

## Test Case 2: Apply All với Skills Section
**Mục đích:** Verify skills merge logic bảo tồn dữ liệu

### Steps:
1. [ ] Mở CV (có thể dùng CV từ Test Case 1)
2. [ ] Đảm bảo Skills section có cả technical VÀ soft skills:
   - Technical: ["JavaScript", "React", "Node.js"]
   - Soft: ["Communication", "Leadership"]
3. [ ] Score CV để có suggestions thêm skills (ví dụ: "Python", "TypeScript")
4. [ ] Click "Áp dụng tất cả"
5. [ ] **Expected Results:**
   - [ ] Technical skills có thêm keywords mới từ suggestions
   - [ ] **SOFT SKILLS VẪN CÒN NGUYÊN VẸN** (không bị xóa)
   - [ ] Tất cả skills được hiển thị đúng trong UI

### Debug:
- [ ] Check Console logs xem updatedData có merge đúng không:
  ```
  Applying suggestion in apply-all: {
    section_type: "skills",
    currentData: { technical: [...], soft: [...] },
    suggestedContent: { technical: [...] },
    updatedData: { technical: [...], soft: [...] }
  }
  ```

## Test Case 3: Apply All Multiple Sections
**Mục đích:** Verify apply all hoạt động đúng với nhiều sections

### Steps:
1. [ ] Tạo CV mới với đầy đủ thông tin:
   - Personal Info
   - Summary
   - Experience (2 entries)
   - Skills (technical + soft)
   - Education
2. [ ] Paste Job Description và score CV
3. [ ] Verify có suggestions cho NHIỀU sections khác nhau
4. [ ] Note số lượng suggestions: ____
5. [ ] Click "Áp dụng tất cả"
6. [ ] **Expected Results:**
   - [ ] Thông báo "Đã áp dụng thành công X gợi ý!"
   - [ ] TẤT CẢ sections có suggestions đều được cập nhật
   - [ ] Không section nào bị mất dữ liệu
   - [ ] UI cập nhật và hiển thị đúng thay đổi

## Test Case 4: UI Update Verification
**Mục đích:** Verify UI cập nhật đúng sau khi apply all

### Steps:
1. [ ] Mở CV và score để có suggestions
2. [ ] Note nội dung hiện tại của 1 section có suggestion (ví dụ: Experience entry đầu tiên)
3. [ ] Click "Áp dụng tất cả"
4. [ ] **Expected Results:**
   - [ ] Suggestions panel cập nhật: suggestions đã apply có checkmark/disabled
   - [ ] Section content CẬP NHẬT NGAY trên UI (không cần refresh)
   - [ ] Có thể thấy thay đổi ngay sau khi apply
   - [ ] Nếu navigate sang tab khác và quay lại, thay đổi vẫn còn

## Test Case 5: Error Handling
**Mục đích:** Verify error handling khi có vấn đề

### Steps:
1. [ ] Mở CV và score để có suggestions
2. [ ] Mở Network tab trong DevTools
3. [ ] Click "Áp dụng tất cả"
4. [ ] Giả lập network error (disable network trong DevTools)
5. [ ] Click "Áp dụng tất cả" lần nữa
6. [ ] **Expected Results:**
   - [ ] Hiển thị toast error message rõ ràng
   - [ ] Nút "Áp dụng tất cả" về trạng thái bình thường (không bị stuck)
   - [ ] CV data không bị corrupted
   - [ ] Console logs error details để debug

## Test Case 6: Edge Cases

### 6a. Apply All khi không có suggestions
1. [ ] Mở CV chưa score hoặc CV đã apply hết suggestions
2. [ ] Click "Áp dụng tất cả"
3. [ ] **Expected:** Thông báo "Không có gợi ý nào để áp dụng"

### 6b. Apply All với empty sections
1. [ ] Tạo CV mới với một số sections để trống (ví dụ: Projects)
2. [ ] Score CV
3. [ ] Click "Áp dụng tất cả"
4. [ ] **Expected:** Sections không trống được update, sections trống không bị error

### 6c. Apply All nhiều lần liên tiếp
1. [ ] Mở CV và score để có suggestions
2. [ ] Click "Áp dụng tất cả" lần 1
3. [ ] Chờ xong, click "Áp dụng tất cả" lần 2
4. [ ] **Expected:** 
   - [ ] Lần 1: Apply thành công
   - [ ] Lần 2: "Không có gợi ý nào để áp dụng" (vì đã apply hết)

## Regression Tests

### Verify Apply Single Suggestion vẫn hoạt động
1. [ ] Mở CV và score để có suggestions
2. [ ] Click nút "Apply" trên 1 suggestion đơn lẻ (không phải Apply All)
3. [ ] **Expected:** Single suggestion vẫn apply đúng như trước

### Verify Save CV vẫn hoạt động
1. [ ] Sau khi apply all, edit thêm thông tin khác trong CV
2. [ ] Verify có thông báo "Đang lưu..."/"Đã lưu"
3. [ ] Refresh page
4. [ ] **Expected:** Cả thay đổi từ apply all VÀ thay đổi manual đều được lưu

## Performance Test
1. [ ] Tạo CV với nhiều sections và nhiều entries
2. [ ] Score để có 10+ suggestions
3. [ ] Click "Áp dụng tất cả"
4. [ ] **Expected:**
   - [ ] Apply all hoàn thành trong < 5 seconds
   - [ ] UI không bị freeze/lag
   - [ ] Console không có warning/error

## Kết Quả Test

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: Experience | ⬜ Pass / ⬜ Fail | |
| TC2: Skills | ⬜ Pass / ⬜ Fail | |
| TC3: Multiple Sections | ⬜ Pass / ⬜ Fail | |
| TC4: UI Update | ⬜ Pass / ⬜ Fail | |
| TC5: Error Handling | ⬜ Pass / ⬜ Fail | |
| TC6: Edge Cases | ⬜ Pass / ⬜ Fail | |
| Regression: Single Apply | ⬜ Pass / ⬜ Fail | |
| Regression: Save CV | ⬜ Pass / ⬜ Fail | |
| Performance | ⬜ Pass / ⬜ Fail | |

## Issues Found

### Issue 1
- **Test Case:** _______
- **Description:** _______
- **Steps to Reproduce:** _______
- **Expected:** _______
- **Actual:** _______
- **Console Logs:** _______

### Issue 2
(Add more as needed)

## Sign Off
- Tester: __________________
- Date: __________________
- Overall Result: ⬜ Pass / ⬜ Fail
- Ready for Production: ⬜ Yes / ⬜ No
