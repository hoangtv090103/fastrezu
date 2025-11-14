/**
 * Example: How to apply i18n to an existing component
 * 
 * This file shows before/after comparison for common patterns
 */

// ============================================================================
// EXAMPLE 1: Simple Page Component
// ============================================================================

// ❌ BEFORE - Hardcoded text
export function DashboardBefore() {
  return (
    <div>
      <h1>Quản lý CV</h1>
      <p>Tạo và quản lý CV của bạn với sự hỗ trợ của AI</p>
      <button>Tạo CV mới</button>
    </div>
  );
}

// ✅ AFTER - With i18n
import { useTranslation } from "@/hooks/useTranslation";

export function DashboardAfter() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.subtitle')}</p>
      <button>{t('dashboard.createNew')}</button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Form with Placeholders
// ============================================================================

// ❌ BEFORE
export function PersonalInfoFormBefore() {
  return (
    <form>
      <div>
        <label>Họ và tên</label>
        <input type="text" placeholder="Nguyễn Văn A" />
      </div>
      <div>
        <label>Email</label>
        <input type="email" placeholder="example@email.com" />
      </div>
      <button type="submit">Lưu</button>
      <button type="button">Hủy</button>
    </form>
  );
}

// ✅ AFTER
export function PersonalInfoFormAfter() {
  const { t } = useTranslation();
  
  return (
    <form>
      <div>
        <label>{t('personalInfo.fullName')}</label>
        <input
          type="text"
          placeholder={t('personalInfo.placeholders.fullName')}
        />
      </div>
      <div>
        <label>{t('personalInfo.email')}</label>
        <input
          type="email"
          placeholder={t('personalInfo.placeholders.email')}
        />
      </div>
      <button type="submit">{t('common.save')}</button>
      <button type="button">{t('common.cancel')}</button>
    </form>
  );
}

// ============================================================================
// EXAMPLE 3: Conditional Rendering
// ============================================================================

// ❌ BEFORE
export function CVListBefore({ cvs }: { cvs: CV[] }) {
  return (
    <div>
      {cvs.length === 0 ? (
        <div>
          <h2>Chưa có CV nào</h2>
          <p>Bắt đầu tạo CV đầu tiên của bạn với sự hỗ trợ của AI.</p>
        </div>
      ) : (
        <div>
          <h2>CV của tôi</h2>
          {cvs.map(cv => (
            <CVCard key={cv.id} {...cv} />
          ))}
        </div>
      )}
    </div>
  );
}

// ✅ AFTER
export function CVListAfter({ cvs }: { cvs: CV[] }) {
  const { t } = useTranslation();
  
  return (
    <div>
      {cvs.length === 0 ? (
        <div>
          <h2>{t('dashboard.noCVTitle')}</h2>
          <p>{t('dashboard.noCVDesc')}</p>
        </div>
      ) : (
        <div>
          <h2>{t('dashboard.myCVs')}</h2>
          {cvs.map(cv => (
            <CVCard key={cv.id} {...cv} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: With Interpolation
// ============================================================================

// ❌ BEFORE
export function WizardProgressBefore({ current, total }: { current: number; total: number }) {
  return (
    <div>
      <p>Bước {current} / {total}</p>
      <p>Bạn đang ở bước {current}</p>
    </div>
  );
}

// ✅ AFTER
export function WizardProgressAfter({ current, total }: { current: number; total: number }) {
  const { t } = useTranslation();
  
  return (
    <div>
      <p>{t('wizard.stepProgress', { current, total })}</p>
      <p>{t('wizard.currentStep', { step: current })}</p>
    </div>
  );
}

// Corresponding keys in dictionaries:
// {
//   "wizard": {
//     "stepProgress": "Bước {{current}} / {{total}}",
//     "currentStep": "Bạn đang ở bước {{step}}"
//   }
// }

// ============================================================================
// EXAMPLE 5: Status Messages
// ============================================================================

// ❌ BEFORE
export function StatusMessageBefore({ status }: { status: 'loading' | 'success' | 'error' }) {
  const messages = {
    loading: 'Đang tải...',
    success: 'Thành công!',
    error: 'Có lỗi xảy ra'
  };
  
  return <p>{messages[status]}</p>;
}

// ✅ AFTER
export function StatusMessageAfter({ status }: { status: 'loading' | 'success' | 'error' }) {
  const { t } = useTranslation();
  
  const messageKey = {
    loading: 'common.loading',
    success: 'common.success',
    error: 'common.error'
  }[status];
  
  return <p>{t(messageKey)}</p>;
}

// ============================================================================
// EXAMPLE 6: Toast Messages
// ============================================================================

// ❌ BEFORE
import { toast } from "react-hot-toast";

export function saveCV() {
  try {
    // ... save logic ...
    toast.success('Lưu CV thành công!');
  } catch (error) {
    toast.error('Không thể lưu CV. Vui lòng thử lại.');
  }
}

// ✅ AFTER
import { toast } from "react-hot-toast";
import { getTranslation } from "@/hooks/useTranslation";

export function saveCVWithI18n() {
  const { t } = getTranslation('vi'); // or get from context
  
  try {
    // ... save logic ...
    toast.success(t('notifications.saved'));
  } catch (error) {
    toast.error(t('notifications.error'));
  }
}

// ============================================================================
// EXAMPLE 7: Array of Options
// ============================================================================

// ❌ BEFORE
export function SkillLevelSelectBefore() {
  const levels = [
    { value: 'beginner', label: 'Cơ bản' },
    { value: 'intermediate', label: 'Trung cấp' },
    { value: 'advanced', label: 'Nâng cao' },
    { value: 'expert', label: 'Chuyên gia' }
  ];
  
  return (
    <select>
      {levels.map(level => (
        <option key={level.value} value={level.value}>
          {level.label}
        </option>
      ))}
    </select>
  );
}

// ✅ AFTER
export function SkillLevelSelectAfter() {
  const { t } = useTranslation();
  
  const levels = [
    { value: 'beginner', label: t('skills.levels.beginner') },
    { value: 'intermediate', label: t('skills.levels.intermediate') },
    { value: 'advanced', label: t('skills.levels.advanced') },
    { value: 'expert', label: t('skills.levels.expert') }
  ];
  
  return (
    <select>
      {levels.map(level => (
        <option key={level.value} value={level.value}>
          {level.label}
        </option>
      ))}
    </select>
  );
}

// ============================================================================
// EXAMPLE 8: Navigation Menu
// ============================================================================

// ❌ BEFORE
export function NavMenuBefore() {
  const menuItems = [
    { href: '/dashboard', label: 'Bảng điều khiển' },
    { href: '/editor', label: 'Soạn thảo' },
    { href: '/check-cv', label: 'Kiểm tra CV' },
    { href: '/feedback', label: 'Phản hồi' }
  ];
  
  return (
    <nav>
      {menuItems.map(item => (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}

// ✅ AFTER
export function NavMenuAfter() {
  const { t } = useTranslation();
  
  const menuItems = [
    { href: '/dashboard', label: t('navigation.dashboard') },
    { href: '/editor', label: t('navigation.editor') },
    { href: '/check-cv', label: t('navigation.checkCV') },
    { href: '/feedback', label: t('navigation.feedback') }
  ];
  
  return (
    <nav>
      {menuItems.map(item => (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}

// ============================================================================
// EXAMPLE 9: Adding Language Switcher to Header
// ============================================================================

// ❌ BEFORE
export function HeaderBefore() {
  return (
    <header>
      <Logo />
      <nav>
        <NavMenu />
      </nav>
      <UserMenu />
    </header>
  );
}

// ✅ AFTER
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export function HeaderAfter() {
  return (
    <header>
      <Logo />
      <nav>
        <NavMenu />
      </nav>
      <LanguageSwitcher />
      <UserMenu />
    </header>
  );
}

// ============================================================================
// EXAMPLE 10: Programmatic Language Change
// ============================================================================

import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggleButton() {
  const { language, setLanguage } = useLanguage();
  
  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };
  
  return (
    <button onClick={toggleLanguage}>
      {language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
    </button>
  );
}

// ============================================================================
// CHECKLIST for Each Component
// ============================================================================

/**
 * When adding i18n to a component:
 * 
 * 1. [ ] Import useTranslation hook
 * 2. [ ] Call hook: const { t } = useTranslation()
 * 3. [ ] Replace all hardcoded text with t() calls
 * 4. [ ] Add translation keys to vi.json
 * 5. [ ] Add translation keys to en.json
 * 6. [ ] Test with language switcher
 * 7. [ ] Check console for missing key warnings
 * 8. [ ] Commit changes
 */

// ============================================================================
// Common Patterns Reference
// ============================================================================

/**
 * Pattern 1: Simple text
 * <p>Xin chào</p> → <p>{t('greeting')}</p>
 * 
 * Pattern 2: With variables
 * <p>Xin chào, {name}</p> → <p>{t('greeting', { name })}</p>
 * 
 * Pattern 3: Placeholders
 * <input placeholder="Nhập tên" /> → <input placeholder={t('enterName')} />
 * 
 * Pattern 4: Conditional
 * {loading ? 'Đang tải...' : 'Hoàn thành'} → {loading ? t('loading') : t('completed')}
 * 
 * Pattern 5: Arrays
 * const items = ['A', 'B'] → const items = [t('itemA'), t('itemB')]
 */
