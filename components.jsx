/* components.jsx — shared UI primitives (exported to window) */

/* ---------------- Icons (lucide-style, 24 grid) ---------------- */
const ICONS = {
  dashboard: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm9 0h6v-9h-6v9Zm0-16v5h6V4h-6Z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  budget: "M3 3v18h18M7 14l3-3 3 3 4-5",
  debt: "M3 5h18v14H3zM3 10h18",
  goal: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0",
  wallet: "M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12M17 13h.01",
  plus: "M12 5v14M5 12h14",
  edit: "M11 4H4v16h16v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  x: "M18 6 6 18M6 6l12 12",
  search: "M11 11m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0M21 21l-4.3-4.3",
  alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  check: "M20 6 9 17l-5-5",
  up: "M12 19V5M5 12l7-7 7 7",
  down: "M12 5v14M19 12l-7 7-7-7",
  clock: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 7v5l3 2",
  menu: "M3 6h18M3 12h18M3 18h18",
  chevron: "M6 9l6 6 6-6",
  refresh: "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5",
  plane: "M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8l3.2 4-2 2-1.8-.3a.5.5 0 0 0-.5.8L6 17l1.5 2.7a.5.5 0 0 0 .8-.1l-.3-1.8 2-2 4 3.2a.5.5 0 0 0 .8-.5Z",
  cart: "M6 6h15l-1.5 9h-12zM6 6 5 3H2M9 20a1 1 0 1 0 2 0a1 1 0 1 0-2 0M17 20a1 1 0 1 0 2 0a1 1 0 1 0-2 0",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z",
  trend: "M3 17l6-6 4 4 8-8M21 7v5h-5",
  piggy: "M19 9V7a2 2 0 0 0-2-2h-1.5C14 3.5 12 3 10 3 6 3 3 5.5 3 9c0 2 1 3.5 2 4.5V18h3v-2h4v2h3v-3c1-.5 2-1.5 2-3h2V9h-2ZM9 9h.01",
};
function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.8, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}
         strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={ICONS[name] || ""} />
    </svg>
  );
}

/* ---------------- Card ---------------- */
function Card({ children, style, pad = 18, hover, onClick, className }) {
  const [h, setH] = React.useState(false);
  return (
    <div className={className} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: pad,
        transition: "border-color .2s, transform .2s", cursor: onClick ? "pointer" : "default",
        borderColor: hover && h ? "var(--border-strong)" : "var(--border)", ...style }}>
      {children}
    </div>
  );
}

/* ---------------- Badge ---------------- */
function Badge({ children, color = "#888", solid }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, lineHeight: 1,
      padding: "4px 8px", borderRadius: 6, whiteSpace: "nowrap",
      color: solid ? "#0a0a0a" : color, background: solid ? color : color + "1f", border: `1px solid ${color}33` }}>
      {children}
    </span>
  );
}

/* ---------------- Progress bar ---------------- */
function ProgressBar({ pct, color = "#10b981", height = 8, bg = "rgba(255,255,255,0.06)" }) {
  return (
    <div style={{ height, borderRadius: height, background: bg, overflow: "hidden" }}>
      <div className="barh-grow" style={{ height: "100%", borderRadius: height, width: Math.min(100, pct) + "%",
        background: `linear-gradient(90deg, ${color}99, ${color})` }}></div>
    </div>
  );
}

/* ---------------- Button ---------------- */
function Button({ children, onClick, variant = "default", size = "md", icon, style, type = "button", disabled }) {
  const [h, setH] = React.useState(false);
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, fontWeight: 550,
    borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", transition: "all .15s", whiteSpace: "nowrap",
    fontSize: size === "sm" ? 12.5 : 13.5, padding: size === "sm" ? "6px 11px" : "9px 15px", border: "1px solid transparent",
    opacity: disabled ? 0.5 : 1, fontFamily: "inherit" };
  const variants = {
    primary: { background: h ? "#fff" : "#ededed", color: "#0a0a0a" },
    default: { background: h ? "#1d1d1d" : "var(--panel)", color: "#eaeaea", borderColor: "var(--border-strong)" },
    ghost: { background: h ? "rgba(255,255,255,0.06)" : "transparent", color: "#bbb" },
    danger: { background: h ? "#ef444422" : "transparent", color: "#ef4444", borderColor: "#ef444433" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ ...base, ...variants[variant], ...style }}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}{children}
    </button>
  );
}

/* ---------------- Drawer (panel lateral para formularios) ---------------- */
function Drawer({ open, onClose, title, children, footer, width = 460 }) {
  React.useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, pointerEvents: open ? "auto" : "none" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)",
        opacity: open ? 1 : 0, transition: "opacity .3s", backdropFilter: "blur(2px)" }}></div>
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(" + width + "px, 100vw)",
        background: "var(--panel-2)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform .32s cubic-bezier(.3,.7,.2,1)", boxShadow: "-20px 0 60px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: 4, display: "flex" }}><Icon name="x" size={20} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>{children}</div>
        {footer && <div style={{ padding: "16px 22px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Form fields ---------------- */
const inputStyle = { width: "100%", background: "var(--panel)", border: "1px solid var(--border-strong)", borderRadius: 8,
  padding: "9px 11px", color: "#eee", fontSize: 13.5, fontFamily: "inherit", outline: "none", transition: "border-color .15s" };

function Field({ label, children, error, hint }) {
  return (
    <label style={{ display: "block", marginBottom: 15 }}>
      <span style={{ display: "block", fontSize: 12, color: "#999", marginBottom: 6, fontWeight: 500 }}>{label}</span>
      {children}
      {error && <span style={{ display: "block", fontSize: 11, color: "#ef4444", marginTop: 4 }}>{error}</span>}
      {hint && !error && <span style={{ display: "block", fontSize: 11, color: "#666", marginTop: 4 }}>{hint}</span>}
    </label>
  );
}
function TextInput({ value, onChange, type = "text", placeholder, mono, ...rest }) {
  const [f, setF] = React.useState(false);
  return <input type={type} value={value ?? ""} placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)} onFocus={() => setF(true)} onBlur={() => setF(false)}
    style={{ ...inputStyle, borderColor: f ? "#3b82f6" : "var(--border-strong)", fontFamily: mono ? "var(--mono)" : "inherit" }} {...rest} />;
}
function Select({ value, onChange, options, placeholder }) {
  const [f, setF] = React.useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{ ...inputStyle, borderColor: f ? "#3b82f6" : "var(--border-strong)", appearance: "none", cursor: "pointer", paddingRight: 32 }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => { const v = typeof o === "object" ? o.value : o, l = typeof o === "object" ? o.label : o;
          return <option key={v} value={v}>{l}</option>; })}
      </select>
      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#777" }}><Icon name="chevron" size={16} /></span>
    </div>
  );
}
function Textarea({ value, onChange, placeholder, rows = 3 }) {
  const [f, setF] = React.useState(false);
  return <textarea value={value ?? ""} placeholder={placeholder} rows={rows} onChange={(e) => onChange(e.target.value)}
    onFocus={() => setF(true)} onBlur={() => setF(false)}
    style={{ ...inputStyle, resize: "vertical", borderColor: f ? "#3b82f6" : "var(--border-strong)" }} />;
}

/* ---------------- Empty state ---------------- */
function EmptyState({ icon = "list", title, hint, action }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "54px 24px", textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--panel)", border: "1px solid var(--border)", color: "#666", marginBottom: 16 }}>
        <Icon name={icon} size={24} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#ccc", marginBottom: 5 }}>{title}</div>
      {hint && <div style={{ fontSize: 13, color: "#777", maxWidth: 320, marginBottom: 16 }}>{hint}</div>}
      {action}
    </div>
  );
}

/* ---------------- Toast system ---------------- */
const ToastCtx = React.createContext(() => {});
function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const push = React.useCallback((msg, kind = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 200, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        {toasts.map((t) => {
          const c = t.kind === "ok" ? "#10b981" : t.kind === "err" ? "#ef4444" : "#3b82f6";
          return (
            <div key={t.id} className="toast-in" style={{ display: "flex", alignItems: "center", gap: 9, background: "#191919",
              border: "1px solid var(--border-strong)", borderLeft: `3px solid ${c}`, borderRadius: 9, padding: "11px 16px",
              fontSize: 13, color: "#eee", boxShadow: "0 10px 40px rgba(0,0,0,.6)", minWidth: 220 }}>
              <Icon name={t.kind === "err" ? "alert" : "check"} size={16} color={c} />{t.msg}
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => React.useContext(ToastCtx);

/* ---------------- Confirm dialog ---------------- */
function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(2px)" }}></div>
      <div className="toast-in" style={{ position: "relative", background: "var(--panel-2)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: 24, width: "min(380px, 92vw)", boxShadow: "0 24px 70px rgba(0,0,0,.6)" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{title}</h3>
        <p style={{ margin: "0 0 20px", fontSize: 13.5, color: "#999", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" icon="trash" onClick={() => { onConfirm(); onClose(); }}>Eliminar</Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Section header ---------------- */
function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>{title}</h1>
        {subtitle && <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "#888" }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
}

Object.assign(window, {
  Icon, Card, Badge, ProgressBar, Button, Drawer, Field, TextInput, Select, Textarea,
  EmptyState, ToastProvider, useToast, ConfirmDialog, PageHeader, inputStyle,
});
