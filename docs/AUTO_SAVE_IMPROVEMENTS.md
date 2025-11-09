# 🚀 Cải Tiến Cơ Chế Auto-Save

## Tổng Quan

Đã nâng cấp cơ chế auto-save trong `CVEditorContext.tsx` từ phiên bản đơn giản lên phiên bản "Pro" với 3 cải tiến chính:

1. **🛡️ Safety Net (Lưới an toàn)** - Ngăn mất dữ liệu khi đóng tab
2. **🧠 Smart Saving (Lưu thông minh)** - Chỉ lưu khi thực sự có thay đổi
3. **⚡ Immediate Save (Lưu ngay)** - Hỗ trợ lưu tức thì khi cần

---

## Chi Tiết Cải Tiến

### 1. 🛡️ Safety Net - Cảnh Báo Trước Khi Rời Trang

**Vấn đề cũ:** Người dùng có thể vô tình đóng tab/trình duyệt khi dữ liệu đang lưu, gây mất thông tin.

**Giải pháp:** Sử dụng sự kiện `beforeunload` để hiển thị cảnh báo của trình duyệt.

```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (state.isSaving || state.isDirty) {
      e.preventDefault();
      e.returnValue = ''; // Chrome yêu cầu
    }
  };

  if (state.isSaving || state.isDirty) {
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [state.isSaving, state.isDirty]);
```

**Lợi ích:**
- ✅ Người dùng được cảnh báo nếu có thay đổi chưa lưu
- ✅ Tránh mất dữ liệu do vô ý
- ✅ Trải nghiệm người dùng chuyên nghiệp hơn

---

### 2. 🧠 Smart Saving - Chỉ Lưu Khi Cần

**Vấn đề cũ:** Auto-save được trigger bất cứ khi nào `state.cvData` thay đổi, kể cả khi không có thay đổi thực sự từ người dùng.

**Giải pháp:** Thêm flag `isDirty` để theo dõi chính xác khi nào có thay đổi.

#### Cập nhật State:

```typescript
export interface CVEditorState {
  // ... các state khác
  isDirty: boolean; // Đánh dấu có thay đổi chưa lưu
}
```

#### Cập nhật Reducer Logic:

```typescript
case "SET_CV_DATA":
  return { 
    ...state, 
    cvData: action.payload, 
    isLoading: false, 
    isDirty: false // Reset khi load dữ liệu mới
  };

case "UPDATE_SECTION":
  return {
    ...state,
    cvData: { /* ... */ },
    isDirty: true // Đánh dấu có thay đổi
  };

case "SET_SAVE_STATUS":
  return {
    ...state,
    saveStatus: action.payload,
    isSaving: action.payload === "saving",
    // Reset isDirty khi lưu thành công
    isDirty: action.payload === "saved" ? false : state.isDirty,
  };
```

#### Auto-save Thông Minh:

```typescript
const autoSaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  // Chỉ trigger khi isDirty = true
  if (!state.isDirty || state.isLoading || !state.cvData) return;

  // Clear timeout cũ (debounce)
  if (autoSaveTimeoutRef.current) {
    clearTimeout(autoSaveTimeoutRef.current);
  }

  // Đợi 2s sau lần thay đổi cuối cùng
  autoSaveTimeoutRef.current = setTimeout(() => {
    saveCV();
  }, 2000);

  return () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  };
}, [state.cvData, state.isDirty, state.isLoading, saveCV]);
```

**Lợi ích:**
- ✅ Giảm số lượng request không cần thiết đến server
- ✅ Tối ưu hiệu suất
- ✅ Tiết kiệm băng thông và tài nguyên server

---

### 3. ⚡ Immediate Save - Lưu Ngay Lập Tức

**Vấn đề cũ:** Có những tình huống cần lưu ngay lập tức (trước khi export PDF, chuyển trang, v.v.) nhưng phải đợi debounce timeout.

**Giải pháp:** Thêm hàm `saveNow()` vào Context API.

```typescript
interface CVEditorContextType {
  // ... các method khác
  saveNow: () => Promise<void>; // Method mới
}

const saveNow = useCallback(async () => {
  // Clear timeout đang chờ để tránh lưu 2 lần
  if (autoSaveTimeoutRef.current) {
    clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = null;
  }
  // Lưu ngay lập tức
  return await saveCV();
}, [saveCV]);
```

**Cách sử dụng trong component:**

```typescript
import { useCVEditor } from "@/contexts/CVEditorContext";

function ExportButton() {
  const { saveNow } = useCVEditor();

  const handleExport = async () => {
    // Lưu ngay trước khi export
    await saveNow();
    
    // Tiếp tục logic export PDF...
    exportToPDF();
  };

  return <button onClick={handleExport}>Export PDF</button>;
}
```

**Lợi ích:**
- ✅ Đảm bảo dữ liệu được lưu trước các thao tác quan trọng
- ✅ Linh hoạt cho các use case đặc biệt
- ✅ Tránh race condition

---

## So Sánh Trước/Sau

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| Cảnh báo đóng tab | ❌ Không có | ✅ Có cảnh báo beforeunload |
| Lưu không cần thiết | ⚠️ Có thể lưu nhiều lần | ✅ Chỉ lưu khi isDirty |
| Debouncing | ✅ Có (2s) | ✅ Có (2s) + ref management |
| Lưu ngay lập tức | ❌ Không có | ✅ Hàm saveNow() |
| Tracking thay đổi | ⚠️ Dựa vào cvData | ✅ Flag isDirty chính xác |

---

## Best Practices Đã Áp Dụng

### 1. Sử dụng `useRef` cho Timer
```typescript
// ✅ ĐÚNG - Ref không trigger re-render
const autoSaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

// ❌ SAI - State trigger re-render không cần thiết
const [timeoutId, setTimeoutId] = useState<number | null>(null);
```

### 2. Cleanup Event Listener Đúng Cách
```typescript
useEffect(() => {
  // Chỉ add listener khi cần
  if (state.isSaving || state.isDirty) {
    window.addEventListener('beforeunload', handleBeforeUnload);
  }
  
  // Luôn cleanup
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [state.isSaving, state.isDirty]);
```

### 3. Dependency Array Chính Xác
```typescript
// Bao gồm tất cả dependencies thực sự cần thiết
useEffect(() => {
  // ...
}, [state.cvData, state.isDirty, state.isLoading, saveCV]);
```

---

## Testing Checklist

- [ ] Gõ vào form → Thấy "Đang lưu..." → "Đã lưu" sau 2s
- [ ] Gõ liên tục → Chỉ thấy lưu 1 lần sau khi ngừng gõ 2s
- [ ] Cố đóng tab khi đang lưu → Thấy cảnh báo của trình duyệt
- [ ] Cố đóng tab khi có thay đổi chưa lưu → Thấy cảnh báo
- [ ] Đóng tab sau khi đã lưu xong → Không có cảnh báo
- [ ] Gọi `saveNow()` → Dữ liệu được lưu ngay lập tức
- [ ] Load trang mới → `isDirty = false`

---

## Tham Khảo

- [React Hooks Best Practices](https://react.dev/reference/react)
- [Next.js Data Fetching](https://nextjs.org/docs)
- [BeforeUnload Event MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)

---

## Ghi Chú Quan Trọng

### ⚠️ Browser Limitations

Trình duyệt hiện đại (Chrome, Firefox, Safari) **không cho phép tùy chỉnh message** trong dialog `beforeunload`. Bạn chỉ có thể kích hoạt dialog mặc định của trình duyệt.

```typescript
// ❌ Không hoạt động trong trình duyệt hiện đại
e.returnValue = 'Bạn có chắc muốn rời đi không?';

// ✅ Đúng - Dùng string rỗng
e.returnValue = '';
```

### 🔄 State Flow

```
User edits → isDirty = true
  ↓
Debounce 2s
  ↓
saveCV() → isSaving = true
  ↓
API Success → isDirty = false, saveStatus = "saved"
```

---

## Kết Luận

Cơ chế auto-save mới đã được nâng cấp đáng kể:
- **Đáng tin cậy hơn** với Safety Net
- **Hiệu quả hơn** với Smart Saving
- **Linh hoạt hơn** với Immediate Save

Đây là nền tảng vững chắc cho một ứng dụng soạn thảo CV chuyên nghiệp! 🎉
