const selectedTenantCircleKey = "dou-admin:selected-tenant-circle-id";

export function getSelectedTenantCircleId() {
  return localStorage.getItem(selectedTenantCircleKey) || "";
}

export function setSelectedTenantCircleId(circleId: string) {
  const value = String(circleId || "").trim();
  if (value) {
    localStorage.setItem(selectedTenantCircleKey, value);
  } else {
    localStorage.removeItem(selectedTenantCircleKey);
  }
}

export function clearSelectedTenantCircleId() {
  localStorage.removeItem(selectedTenantCircleKey);
}
