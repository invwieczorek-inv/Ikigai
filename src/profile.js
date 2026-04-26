const STORAGE_KEY = "ikigai_profiles";
async function hashPin(pin) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
export function getProfiles() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
export async function createProfile(name, pin) {
  const profiles = getProfiles();
  if (profiles.find(p => p.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("Profil o tej nazwie juz istnieje");
  }
  const id = crypto.randomUUID?.() ?? Date.now().toString();
  const pinHash = await hashPin(pin);
  const profile = { id, name: name.trim(), pinHash, createdAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...profiles, profile]));
  return profile;
}
export async function verifyPin(profileId, pin) {
  const profile = getProfiles().find(p => p.id === profileId);
  return (await hashPin(pin)) === profile.pinHash;
}
export function deleteProfileMeta(profileId) {
  const profiles = getProfiles().filter(p => p.id !== profileId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}