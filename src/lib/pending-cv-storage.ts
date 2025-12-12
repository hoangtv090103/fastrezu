/**
 * Pending CV Storage Utility
 * 
 * Stores uploaded CV files in localStorage temporarily
 * so they can be retrieved after login redirect.
 */

const STORAGE_KEY = "fastrezu_pending_cv";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for localStorage

export interface PendingCV {
  name: string;
  type: string;
  size: number;
  data: string; // base64
  uploadedAt: number;
}

/**
 * Check if localStorage is available (SSR safety)
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate PendingCV data structure
 */
function isValidPendingCV(data: unknown): data is PendingCV {
  if (!data || typeof data !== "object") return false;
  const cv = data as Record<string, unknown>;
  return (
    typeof cv.name === "string" &&
    typeof cv.type === "string" &&
    typeof cv.size === "number" &&
    typeof cv.data === "string" &&
    typeof cv.uploadedAt === "number"
  );
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 string back to File
 */
export function base64ToFile(pendingCV: PendingCV): File {
  // Extract base64 data from data URL
  const base64Data = pendingCV.data.split(",")[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: pendingCV.type });
  
  return new File([blob], pendingCV.name, { type: pendingCV.type });
}

/**
 * Store a file for later upload after login
 */
export async function storeFileForUpload(file: File): Promise<boolean> {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage is not available");
    return false;
  }

  try {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      console.warn("File too large for localStorage storage:", file.size);
      return false;
    }

    const base64Data = await fileToBase64(file);
    
    const pendingCV: PendingCV = {
      name: file.name,
      type: file.type,
      size: file.size,
      data: base64Data,
      uploadedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingCV));
    return true;
  } catch (error) {
    console.error("Failed to store file:", error);
    return false;
  }
}

/**
 * Get the pending CV from storage
 */
export function getPendingCV(): PendingCV | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);
    
    // Validate data structure
    if (!isValidPendingCV(parsed)) {
      console.warn("Invalid pending CV data structure");
      clearPendingCV();
      return null;
    }

    const pendingCV = parsed;
    
    // Check if the stored file is not too old (max 1 hour)
    const maxAge = 60 * 60 * 1000; // 1 hour
    if (Date.now() - pendingCV.uploadedAt > maxAge) {
      clearPendingCV();
      return null;
    }

    return pendingCV;
  } catch (error) {
    console.error("Failed to get pending CV:", error);
    return null;
  }
}

/**
 * Check if there's a pending CV in storage
 */
export function hasPendingCV(): boolean {
  return getPendingCV() !== null;
}

/**
 * Clear the pending CV from storage
 */
export function clearPendingCV(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear pending CV:", error);
  }
}

/**
 * Get the pending CV as a File object (for direct use)
 */
export function getPendingCVAsFile(): File | null {
  const pendingCV = getPendingCV();
  if (!pendingCV) return null;
  
  try {
    return base64ToFile(pendingCV);
  } catch (error) {
    console.error("Failed to convert pending CV to File:", error);
    return null;
  }
}
