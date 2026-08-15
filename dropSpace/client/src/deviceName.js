// Generates a friendly, stable-per-browser device name like "Cyan Laptop"
// or "Violet Phone", so people can tell devices apart in the pairing UI
// without needing accounts or logins.

const ADJECTIVES = ["Cyan", "Violet", "Magenta", "Amber", "Neon", "Electric", "Cosmic", "Rapid"];

function detectDeviceType() {
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "Phone";
  return "Laptop";
}

export function getDeviceName() {
  const STORAGE_KEY = "dropspace:deviceName";
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const name = `${adjective} ${detectDeviceType()}`;
  localStorage.setItem(STORAGE_KEY, name);
  return name;
}