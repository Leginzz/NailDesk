// ============================================================
// NailDesk — HTML Escape Utility (XSS prevention)
// ============================================================

export function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}
