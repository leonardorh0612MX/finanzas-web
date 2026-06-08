/* page-transacciones.jsx */

const TIPO_COLOR = { "Ingreso": "#10b981", "Gasto": "#ef4444", "Pago de deuda": "#f59e0b", "Ahorro": "#22c55e", "Transferencia": "#3b82f6" };

function TransaccionForm({ initial, onClose }) {
  const S = window.FinanzasStore;
  const toast = useToast();
  const [f, setF] = React.useState(initial || { nombre: "", fecha: todayISO(), tipo: "Gasto", monto: "", categoria: "Alimentación", subcategoria: "", cuenta: "", cuenta_destino: "", deuda: "", notas: "" });
  const [err, setErr] = React.useState({});
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const cuentas = S.getCuentas();
  const deudas = S.getDeudas().filter((d) => d.estado !== "Liquidada");

  const submit = () => {
    const e = {};
    if (!f.nombre.trim()) e.nombre = "El nombre es requerido";
    if (!f.fecha) e.fecha = "La fecha es requerida";
    if (!(+f.monto > 0)) e.monto = "El monto debe ser mayor a 0";
    setErr(e);
    if (Object.keys(e).length) return;
    const payload = { ...f, monto: +f.monto, cuenta: f.cuenta ? +f.cuenta : null, cuenta_destino: f.tipo === "Transferencia" && f.cuenta_destino ? +f.cuenta_destino : null, deuda: f.tipo === "Pago de deuda" && f.deuda ? +f.deuda : null };
    if (initial && initial.id) { S.updateTransaccion(initial.id, payload); toast("Transacción actualizada"); }
    else { S.addTransaccion(payload); toast("Transacción guardada"); }
    onClose();
  };

  return (
    <>
      <div style={{ flex: 1 }}>
        <Field label="Nombre / descripción" error={err.nombre}><TextInput value={f.nombre} onChange={set("nombre")} placeholder="Ej. Súper de la semana" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Fecha" error={err.fecha}><TextInput type="date" value={f.fecha} onChange={set("fecha")} /></Field>
          <Field label="Tipo"><Select value={f.tipo} onChange={set("tipo")} options={S.TIPOS} /></Field>
        </div>
        {(() => { const subs = S.getSubcategorias(f.categoria); return (
          <div style={{ display: "grid", gridTemplateColumns: subs.length ? "1fr 1fr 1fr" : "1fr 1fr", gap: 12 }}>
            <Field label="Monto (MXN)" error={err.monto}><TextInput type="number" mono value={f.monto} onChange={set("monto")} placeholder="0.00" /></Field>
            <Field label="Categoría"><Select value={f.categoria} onChange={(v) => { set("categoria")(v); set("subcategoria")(""); }} options={S.getCategorias()} /></Field>
            {subs.length > 0 && <Field label="Subcategoría"><Select value={f.subcategoria} onChange={set("subcategoria")} placeholder="— General —" options={subs} /></Field>}
          </div>
        ); })()}
        {f.tipo === "Transferencia" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Cuenta origen"><Select value={f.cuenta} onChange={set("cuenta")} placeholder="— Selecciona —" options={cuentas.map((c) => ({ value: c.id, label: `${c.nombre} · ${c.tipo}` }))} /></Field>
            <Field label="Cuenta destino"><Select value={f.cuenta_destino} onChange={set("cuenta_destino")} placeholder="— Selecciona —" options={cuentas.map((c) => ({ value: c.id, label: `${c.nombre} · ${c.tipo}` }))} /></Field>
          </div>
        ) : (
          <Field label="Cuenta"><Select value={f.cuenta} onChange={set("cuenta")} placeholder="— Selecciona —" options={cuentas.map((c) => ({ value: c.id, label: `${c.nombre} · ${c.tipo}` }))} /></Field>
        )}
        {f.tipo === "Pago de deuda" && (
          <Field label="Deuda vinculada" hint="El pago se sumará al avance de la deuda">
            <Select value={f.deuda} onChange={set("deuda")} placeholder="— Selecciona deuda —" options={deudas.map((d) => ({ value: d.id, label: `${d.nombre} · resta ${fmtMoneyShort(d.saldo_restante)}` }))} />
          </Field>
        )}
        <Field label="Notas"><Textarea value={f.notas} onChange={set("notas")} placeholder="Opcional" /></Field>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" icon="check" onClick={submit}>{initial && initial.id ? "Guardar cambios" : "Crear transacción"}</Button>
      </div>
    </>
  );
}

function Transacciones() {
  const S = useStore();
  const toast = useToast();
  const [filtros, setFiltros] = React.useState({ mes: S.MES_ACTUAL, anio: S.ANIO_ACTUAL, tipo: "Todos", categoria: "Todas", q: "" });
  const [sort, setSort] = React.useState({ key: "fecha", dir: -1 });
  const [drawer, setDrawer] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [del, setDel] = React.useState(null);
  const setFil = (k) => (v) => setFiltros((s) => ({ ...s, [k]: v }));

  let list = S.getTransacciones(filtros);
  const cuentasMap = Object.fromEntries(S.getCuentas().map((c) => [c.id, c.nombre]));
  // sort
  list = list.slice().sort((a, b) => {
    let r = 0;
    if (sort.key === "monto") r = a.monto - b.monto;
    else if (sort.key === "fecha") r = a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.id - b.id;
    else r = String(a[sort.key] || "").localeCompare(String(b[sort.key] || ""));
    return r * sort.dir;
  });

  const toggleSort = (key) => setSort((s) => s.key === key ? { key, dir: -s.dir } : { key, dir: key === "fecha" || key === "monto" ? -1 : 1 });

  const ingresos = list.filter((t) => t.tipo === "Ingreso").reduce((s, t) => s + t.monto, 0);
  const gastos = list.filter((t) => t.tipo === "Gasto" || t.tipo === "Pago de deuda").reduce((s, t) => s + t.monto, 0);

  const anios = [...new Set(S.getTransacciones().map((t) => t.anio))].sort((a, b) => b - a);
  const Th = ({ k, children, align = "left" }) => (
    <th onClick={() => toggleSort(k)} style={{ textAlign: align, padding: "10px 12px", fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
      {children} {sort.key === k && <span style={{ color: "#3b82f6" }}>{sort.dir < 0 ? "↓" : "↑"}</span>}
    </th>
  );

  return (
    <div>
      <PageHeader title="Transacciones" subtitle={`${list.length} movimiento${list.length !== 1 ? "s" : ""} en el periodo`}
        actions={<Button variant="primary" icon="plus" onClick={() => { setEditing(null); setDrawer(true); }}>Nueva transacción</Button>} />

      {/* resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 16 }}>
        <Card pad={15}><div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Ingresos del periodo</div><div style={{ fontSize: 19, fontWeight: 600, fontFamily: "var(--mono)", color: "#10b981" }}>{fmtMoney(ingresos)}</div></Card>
        <Card pad={15}><div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Gastos del periodo</div><div style={{ fontSize: 19, fontWeight: 600, fontFamily: "var(--mono)", color: "#ef4444" }}>{fmtMoney(gastos)}</div></Card>
        <Card pad={15}><div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Balance</div><div style={{ fontSize: 19, fontWeight: 600, fontFamily: "var(--mono)", color: ingresos - gastos >= 0 ? "#10b981" : "#ef4444" }}>{fmtMoney(ingresos - gastos)}</div></Card>
      </div>

      {/* filtros */}
      <Card pad={12} style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#666" }}><Icon name="search" size={15} /></span>
            <input value={filtros.q} onChange={(e) => setFil("q")(e.target.value)} placeholder="Buscar por nombre…"
              style={{ ...inputStyle, paddingLeft: 32 }} />
          </div>
          <div style={{ width: 120 }}><Select value={filtros.mes} onChange={(v) => setFil("mes")(+v)} options={[{ value: 0, label: "Todo el año" }, ...Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: S.nombreMes[i + 1] }))]} /></div>
          <div style={{ width: 100 }}><Select value={filtros.anio} onChange={(v) => setFil("anio")(+v)} options={anios.map((a) => ({ value: a, label: a }))} /></div>
          <div style={{ width: 150 }}><Select value={filtros.tipo} onChange={setFil("tipo")} options={["Todos", ...S.TIPOS]} /></div>
          <div style={{ width: 150 }}><Select value={filtros.categoria} onChange={setFil("categoria")} options={["Todas", ...S.getCategorias()]} /></div>
        </div>
      </Card>

      {/* tabla */}
      <Card pad={0} style={{ overflow: "hidden" }}>
        {list.length === 0 ? (
          <EmptyState icon="list" title="Sin transacciones" hint="No hay movimientos con estos filtros. Ajusta el periodo o crea una nueva transacción."
            action={<Button variant="primary" icon="plus" onClick={() => { setEditing(null); setDrawer(true); }}>Nueva transacción</Button>} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                <Th k="fecha">Fecha</Th><Th k="nombre">Nombre</Th><Th k="categoria">Categoría</Th><Th k="tipo">Tipo</Th>
                <Th k="monto" align="right">Monto</Th><Th k="cuenta">Cuenta</Th><th style={{ width: 70 }}></th>
              </tr></thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id} className="trow" style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "11px 12px", fontSize: 12.5, fontFamily: "var(--mono)", color: "#aaa", whiteSpace: "nowrap" }}>{fmtDate(t.fecha)}</td>
                    <td style={{ padding: "11px 12px", fontSize: 13, color: "#eaeaea" }}>{t.nombre}{t.notas ? <span style={{ display: "block", fontSize: 11, color: "#666" }}>{t.notas}</span> : null}</td>
                    <td style={{ padding: "11px 12px", fontSize: 12.5 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#bbb" }}><span style={{ width: 7, height: 7, borderRadius: 2, background: CAT_COLORS[t.categoria] || "#888" }}></span>{t.categoria}</span></td>
                    <td style={{ padding: "11px 12px" }}><Badge color={TIPO_COLOR[t.tipo]}>{t.tipo}</Badge></td>
                    <td style={{ padding: "11px 12px", textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", color: TIPO_COLOR[t.tipo] }}>
                      {t.tipo === "Ingreso" ? "+" : t.tipo === "Gasto" || t.tipo === "Pago de deuda" ? "−" : ""}{fmtMoney(t.monto)}
                    </td>
                    <td style={{ padding: "11px 12px", fontSize: 12.5, color: "#999", whiteSpace: "nowrap" }}>
                      {t.tipo === "Transferencia" && t.cuenta_destino
                        ? `${cuentasMap[t.cuenta] || "—"} → ${cuentasMap[t.cuenta_destino] || "—"}`
                        : (t.cuenta ? cuentasMap[t.cuenta] || "—" : "—")}
                    </td>
                    <td style={{ padding: "11px 8px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        <button className="ibtn" onClick={() => { setEditing(t); setDrawer(true); }} title="Editar"><Icon name="edit" size={15} /></button>
                        <button className="ibtn" onClick={() => setDel(t)} title="Eliminar"><Icon name="trash" size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={editing ? "Editar transacción" : "Nueva transacción"}>
        {drawer && <TransaccionForm initial={editing} onClose={() => setDrawer(false)} />}
      </Drawer>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={() => { S.deleteTransaccion(del.id); toast("Transacción eliminada", "err"); }}
        title="Eliminar transacción" message={del ? `¿Eliminar "${del.nombre}" por ${fmtMoney(del.monto)}? Esta acción no se puede deshacer.` : ""} />
    </div>
  );
}

Object.assign(window, { Transacciones, TransaccionForm, TIPO_COLOR });
