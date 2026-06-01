/* util.jsx — formatters + small shared helpers (exported to window) */

const fmtMoney = (n, opts = {}) => {
  const v = Number(n) || 0;
  const s = Math.abs(v).toLocaleString("es-MX", { minimumFractionDigits: opts.dec ?? 2, maximumFractionDigits: opts.dec ?? 2 });
  return `${v < 0 ? "−" : ""}$${s}${opts.mxn ? " MXN" : ""}`;
};
const fmtMoneyShort = (n) => {
  const v = Number(n) || 0; const a = Math.abs(v);
  let out;
  if (a >= 1000000) out = (a / 1000000).toFixed(a >= 10000000 ? 0 : 1) + "M";
  else if (a >= 1000) out = (a / 1000).toFixed(a >= 100000 ? 0 : 1) + "k";
  else out = a.toFixed(0);
  return `${v < 0 ? "−" : ""}$${out}`;
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const fmtDateLong = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${d} ${meses[m - 1]} ${y}`;
};
const diasRestantes = (iso) => Math.round((new Date(iso + "T00:00:00") - window.FinanzasStore.HOY) / 86400000);
const todayISO = () => {
  const h = window.FinanzasStore.HOY;
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
};

// paleta categórica (se sobreescribe parcialmente con tweaks de color)
const CAT_COLORS = {
  "Alimentación": "#10b981", "Transporte": "#3b82f6", "Entretenimiento": "#a855f7",
  "Salud": "#ec4899", "Ropa": "#f59e0b", "Educación": "#06b6d4", "Servicios": "#8b5cf6",
  "Vivienda": "#ef4444", "Ahorro": "#22c55e", "Sueldo": "#10b981", "Freelance": "#14b8a6", "Otros": "#64748b",
};
const STATE_COLOR = {
  "OK": "#10b981", "Precaución": "#f59e0b", "Límite": "#f97316", "Excedido": "#ef4444",
  "Pendiente": "#64748b", "Avanzando": "#3b82f6", "Mitad": "#06b6d4", "Casi lista": "#22c55e", "Liquidada": "#10b981",
  "Iniciando": "#64748b", "En camino": "#3b82f6", "A mitad": "#06b6d4", "Completada": "#10b981",
};

// hook: re-render on store changes
function useStore() {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => window.FinanzasStore.subscribe(force), []);
  return window.FinanzasStore;
}

// hook: animate 0->1 on mount (rAF for smoothness + setTimeout fallback so
// content always reveals even when the document is hidden / rAF is paused)
function useMountAnim(deps = []) {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    setOn(false);
    let r1, r2;
    r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setOn(true)); });
    const t = setTimeout(() => setOn(true), 90);
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); clearTimeout(t); };
  }, deps);
  return on;
}

Object.assign(window, {
  fmtMoney, fmtMoneyShort, fmtDate, fmtDateLong, diasRestantes, todayISO,
  CAT_COLORS, STATE_COLOR, useStore, useMountAnim,
});
