# Auto-Save Quick Reference Guide

## 🎯 Quick Overview

The auto-save system now has 3 modes:

1. **🤖 Auto (Default)** - Saves automatically 2s after last edit
2. **⚡ Immediate** - Call `saveNow()` to save instantly  
3. **🛡️ Protected** - Warns before closing if unsaved changes

---

## 📖 For Developers

### Using in Components

```typescript
import { useCVEditor } from "@/contexts/CVEditorContext";

function MyComponent() {
  const { state, saveNow } = useCVEditor();
  
  // Check if there are unsaved changes
  if (state.isDirty) {
    console.log("User has unsaved changes");
  }
  
  // Save immediately before critical action
  const handleCriticalAction = async () => {
    await saveNow(); // Force save now
    // Continue with action...
  };
}
```

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `state.isDirty` | `boolean` | `true` if user has unsaved changes |
| `state.isSaving` | `boolean` | `true` while save is in progress |
| `state.saveStatus` | `"saved" \| "saving" \| "error"` | Current save status |

### Methods

| Method | Signature | Use Case |
|--------|-----------|----------|
| `saveCV()` | `() => Promise<void>` | Auto-called by system (debounced) |
| `saveNow()` | `() => Promise<void>` | Manual immediate save |

---

## 💡 Common Use Cases

### 1. Export PDF Button
```typescript
const handleExport = async () => {
  if (state.isDirty) {
    await saveNow(); // Save first
  }
  exportPDF(); // Then export
};
```

### 2. Navigation Confirmation
```typescript
const handleNavigate = async () => {
  if (state.isDirty) {
    const confirmed = confirm("Bạn có muốn lưu trước khi rời đi?");
    if (confirmed) {
      await saveNow();
    }
  }
  router.push('/dashboard');
};
```

### 3. Save Indicator UI
```typescript
function SaveIndicator() {
  const { state } = useCVEditor();
  
  if (state.isSaving) return "⏳ Đang lưu...";
  if (state.isDirty) return "✏️ Có thay đổi";
  if (state.saveStatus === "saved") return "✅ Đã lưu";
  if (state.saveStatus === "error") return "❌ Lỗi";
}
```

### 4. Manual Save Button
```typescript
function SaveButton() {
  const { state, saveNow } = useCVEditor();
  
  return (
    <button 
      onClick={saveNow}
      disabled={!state.isDirty || state.isSaving}
    >
      {state.isSaving ? "Đang lưu..." : "Lưu"}
    </button>
  );
}
```

---

## 🔧 System Behavior

### Auto-Save Triggers
```
User edits field
   ↓ (marks isDirty = true)
Debounce timer starts (2s)
   ↓ (if no new edits)
saveCV() called
   ↓ (sends to server)
isDirty = false (on success)
```

### beforeunload Warning
```
User tries to close tab/window
   ↓
Check: isDirty || isSaving ?
   ↓ YES
Browser shows warning dialog
   ↓ NO
Allow close normally
```

---

## ⚠️ Important Notes

### DO ✅
- Call `saveNow()` before exporting, printing, or sharing
- Check `state.isDirty` before navigating away
- Show save status to user for transparency
- Handle errors gracefully

### DON'T ❌
- Don't call `saveCV()` directly (it's for internal use)
- Don't override `isDirty` manually
- Don't bypass auto-save for routine edits
- Don't assume save is instant (always `await`)

---

## 🐛 Troubleshooting

### Issue: Auto-save not working
**Check:**
- Is `isDirty` being set to `true`? (React DevTools)
- Are you editing via `updateSection()`?
- Check console for errors

### Issue: Multiple saves firing
**Check:**
- Are you calling `saveCV()` directly? Use `saveNow()` instead
- Check if multiple components are triggering saves

### Issue: beforeunload not showing
**Check:**
- Does `isDirty = true`?
- Is user actually closing the window? (not just clicking links)
- Check browser console for errors

---

## 📊 Performance Tips

1. **Batch Updates**: Group related field changes
2. **Use saveNow() Sparingly**: Only for critical actions
3. **Trust Auto-Save**: Don't add extra save buttons unless necessary
4. **Monitor Network**: Check DevTools for duplicate requests

---

## 🎓 Best Practices

### ✅ Good Example
```typescript
// Batch edits together
const handleFormSubmit = (formData) => {
  updateSection('personal_info', formData);
  // Auto-save will trigger once after 2s
};

// Save before critical action
const handleExport = async () => {
  await saveNow();
  exportPDF();
};
```

### ❌ Bad Example
```typescript
// DON'T: Manual save after every field
const handleFieldChange = async (value) => {
  updateSection('personal_info', { field: value });
  await saveCV(); // ❌ Wrong! Let auto-save handle it
};

// DON'T: Bypass the system
const handleHack = () => {
  fetch('/api/cv/save', { /* manual API call */ }); // ❌ Bad!
};
```

---

## 📞 Support

- **Documentation**: `docs/AUTO_SAVE_IMPROVEMENTS.md`
- **Examples**: `docs/AUTO_SAVE_EXAMPLES.tsx`
- **Summary**: `docs/AUTO_SAVE_SUMMARY.md`

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-10  
**Status**: ✅ Production Ready
