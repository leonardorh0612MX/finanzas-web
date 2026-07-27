/* page-prestamos.jsx — dinero que me deben */

function PrestamoForm({ initial, onClose }) {
  const S = window.FinanzasStore;
  const toast = useToast();
  const [f, setF] = React.useState(initial || { nombre: "", concepto: "", monto_total: "", tasa_interes: "", fecha_prestamo: todayISO(), fecha_vencimiento: "", notas: "" });
  const [err, setErr] = React.useState({});
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => {
    const e = {};
    if (!f.nombre.trim()) e.nombre = "Requerido";
    if (!(+f.monto_total > 0)) e.monto_total = "Debe ser mayor a 0";
    setErr(e); if (Object.keys(e).length) return;
    if (initial && initial.id) { S.updatePrestamo(initial.id, f); toast("Préstamo actualizado"); }
    else { S.addPrestamo(f); toast("Préstamo registrado"); }
    onClose();
  };
  return (
    <>
      <Field label="Nombre del deudor" error={err.nombre}><TextInput value={f.nombre} onChange={set("nombre")} placeholder="Ej. Carlos López" /></Field>
      <Field label="Concepto"><TextInput value={f.concepto} onChange={set("concepto")} placeholder="Ej. Préstamo para renta" /></Field>
      <div className="m-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Monto total (MXN)" error={err.monto_total}><TextInput type="number" mono value={f.monto_total} onChange={set("monto_total")} placeholder="0.00" /></Field>
        <Field label="Tasa de interés (%)"><TextInput type="number" mono value={f.tasa_interes} onChange={set("tasa_interes")} placeholder="0.0" /></Field>
      </div>
      <div className="m-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Fecha del préstamo"><TextInput type="date" value={f.fecha_prestamo} onChange={set("fecha_prestamo")} /></Field>
        <Field label="Fecha vencimiento (opcional)"><TextInput type="date" value={f.fecha_vencimiento} onChange={set("fecha_vencimiento")} /></Field>
      </div>
      <Field label="Notas"><Textarea value={f.notas} onChange={set("notas")} placeholder="Opcional" /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" icon="check" onClick={submit}>{initial && initial.id ? "Guardar" : "Registrar préstamo"}</Button>
      </div>
    </>
  );
}

function CobroForm({ prestamo, onClose }) {
  const S = window.FinanzasStore;
  const toast = useToast();
  const [monto, setMonto] = React.useState("");
  const [fecha, setFecha] = React.useState(todayISO());
  const [cuenta, setCuenta] = React.useState("");
  const [err, setErr] = React.useState("");
  const cuentas = S.getCuentas();
  const submit = () => {
    if (!(+monto > 0)) { setErr("El monto debe ser mayor a 0"); return; }
    S.registrarCobroPrestamo(prestamo.id, +monto, fecha, cuenta ? +cuenta : null);
    toast(`Cobro de ${fmtMoney(+monto)} registrado`);
    onClose();
  };
  return (
    <>
      <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 9, padding: 14, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{prestamo.nombre}</div>
        {prestamo.concepto && <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{prestamo.concepto}</div>}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999", fontFamily: "var(--mono)" }}>
          <span>Pendiente de cobro</span><span style={{ color: "#3b82f6" }}>{fmtMoney(prestamo.saldo_pendiente)}</span>
        </div>
        <div style={{ marginTop: 10 }}><ProgressBar pct={prestamo.porcentaje} color="#3b82f6" /></div>
      </div>
      <Field label="Monto cobrado (MXN)" error={err}><TextInput type="number" mono value={monto} onChange={setMonto} placeholder="0.00" /></Field>
      <Field label="Fecha"><TextInput type="date" value={fecha} onChange={setFecha} /></Field>
      <Field label="Cuenta de destino"><Select value={cuenta} onChange={setCuenta} placeholder="— Selecciona —" options={cuentas.map((c) => ({ value: c.id, label: c.nombre }))} /></Field>
      <div style={{ fontSize: 11.5, color: "#666", marginBottom: 16 }}>Se creará un Ingreso en tus transacciones y se actualizará el avance del préstamo.</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" icon="check" onClick={submit}>Registrar cobro</Button>
      </div>
    </>
  );
}

function PrestamoCard({ p, onCobro, onEdit, onDelete }) {
  const dias = p.fecha_vencimiento ? diasRestantes(p.fecha_vencimiento) : null;
  const vencido = dias !== null && dias < 0 && p.estado !== "Cobrado";
  return (
    <Card hover style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{p.nombre}</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{p.concepto || "Préstamo personal"}{p.tasa_interes > 0 ? ` · ${p.tasa_interes}% interés` : ""}</div>
        </div>
        <Badge color={p.estado === "Cobrado" ? "#10b981" : "#3b82f6"}>{p.estado}</Badge>
      </div>

      <ProgressBar pct={p.porcentaje} color={p.estado === "Cobrado" ? "#10b981" : "#3b82f6"} height={9} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8 }}>
        <div><div style={{ fontSize: 10.5, color: "#777", marginBottom: 2 }}>Total</div><div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600 }}>{fmtMoneyShort(p.monto_total)}</div></div>
        <div><div style={{ fontSize: 10.5, color: "#777", marginBottom: 2 }}>Cobrado</div><div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "#10b981" }}>{fmtMoneyShort(p.cobrado)}</div></div>
        <div><div style={{ fontSize: 10.5, color: "#777", marginBottom: 2 }}>Pendiente</div><div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "#3b82f6" }}>{fmtMoneyShort(p.saldo_pendiente)}</div></div>
      </div>

      {(p.fecha_prestamo || dias !== null) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: vencido ? "#ef4444" : "#888", borderTop: "1px solid var(--border)", paddingTop: 11 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="clock" size={13} />
            {p.fecha_prestamo && <span>Prestado: {fmtDate(p.fecha_prestamo)}</span>}
            {dias !== null && <span style={{ color: vencido ? "#ef4444" : "#666" }}>· {vencido ? `${Math.abs(dias)}d vencido` : `vence en ${dias}d`}</span>}
          </span>
          <span style={{ fontFamily: "var(--mono)", color: p.estado === "Cobrado" ? "#10b981" : "#3b82f6" }}>{p.porcentaje.toFixed(0)}%</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        {p.estado !== "Cobrado" && <Button size="sm" variant="default" icon="plus" onClick={onCobro} style={{ flex: 1 }}>Registrar cobro</Button>}
        <Button size="sm" variant="ghost" icon="edit" onClick={onEdit} />
        <Button size="sm" variant="ghost" icon="trash" onClick={onDelete} style={{ color: "#ef4444" }} />
      </div>
    </Card>
  );
}

function Prestamos() {
  const S = useStore();
  const toast = useToast();
  const [drawer, setDrawer] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [cobro, setCobro] = React.useState(null);
  const [del, setDel] = React.useState(null);

  const list = S.getPrestamos();
  const activos = list.filter(p => p.estado !== "Cobrado");
  const cobrados = list.filter(p => p.estado === "Cobrado");
  const totalPrestado = list.reduce((s, p) => s + p.monto_total, 0);
  const totalCobrado = list.reduce((s, p) => s + p.cobrado, 0);
  const totalPendiente = list.reduce((s, p) => s + p.saldo_pendiente, 0);

  return (
    <div>
      <PageHeader title="Préstamos" subtitle={`${activos.length} activo(s) · ${cobrados.length} cobrado(s)`}
        actions={<Button variant="primary" icon="plus" onClick={() => { setEditing(null); setDrawer(true); }}>Nuevo préstamo</Button>} />

      {list.length === 0 ? (
        <Card><EmptyState icon="lend" title="Sin préstamos registrados" hint="Registra el dinero que le prestaste a alguien para darle seguimiento."
          action={<Button variant="primary" icon="plus" onClick={() => { setEditing(null); setDrawer(true); }}>Nuevo préstamo</Button>} /></Card>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div className="m-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 18, marginBottom: 16 }}>
              <div><div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Total prestado</div><div style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--mono)" }}>{fmtMoney(totalPrestado)}</div></div>
              <div><div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Total cobrado</div><div style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--mono)", color: "#10b981" }}>{fmtMoney(totalCobrado)}</div></div>
              <div><div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Pendiente de cobrar</div><div style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--mono)", color: "#3b82f6" }}>{fmtMoney(totalPendiente)}</div></div>
            </div>
            {totalPrestado > 0 && <ProgressBar pct={(totalCobrado / totalPrestado) * 100} color="#3b82f6" height={10} />}
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {list.map((p) => <PrestamoCard key={p.id} p={p} onCobro={() => setCobro(p)} onEdit={() => { setEditing(p); setDrawer(true); }} onDelete={() => setDel(p)} />)}
          </div>
        </>
      )}

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={editing ? "Editar préstamo" : "Nuevo préstamo"}>
        {drawer && <PrestamoForm initial={editing} onClose={() => setDrawer(false)} />}
      </Drawer>
      <Drawer open={!!cobro} onClose={() => setCobro(null)} title="Registrar cobro" width={420}>
        {cobro && <CobroForm prestamo={cobro} onClose={() => setCobro(null)} />}
      </Drawer>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={() => { S.deletePrestamo(del.id); toast("Préstamo eliminado", "err"); }}
        title="Eliminar préstamo" message={del ? `¿Eliminar el préstamo de "${del.nombre}"? Los cobros registrados como ingresos no se eliminarán.` : ""} />
    </div>
  );
}

Object.assign(window, { Prestamos });