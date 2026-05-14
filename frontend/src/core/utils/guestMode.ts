const GUEST_MODE_KEY = "onepdf_guest_mode";

export function setGuestMode(): void {
  sessionStorage.setItem(GUEST_MODE_KEY, "true");
}

export function clearGuestMode(): void {
  sessionStorage.removeItem(GUEST_MODE_KEY);
}

export function isGuestMode(): boolean {
  return sessionStorage.getItem(GUEST_MODE_KEY) === "true";
}
