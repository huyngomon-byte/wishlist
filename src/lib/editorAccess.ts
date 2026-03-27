export const EDIT_KEY = "tranginyeuhuy";
export const STORAGE_KEY = "wishlist-editor-unlocked";

export const readEditorAccess = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export const persistEditorAccess = (enabled: boolean) => {
  try {
    if (enabled) {
      localStorage.setItem(STORAGE_KEY, "true");
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors and keep the UI usable.
  }
};
