/* page-config.jsx — Configuración */

const S = window.FinanzasStore;

// ─── helpers de estilo ───────────────────────────────────────────────────────
const panel = {
  background: "var(--panel)", border: "1px solid var(--border)",
  borderRadius: 12, padding: "22px 24px", marginBottom: 20,
};
const sectionTitle = {
  fontSize: 13, fontWeight: 600, letterSpacing: ".04em",
  textTransform: "uppercase", color: "#666", marginBottom: 16,
};
const pill = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-strong)",
  borderRadius: 8, padding: "6px 10px 6px 13px", fontSize: 13.5,
};
const iBtn = (danger) => ({
  background: "transparent", border: "none", cursor: "pointer",
  width: 26, height: 26, borderRadius: 6, display: "flex",
  alignItems: "center", justifyContent: "center",
  color: danger ? "#ef4444" : "#777", transition: "all .15s",
  flexShrink: 0,
});
const inputStyle = {
  background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-strong)",
  borderRadius: 8, padding: "7px 11px", fontSize: 13.5, color: "#eaeaea",
  fontFamily: "var(--font)", outline: "none", width: "100%",
};
const addBtn = {
  background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)",
  color: "#10b981", borderRadius: 8, padding: "8px 16px",
  fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)",
  whiteSpace: "nowrap", transition: "all .15s",
};

// ─── Icono inline ────────────────────────────────────────────────────────────
function Ico({ d, size = 14, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round"
      strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}
const PENCIL = "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z";
const TRASH  = "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6";
const CHECK  = "M20 6L9 17l-5-5";
const X_ICO  = "M18 6L6 18M6 6l12 12";
const GRIP   = "M9 5h2M9 12h2M9 19h2M13 5h2M13 12h2M13 19h2";
const PLUS   = "M12 5v14M5 12h14";

// ─── Chip de categoría editable ───────────────────────────────────────────────
function CatChip({ nombre, onRename, onDelete }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(nombre);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (editing) { setVal(nombre); inputRef.current?.focus(); inputRef.current?.select(); }
  }, [editing]);

  function confirm() {
    if (val.trim() && val.trim() !== nombre) {
      if (!onRename(nombre, val.trim())) { setVal(nombre); }
    }
    setEditing(false);
  }

  return (
    <div style={{ ...pill, gap: 0, padding: "4px 4px 4px 13px", marginBottom: 6, marginRight: 6 }}>
      {editing ? (
        <input ref={inputRef} value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") { setVal(nombre); setEditing(false); } }}
          onBlur={confirm}
          style={{ ...inputStyle, width: 140, padding: "3px 7px", fontSize: 13, height: 24 }} />
      ) : (
        <span style={{ userSelect: "none" }}>{nombre}</span>
      )}
      <button style={iBtn(false)} title="Renombrar"
        onClick={() => setEditing((e) => !e)}
        onMouseEnter={(e) => e.currentTarget.style.color = "#ccc"}
        onMouseLeave={(e) => e.currentTarget.style.color = "#777"}>
        {editing ? <Ico d={CHECK} size={13} /> : <Ico d={PENCIL} size={12} />}
      </button>
      <button style={iBtn(true)} title="Eliminar"
        onClick={() => onDelete(nombre)}
        onMouseEnter={(e) => e.currentTarget.style.color = "#f87171"}
        onMouseLeave={(e) => e.currentTarget.style.color = "#ef4444"}>
        <Ico d={TRASH} size={12} />
      </button>
    </div>
  );
}

// ─── Sección de Categorías ────────────────────────────────────────────────────
function SeccionCategorias() {
  const toast = useToast();
  const [cats, setCats] = React.useState(() => S.getCategorias());
  const [nueva, setNueva] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => S.subscribe(() => setCats(S.getCategorias())), []);

  function handleAdd() {
    const n = nueva.trim();
    if (!n) return;
    if (S.addCategoria(n)) {
      toast(`"${n}" agregada`, "ok");
      setNueva("");
      inputRef.current?.focus();
    } else {
      toast("Esa categoría ya existe", "error");
    }
  }

  function handleRename(antigua, nueva) {
    if (S.renameCategoria(antigua, nueva)) {
      toast(`Renombrada a "${nueva}"`, "ok");
      return true;
    }
    toast("No se pudo renombrar (¿ya existe?)", "error");
    return false;
  }

  function handleDelete(nombre) {
    const enUso = S.getTransacciones().some((t) => t.categoria === nombre)
               || S.getPresupuestos().some((p) => p.categoria === nombre);
    if (enUso) {
      toast(`"${nombre}" está en uso — edítala en lugar de eliminarla`, "info");
      return;
    }
    S.deleteCategoria(nombre);
    toast(`"${nombre}" eliminada`, "ok");
  }

  return (
    <div style={panel}>
      <div style={sectionTitle}>Categorías de transacciones</div>
      <p style={{ fontSize: 12.5, color: "#666", margin: "0 0 18px" }}>
        Estas categorías aparecen en el formulario de transacciones y presupuestos.
        Haz clic en el lápiz para renombrar, en el basurero para eliminar.
        No se puede eliminar una categoría que ya tiene transacciones o presupuestos vinculados.
      </p>

      {/* chips existentes */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 0, marginBottom: 20 }}>
        {cats.map((c) => (
          <CatChip key={c} nombre={c}
            onRename={handleRename}
            onDelete={handleDelete} />
        ))}
        {cats.length === 0 && (
          <span style={{ color: "#555", fontSize: 13 }}>Sin categorías — agrega una abajo.</span>
        )}
      </div>

      {/* agregar nueva */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", maxWidth: 420 }}>
        <input ref={inputRef} value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          placeholder="Nueva categoría…"
          style={{ ...inputStyle, flex: 1 }} />
        <button style={addBtn} onClick={handleAdd}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(16,185,129,0.25)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(16,185,129,0.15)"}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Ico d={PLUS} size={13} /> Agregar
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Sección de datos ─────────────────────────────────────────────────────────
function SeccionDatos() {
  const toast = useToast();
  const [confirm, setConfirm] = React.useState(false);

  function handleReset() {
    if (!confirm) { setConfirm(true); return; }
    S.reset();
    setConfirm(false);
    toast("Todos los datos fueron eliminados", "info");
  }

  return (
    <div style={panel}>
      <div style={sectionTitle}>Datos</div>
      <p style={{ fontSize: 12.5, color: "#666", margin: "0 0 18px" }}>
        Elimina todos los registros (transacciones, presupuestos, deudas, metas, cuentas).
        Las categorías configuradas se conservan.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={handleReset}
          style={{
            background: confirm ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${confirm ? "rgba(239,68,68,0.45)" : "var(--border-strong)"}`,
            color: confirm ? "#f87171" : "#aaa",
            borderRadius: 8, padding: "8px 18px", fontSize: 13,
            fontFamily: "var(--font)", cursor: "pointer", fontWeight: 500, transition: "all .2s",
          }}>
          {confirm ? "¿Confirmar? Haz clic de nuevo" : "Borrar todos los datos"}
        </button>
        {confirm && (
          <button onClick={() => setConfirm(false)}
            style={{ background: "transparent", border: "none", color: "#666", fontSize: 12.5, cursor: "pointer", fontFamily: "var(--font)" }}>
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
function Config() {
  return (
    <div className="page-fade">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-.02em" }}>Configuración</h1>
        <p style={{ color: "#666", fontSize: 14, margin: 0 }}>Personaliza categorías y administra tus datos.</p>
      </div>

      <SeccionCategorias />
      <SeccionDatos />
    </div>
  );
}
