/* page-suscripciones.jsx */

const FRECUENCIAS = ["mensual", "quincenal", "semanal", "anual"];
const FREC_LABEL  = { mensual: "Mensual", quincenal: "Quincenal", semanal: "Semanal", anual: "Anual" };
const FREC_COLOR  = { mensual: "#3b82f6", quincenal: "#8b5cf6", semanal: "#f59e0b", anual: "#10b981" };

function costoMensual(sus) {
  if (sus.frecuencia === "mensual")   return sus.monto;
  if (sus.frecuencia === "quincenal") return sus.monto * 2;
  if (sus.frecuencia === "semanal")   return sus.monto * 52 / 12;
  if (sus.frecuencia === "anual")     return sus.monto / 12;
  return sus.monto;
}

function proximoCobro(sus) {
  const hoy = new Date(); hoy.setHours(23, 59, 59, 999);
  let d = new Date(sus.fecha_inicio + "T12:00:00");
  if (isNaN(d)) return null;
  while (d <= hoy) {
    if      (sus.frecuencia === "mensual")   d.setMonth(d.getMonth() + 1);
    else if (sus.frecuencia === "anual")     d.setFullYear(d.getFullYear() + 1);
    else if (sus.frecuencia === "semanal")   d.setDate(d.getDate() + 7);
    else if (sus.frecuencia === "quincenal") d.setDate(d.getDate() + 15);
    else break;
  }
  return d > hoy ? d : null;
}

// ─── Formulario ───────────────────────────────────────────────────────────────
function SuscripcionForm({ initial, onClose }) {
  const S = window.FinanzasStore;
  const toast = useToast();
  const [f, setF] = React.useState(initial || {
    nombre: "", categoria: "Suscripciones", subcategoria: "Entretenimiento",
    monto: "", frecuencia: "mensual", fecha_inicio: todayISO(), cuenta: "", notas: "",
  });
  const [err, setErr] = React.useState({});
  const set = k => v => setF(s => ({ ...s, [k]: v }));
  const subs = S.getSubcategorias(f.categoria);
  const cuentas = S.getCuentas();

  const submit = () => {
    const e = {};
    if (!f.nombre.trim())    e.nombre = "Requerido";
    if (!(+f.monto > 0))     e.monto  = "Debe ser mayor a 0";
    if (!f.fecha_inicio)     e.fecha_inicio = "Requerido";
    setErr(e); if (Object.keys(e).length) return;
    const payload = { ...f, monto: +f.monto, cuenta: f.cuenta ? +f.cuenta : null };
    if (initial && initial.id) { S.updateSuscripcion(initial.id, payload); toast("Suscripción actualizada"); }
    else { S.addSuscripcion(payload); toast("Suscripción creada"); }
    onClose();
  };

  return (
    <>
      <Field label="Nombre" error={err.nombre}><TextInput value={f.nombre} onChange={set("nombre")} placeholder="Ej. Netflix, Spotify…" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: subs.length ? "1fr 1fr" : "1fr", gap: 12 }}>
        <Field label="Categoría">
          <Select value={f.categoria} onChange={v => { set("categoria")(v); set("subcategoria")(""); }} options={S.getCategorias()} />
        </Field>
        {subs.length > 0 && (
          <Field label="Subcategoría">
            <Select value={f.subcategoria} onChange={set("subcategoria")} placeholder="— General —" options={subs} />
          </Field>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Monto (MXN)" error={err.monto}><TextInput type="number" mono value={f.monto} onChange={set("monto")} placeholder="0.00" /></Field>
        <Field label="Frecuencia">
          <Select value={f.frecuencia} onChange={set("frecuencia")} options={FRECUENCIAS.map(v => ({ value: v, label: FREC_LABEL[v] }))} />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Primer cobro" error={err.fecha_inicio} hint="Fecha del 1er cargo — los siguientes se calculan automáticamente">
          <TextInput type="date" value={f.fecha_inicio} onChange={set("fecha_inicio")} />
        </Field>
        <Field label="Cuenta (cargo)">
          <Select value={f.cuenta} onChange={set("cuenta")} placeholder="— Selecciona —" options={cuentas.map(c => ({ value: c.id, label: `${c.nombre} · ${c.tipo}` }))} />
        </Field>
      </div>
      <Field label="Notas"><Textarea value={f.notas} onChange={set("notas")} placeholder="Opcional" /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" icon="check" onClick={submit}>{initial && initial.id ? "Guardar" : "Crear suscripción"}</Button>
      </div>
    </>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function SuscripcionCard({ s, cuentasMap, onEdit, onDelete, onToggle }) {
  const prox  = proximoCobro(s);
  const dias  = prox ? Math.ceil((prox - new Date()) / 86400000) : null;
  const urgente = dias !== null && dias <= 7;
  const color = FREC_COLOR[s.frecuencia] || "#888";

  return (
    <Card hover style={{ opacity: s.activa ? 1 : 0.5, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>{s.nombre}</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
            {s.categoria}{s.subcategoria ? ` · ${s.subcategoria}` : ""}
          </div>
        </div>
        <Badge color={color}>{FREC_LABEL[s.frecuencia]}</Badge>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 600 }}>{fmtMoney(s.monto)}</div>
          <div style={{ fontSize: 11.5, color: "#555", marginTop: 2 }}>
            ≈ {fmtMoneyShort(costoMensual(s))} / mes
          </div>
        </div>
        {prox && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11.5, color: urgente ? "#f59e0b" : "#666" }}>Próximo cobro</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: urgente ? "#f59e0b" : "#888", marginTop: 2 }}>
              {fmtDate(prox.toISOString().slice(0, 10))}
              {urgente && <span style={{ marginLeft: 5, fontSize: 10.5, opacity: 0.8 }}>({dias}d)</span>}
            </div>
          </div>
        )}
      </div>

      {s.cuenta && cuentasMap[s.cuenta] && (
        <div style={{ fontSize: 12, color: "#555" }}>Cargo a: {cuentasMap[s.cuenta]}</div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 11 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#999" }}>
          <button onClick={onToggle} style={{ width: 38, height: 22, borderRadius: 12, border: "none", cursor: "pointer", padding: 2, flexShrink: 0,
            background: s.activa ? "#10b981" : "rgba(255,255,255,0.12)", transition: "background .2s",
            display: "flex", justifyContent: s.activa ? "flex-end" : "flex-start" }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.4)" }}></span>
          </button>
          {s.activa ? "Activa" : "Pausada"}
        </span>
        <div style={{ display: "flex", gap: 2 }}>
          <button className="ibtn" onClick={onEdit} title="Editar"><Icon name="edit" size={15} /></button>
          <button className="ibtn" onClick={onDelete} title="Eliminar"><Icon name="trash" size={15} /></button>
        </div>
      </div>
    </Card>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
function Suscripciones() {
  const S = useStore();
  const toast = useToast();
  const [drawer, setDrawer] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [del, setDel] = React.useState(null);

  const list      = S.getSuscripciones();
  const activas   = list.filter(s => s.activa !== false);
  const cuentasMap = Object.fromEntries(S.getCuentas().map(c => [c.id, c.nombre]));
  const totalMes  = activas.reduce((sum, s) => sum + costoMensual(s), 0);

  return (
    <div>
      <PageHeader title="Suscripciones" subtitle={`${activas.length} activa${activas.length !== 1 ? "s" : ""} de ${list.length}`}
        actions={<Button variant="primary" icon="plus" onClick={() => { setEditing(null); setDrawer(true); }}>Nueva suscripción</Button>} />

      {list.length === 0 ? (
        <Card><EmptyState icon="subscription" title="Sin suscripciones"
          hint="Agrega servicios recurrentes. El app los registrará como gasto automáticamente cada vez que se abra en la fecha de cobro."
          action={<Button variant="primary" icon="plus" onClick={() => { setEditing(null); setDrawer(true); }}>Nueva suscripción</Button>} /></Card>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 14, marginBottom: 16 }}>
            <Card pad={15}>
              <div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Gasto mensual</div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--mono)" }}>{fmtMoney(totalMes)}</div>
            </Card>
            <Card pad={15}>
              <div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Costo anual estimado</div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--mono)" }}>{fmtMoney(totalMes * 12)}</div>
            </Card>
            <Card pad={15}>
              <div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Suscripciones activas</div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--mono)" }}>{activas.length}</div>
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14 }}>
            {list.map(s => (
              <SuscripcionCard key={s.id} s={s} cuentasMap={cuentasMap}
                onEdit={() => { setEditing(s); setDrawer(true); }}
                onDelete={() => setDel(s)}
                onToggle={() => S.toggleSuscripcion(s.id)} />
            ))}
          </div>
        </>
      )}

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={editing ? "Editar suscripción" : "Nueva suscripción"}>
        {drawer && <SuscripcionForm initial={editing} onClose={() => setDrawer(false)} />}
      </Drawer>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)}
        onConfirm={() => { S.deleteSuscripcion(del.id); toast("Suscripción eliminada", "err"); setDel(null); }}
        title="Eliminar suscripción"
        message={del ? `¿Eliminar "${del.nombre}"? Sus transacciones automáticas también se borrarán.` : ""} />
    </div>
  );
}

Object.assign(window, { Suscripciones });
