/* page-metas.jsx */

const META_ICON = { "Ahorro": "piggy", "Inversión": "trend", "Compra": "cart", "Viaje": "plane", "Emergencia": "shield", "Otro": "goal" };

function MetaForm({ initial, onClose }) {
  const S = window.FinanzasStore;
  const toast = useToast();
  const [f, setF] = React.useState(initial || { nombre: "", tipo: "Ahorro", monto_objetivo: "", monto_actual: "", fecha_objetivo: "", descripcion: "" });
  const [err, setErr] = React.useState({});
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => {
    const e = {};
    if (!f.nombre.trim()) e.nombre = "Requerido";
    if (!(+f.monto_objetivo > 0)) e.monto_objetivo = "Debe ser mayor a 0";
    if (!f.fecha_objetivo) e.fecha_objetivo = "Requerida";
    setErr(e); if (Object.keys(e).length) return;
    if (initial && initial.id) { S.updateMeta(initial.id, f); toast("Meta actualizada"); }
    else { S.addMeta(f); toast("Meta creada"); }
    onClose();
  };
  return (
    <>
      <Field label="Nombre" error={err.nombre}><TextInput value={f.nombre} onChange={set("nombre")} placeholder="Ej. Viaje a Japón" /></Field>
      <Field label="Tipo"><Select value={f.tipo} onChange={set("tipo")} options={["Ahorro", "Inversión", "Compra", "Viaje", "Emergencia", "Otro"]} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Monto objetivo (MXN)" error={err.monto_objetivo}><TextInput type="number" mono value={f.monto_objetivo} onChange={set("monto_objetivo")} placeholder="0.00" /></Field>
        <Field label="Monto actual (MXN)"><TextInput type="number" mono value={f.monto_actual} onChange={set("monto_actual")} placeholder="0.00" /></Field>
      </div>
      <Field label="Fecha objetivo" error={err.fecha_objetivo}><TextInput type="date" value={f.fecha_objetivo} onChange={set("fecha_objetivo")} /></Field>
      <Field label="Descripción"><Textarea value={f.descripcion} onChange={set("descripcion")} placeholder="Opcional" /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" icon="check" onClick={submit}>{initial && initial.id ? "Guardar" : "Crear meta"}</Button>
      </div>
    </>
  );
}

function ActualizarMontoForm({ meta, onClose }) {
  const S = window.FinanzasStore;
  const toast = useToast();
  const [val, setVal] = React.useState(String(meta.monto_actual));
  const submit = () => {
    S.updateMeta(meta.id, { ...meta, monto_actual: +val });
    toast("Monto actualizado");
    onClose();
  };
  const nuevo = Math.min(100, meta.monto_objetivo > 0 ? (+val / meta.monto_objetivo) * 100 : 0);
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{meta.nombre}</div>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 18, fontFamily: "var(--mono)" }}>Objetivo: {fmtMoney(meta.monto_objetivo)}</div>
      <Field label="Monto actual (MXN)"><TextInput type="number" mono value={val} onChange={setVal} placeholder="0.00" /></Field>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#888", marginBottom: 6, fontFamily: "var(--mono)" }}><span>Avance</span><span>{nuevo.toFixed(0)}%</span></div>
        <ProgressBar pct={nuevo} color="#10b981" />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" icon="check" onClick={submit}>Actualizar</Button>
      </div>
    </>
  );
}

function MetaCard({ m, onUpdate, onEdit, onDelete }) {
  const color = STATE_COLOR[m.estado];
  const dias = diasRestantes(m.fecha_objetivo);
  return (
    <Card hover style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: color + "1a", color }}><Icon name={META_ICON[m.tipo] || "goal"} size={19} /></span>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>{m.nombre}</div>
            <div style={{ fontSize: 11.5, color: "#888" }}>{m.tipo}</div>
          </div>
        </div>
        <Badge color={color}>{m.estado}</Badge>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <ProgressRing pct={m.porcentaje} color={color} size={88} stroke={8}>
          <div style={{ fontSize: 17, fontWeight: 600, fontFamily: "var(--mono)" }}>{m.porcentaje.toFixed(0)}<span style={{ fontSize: 11 }}>%</span></div>
        </ProgressRing>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div><div style={{ fontSize: 10.5, color: "#777" }}>Actual / Objetivo</div><div style={{ fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 600 }}>{fmtMoneyShort(m.monto_actual)} <span style={{ color: "#666" }}>/ {fmtMoneyShort(m.monto_objetivo)}</span></div></div>
          <div><div style={{ fontSize: 10.5, color: "#777" }}>Faltante</div><div style={{ fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 600, color: "#f59e0b" }}>{fmtMoney(m.faltante)}</div></div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#888", borderTop: "1px solid var(--border)", paddingTop: 11 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="clock" size={13} />{fmtDate(m.fecha_objetivo)}</span>
        <span style={{ color: dias < 0 ? "#ef4444" : dias < 90 ? "#f59e0b" : "#888", fontFamily: "var(--mono)" }}>{dias < 0 ? `${Math.abs(dias)}d vencida` : `${dias}d restantes`}</span>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <Button size="sm" variant="default" icon="trend" onClick={onUpdate} style={{ flex: 1 }}>Actualizar monto</Button>
        <Button size="sm" variant="ghost" icon="edit" onClick={onEdit} />
        <Button size="sm" variant="ghost" icon="trash" onClick={onDelete} style={{ color: "#ef4444" }} />
      </div>
    </Card>
  );
}

function Metas() {
  const S = useStore();
  const toast = useToast();
  const [drawer, setDrawer] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [upd, setUpd] = React.useState(null);
  const [del, setDel] = React.useState(null);
  const list = S.getMetas();

  return (
    <div>
      <PageHeader title="Metas" subtitle={`${list.length} meta(s) · ${list.filter((m) => m.estado === "Completada").length} completada(s)`}
        actions={<Button variant="primary" icon="plus" onClick={() => { setEditing(null); setDrawer(true); }}>Nueva meta</Button>} />

      {list.length === 0 ? (
        <Card><EmptyState icon="goal" title="Sin metas" hint="Define metas de ahorro, viajes o compras y visualiza tu progreso."
          action={<Button variant="primary" icon="plus" onClick={() => { setEditing(null); setDrawer(true); }}>Nueva meta</Button>} /></Card>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 14, marginBottom: 16 }}>
            {list.map((m) => <MetaCard key={m.id} m={m} onUpdate={() => setUpd(m)} onEdit={() => { setEditing(m); setDrawer(true); }} onDelete={() => setDel(m)} />)}
          </div>
          <ChartCard title="Comparativo de metas" subtitle="Progreso hacia cada objetivo">
            <MetaBars data={list} color="#10b981" />
          </ChartCard>
        </>
      )}

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={editing ? "Editar meta" : "Nueva meta"}>
        {drawer && <MetaForm initial={editing} onClose={() => setDrawer(false)} />}
      </Drawer>
      <Drawer open={!!upd} onClose={() => setUpd(null)} title="Actualizar monto" width={400}>
        {upd && <ActualizarMontoForm meta={upd} onClose={() => setUpd(null)} />}
      </Drawer>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={() => { S.deleteMeta(del.id); toast("Meta eliminada", "err"); }}
        title="Eliminar meta" message={del ? `¿Eliminar la meta "${del.nombre}"?` : ""} />
    </div>
  );
}

Object.assign(window, { Metas });
