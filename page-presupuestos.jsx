/* page-presupuestos.jsx */

function PresupuestoForm({ initial, mes, anio, onClose }) {
  const S = window.FinanzasStore;
  const toast = useToast();
  const [f, setF] = React.useState(initial || { nombre: "", tipo: "Variable", categoria: "Alimentación", subcategoria: "", mes, anio, presupuesto: "", notas: "" });
  const [err, setErr] = React.useState({});
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const subs = S.getSubcategorias(f.categoria);
  const submit = () => {
    const e = {};
    if (!f.nombre.trim()) e.nombre = "Requerido";
    if (!(+f.presupuesto > 0)) e.presupuesto = "Debe ser mayor a 0";
    setErr(e); if (Object.keys(e).length) return;
    if (initial && initial.id) { S.updatePresupuesto(initial.id, f); toast("Presupuesto actualizado"); }
    else { S.addPresupuesto(f); toast("Presupuesto creado"); }
    onClose();
  };
  return (
    <>
      <Field label="Nombre" error={err.nombre}><TextInput value={f.nombre} onChange={set("nombre")} placeholder="Ej. Comida del mes" /></Field>
      <div className="m-grid" style={{ display: "grid", gridTemplateColumns: subs.length ? "1fr 1fr" : "1fr", gap: 12 }}>
        <Field label="Categoría" hint={subs.length ? "" : "El gasto se calcula con las transacciones de esta categoría"}>
          <Select value={f.categoria} onChange={(v) => { set("categoria")(v); set("subcategoria")(""); }} options={S.getCategorias()} />
        </Field>
        {subs.length > 0 && <Field label="Subcategoría" hint="Opcional — deja vacío para incluir toda la categoría"><Select value={f.subcategoria} onChange={set("subcategoria")} placeholder="— Toda la categoría —" options={subs} /></Field>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Mes"><Select value={f.mes} onChange={(v) => set("mes")(+v)} options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: S.nombreMes[i + 1] }))} /></Field>
        <Field label="Año"><TextInput type="number" mono value={f.anio} onChange={(v) => set("anio")(+v)} /></Field>
      </div>
      <div className="m-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Monto límite (MXN)" error={err.presupuesto}><TextInput type="number" mono value={f.presupuesto} onChange={set("presupuesto")} placeholder="0.00" /></Field>
        <Field label="Tipo de gasto" hint="Fijo = obligación; Variable = gasto discrecional">
          <Select value={f.tipo} onChange={set("tipo")} options={[{ value: "Variable", label: "Variable" }, { value: "Fijo", label: "Fijo" }]} />
        </Field>
      </div>
      <Field label="Notas"><Textarea value={f.notas} onChange={set("notas")} placeholder="Opcional" /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" icon="check" onClick={submit}>{initial && initial.id ? "Guardar" : "Crear presupuesto"}</Button>
      </div>
    </>
  );
}

function PresupuestoCard({ p, onEdit, onDelete }) {
  const color = STATE_COLOR[p.estado];
  return (
    <Card hover style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.nombre}</div>
          <div style={{ fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: CAT_COLORS[p.categoria] }}></span>{p.categoria}
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {p.tipo && <Badge color={p.tipo === "Fijo" ? "#ef4444" : "#8b5cf6"}>{p.tipo}</Badge>}
          <Badge color={color}>{p.estado}</Badge>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 17, fontWeight: 600, color }}>{fmtMoney(p.gasto_actual)}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "#777" }}>/ {fmtMoney(p.presupuesto)}</span>
        </div>
        <ProgressBar pct={p.porcentaje} color={color} height={9} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 11.5 }}>
          <span style={{ color, fontWeight: 600, fontFamily: "var(--mono)" }}>{p.porcentaje.toFixed(0)}% usado</span>
          <span style={{ color: "#888", fontFamily: "var(--mono)" }}>{p.presupuesto - p.gasto_actual >= 0 ? `Resta ${fmtMoneyShort(p.presupuesto - p.gasto_actual)}` : `Excedido ${fmtMoneyShort(p.gasto_actual - p.presupuesto)}`}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, borderTop: "1px solid var(--border)", paddingTop: 11 }}>
        <Button size="sm" variant="ghost" icon="edit" onClick={onEdit}>Editar</Button>
        <Button size="sm" variant="ghost" icon="trash" onClick={onDelete} style={{ color: "#ef4444" }}>Eliminar</Button>
      </div>
    </Card>
  );
}

function Presupuestos() {
  const S = useStore();
  const toast = useToast();
  const [mes, setMes] = React.useState(S.MES_ACTUAL);
  const [anio, setAnio] = React.useState(S.ANIO_ACTUAL);
  const [drawer, setDrawer] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [del, setDel] = React.useState(null);

  const list = S.getPresupuestos(mes, anio);
  const totalLim = list.reduce((s, p) => s + p.presupuesto, 0);
  const totalGas = list.reduce((s, p) => s + p.gasto_actual, 0);

  const handleCopiar = () => {
    let mAnt = mes - 1, aAnt = anio;
    if (mAnt <= 0) { mAnt = 12; aAnt -= 1; }
    const n = S.copiarPresupuestos(mAnt, aAnt, mes, anio);
    if (n > 0) toast(`${n} presupuesto${n !== 1 ? "s" : ""} copiado${n !== 1 ? "s" : ""}`);
    else toast(`No hay presupuestos en ${S.nombreMes[mAnt]} ${aAnt}`, "info");
  };

  return (
    <div>
      <PageHeader title="Presupuestos" subtitle={`${S.nombreMes[mes]} ${anio} · ${list.length} presupuesto${list.length !== 1 ? "s" : ""}`}
        actions={<>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ width: 120 }}><Select value={mes} onChange={(v) => setMes(+v)} options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: S.nombreMes[i + 1] }))} /></div>
            <div style={{ width: 100 }}><Select value={anio} onChange={(v) => setAnio(+v)} options={[S.ANIO_ACTUAL - 1, S.ANIO_ACTUAL, S.ANIO_ACTUAL + 1].map((a) => ({ value: a, label: a }))} /></div>
          </div>
          <Button variant="ghost" icon="list" onClick={handleCopiar}>Copiar mes ant.</Button>
          <Button variant="primary" icon="plus" onClick={() => { setEditing(null); setDrawer(true); }}>Nuevo presupuesto</Button>
        </>} />

      {list.length === 0 ? (
        <Card><EmptyState icon="budget" title="Sin presupuestos este mes" hint={`No hay presupuestos para ${S.nombreMes[mes]} ${anio}. Crea uno para empezar a monitorear tus límites de gasto.`}
          action={<Button variant="primary" icon="plus" onClick={() => { setEditing(null); setDrawer(true); }}>Nuevo presupuesto</Button>} /></Card>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: 14, marginBottom: 16 }} className="dash-2col m-grid">
            <Card pad={15}><div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Total presupuestado</div><div style={{ fontSize: 19, fontWeight: 600, fontFamily: "var(--mono)" }}>{fmtMoney(totalLim)}</div></Card>
            <Card pad={15}><div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Total gastado</div><div style={{ fontSize: 19, fontWeight: 600, fontFamily: "var(--mono)", color: totalGas > totalLim ? "#ef4444" : "#eaeaea" }}>{fmtMoney(totalGas)}</div></Card>
            <Card pad={15}><div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Disponible</div><div style={{ fontSize: 19, fontWeight: 600, fontFamily: "var(--mono)", color: totalLim - totalGas >= 0 ? "#10b981" : "#ef4444" }}>{fmtMoney(totalLim - totalGas)}</div></Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 16 }}>
            {list.map((p) => <PresupuestoCard key={p.id} p={p} onEdit={() => { setEditing(p); setDrawer(true); }} onDelete={() => setDel(p)} />)}
          </div>

          <ChartCard title="Resumen del mes" subtitle="Uso de cada presupuesto">
            <HBarChart data={list} />
          </ChartCard>
        </>
      )}

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={editing ? "Editar presupuesto" : "Nuevo presupuesto"}>
        {drawer && <PresupuestoForm initial={editing} mes={mes} anio={anio} onClose={() => setDrawer(false)} />}
      </Drawer>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={() => { S.deletePresupuesto(del.id); toast("Presupuesto eliminado", "err"); }}
        title="Eliminar presupuesto" message={del ? `¿Eliminar el presupuesto "${del.nombre}"?` : ""} />
    </div>
  );
}

Object.assign(window, { Presupuestos });
