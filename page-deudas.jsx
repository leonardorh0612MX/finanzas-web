/* page-deudas.jsx */

function DeudaForm({ initial, onClose }) {
  const S = window.FinanzasStore;
  const toast = useToast();
  const cuentasCredito = window.FinanzasStore.getCuentas().filter(c => c.tipo === "Crédito" && c.activa);
  const [f, setF] = React.useState(initial || { nombre: "", tipo: "Tarjeta de crédito", monto_total: "", tasa_interes: "", fecha_pago: todayISO(), cuenta_vinculada: null, notas: "" });
  const [err, setErr] = React.useState({});
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => {
    const e = {};
    if (!f.nombre.trim()) e.nombre = "Requerido";
    if (!(+f.monto_total > 0)) e.monto_total = "Debe ser mayor a 0";
    setErr(e); if (Object.keys(e).length) return;
    if (initial && initial.id) { S.updateDeuda(initial.id, f); toast("Deuda actualizada"); }
    else { S.addDeuda(f); toast("Deuda registrada"); }
    onClose();
  };
  return (
    <>
      <Field label="Nombre" error={err.nombre}><TextInput value={f.nombre} onChange={set("nombre")} placeholder="Ej. Tarjeta Nu" /></Field>
      <Field label="Tipo"><Select value={f.tipo} onChange={set("tipo")} options={["Tarjeta de crédito", "Préstamo personal", "Préstamo automotriz", "Crédito educativo", "Préstamo familiar", "Hipoteca", "Otro"]} /></Field>
      <div className="m-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Monto total (MXN)" error={err.monto_total}><TextInput type="number" mono value={f.monto_total} onChange={set("monto_total")} placeholder="0.00" /></Field>
        <Field label="Tasa de interés (%)"><TextInput type="number" mono value={f.tasa_interes} onChange={set("tasa_interes")} placeholder="0.0" /></Field>
      </div>
      <Field label="Fecha límite de pago"><TextInput type="date" value={f.fecha_pago} onChange={set("fecha_pago")} /></Field>
      {cuentasCredito.length > 0 && (
        <Field label="Cuenta de crédito vinculada (opcional)"
          hint="Si los gastos de esta deuda ya se registran en una tarjeta de crédito, vincúlala para evitar doble conteo en el Patrimonio Neto.">
          <Select value={f.cuenta_vinculada || ""} onChange={v => set("cuenta_vinculada")(v ? +v : null)}
            placeholder="— No vincular —"
            options={cuentasCredito.map(c => ({ value: c.id, label: c.nombre }))} />
        </Field>
      )}
      <Field label="Notas"><Textarea value={f.notas} onChange={set("notas")} placeholder="Opcional" /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" icon="check" onClick={submit}>{initial && initial.id ? "Guardar" : "Registrar deuda"}</Button>
      </div>
    </>
  );
}

function PagoForm({ deuda, onClose }) {
  const S = window.FinanzasStore;
  const toast = useToast();
  const [monto, setMonto] = React.useState("");
  const [fecha, setFecha] = React.useState(todayISO());
  const [cuenta, setCuenta] = React.useState("");
  const [err, setErr] = React.useState("");
  const cuentas = S.getCuentas();
  const submit = () => {
    if (!(+monto > 0)) { setErr("El monto debe ser mayor a 0"); return; }
    S.registrarPagoDeuda(deuda.id, +monto, fecha, cuenta ? +cuenta : null);
    toast(`Pago de ${fmtMoney(+monto)} registrado`);
    onClose();
  };
  return (
    <>
      <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 9, padding: 14, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{deuda.nombre}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999", fontFamily: "var(--mono)" }}>
          <span>Saldo restante</span><span style={{ color: "#f59e0b" }}>{fmtMoney(deuda.saldo_restante)}</span>
        </div>
        <div style={{ marginTop: 10 }}><ProgressBar pct={deuda.porcentaje} color={STATE_COLOR[deuda.estado]} /></div>
      </div>
      <Field label="Monto del pago (MXN)" error={err}><TextInput type="number" mono value={monto} onChange={setMonto} placeholder="0.00" /></Field>
      <Field label="Fecha"><TextInput type="date" value={fecha} onChange={setFecha} /></Field>
      <Field label="Cuenta de origen"><Select value={cuenta} onChange={setCuenta} placeholder="— Selecciona —" options={cuentas.map((c) => ({ value: c.id, label: c.nombre }))} /></Field>
      <div style={{ fontSize: 11.5, color: "#666", marginBottom: 16 }}>Se creará una transacción tipo "Pago de deuda" vinculada a esta deuda.</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" icon="check" onClick={submit}>Registrar pago</Button>
      </div>
    </>
  );
}

function DeudaCard({ d, onPay, onEdit, onDelete }) {
  const color = STATE_COLOR[d.estado];
  const dias = diasRestantes(d.fecha_pago);
  const vencida = dias < 0 && d.estado !== "Liquidada";
  return (
    <Card hover style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{d.nombre}</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{d.tipo}{d.tasa_interes > 0 ? ` · ${d.tasa_interes}% interés` : " · sin interés"}</div>
        </div>
        <Badge color={color}>{d.estado}</Badge>
      </div>

      <ProgressBar pct={d.porcentaje} color={color} height={9} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8 }}>
        <div><div style={{ fontSize: 10.5, color: "#777", marginBottom: 2 }}>Total</div><div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600 }}>{fmtMoneyShort(d.monto_total)}</div></div>
        <div><div style={{ fontSize: 10.5, color: "#777", marginBottom: 2 }}>Pagado</div><div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "#10b981" }}>{fmtMoneyShort(d.pagado)}</div></div>
        <div><div style={{ fontSize: 10.5, color: "#777", marginBottom: 2 }}>Resta</div><div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>{fmtMoneyShort(d.saldo_restante)}</div></div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: vencida ? "#ef4444" : "#888", borderTop: "1px solid var(--border)", paddingTop: 11 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="clock" size={13} />{fmtDate(d.fecha_pago)}{d.estado !== "Liquidada" && <span style={{ color: vencida ? "#ef4444" : "#666" }}>· {vencida ? `${Math.abs(dias)}d vencida` : `${dias}d`}</span>}</span>
        <span style={{ fontFamily: "var(--mono)", color }}>{d.porcentaje.toFixed(0)}%</span>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {d.estado !== "Liquidada" && <Button size="sm" variant="default" icon="plus" onClick={onPay} style={{ flex: 1 }}>Registrar pago</Button>}
        <Button size="sm" variant="ghost" icon="edit" onClick={onEdit} />
        <Button size="sm" variant="ghost" icon="trash" onClick={onDelete} style={{ color: "#ef4444" }} />
      </div>
    </Card>
  );
}

function Deudas() {
  const S = useStore();
  const toast = useToast();
  const [drawer, setDrawer] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [pago, setPago] = React.useState(null);
  const [del, setDel] = React.useState(null);

  const list = S.getDeudas();
  const totalOriginal = list.reduce((s, d) => s + d.monto_total, 0);
  const totalPagado = list.reduce((s, d) => s + d.pagado, 0);
  const totalResta = list.reduce((s, d) => s + d.saldo_restante, 0);
  const pctGlobal = totalOriginal > 0 ? (totalPagado / totalOriginal) * 100 : 0;
  const dashboard = S.getDashboard();
  const ratio = dashboard.kpis.ratio_endeudamiento;
  const ratioColor = ratio > 40 ? "#ef4444" : ratio > 30 ? "#f59e0b" : "#10b981";

  return (
    <div>
      <PageHeader title="Deudas" subtitle={`${list.filter((d) => d.estado !== "Liquidada").length} activa(s) · ${list.filter((d) => d.estado === "Liquidada").length} liquidada(s)`}
        actions={<Button variant="primary" icon="plus" onClick={() => { setEditing(null); setDrawer(true); }}>Nueva deuda</Button>} />

      {list.length === 0 ? (
        <Card><EmptyState icon="debt" title="Sin deudas registradas" hint="Registra tus deudas para dar seguimiento a pagos, intereses y fechas límite."
          action={<Button variant="primary" icon="plus" onClick={() => { setEditing(null); setDrawer(true); }}>Nueva deuda</Button>} /></Card>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 18, marginBottom: 16 }}>
              <div><div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Deuda total original</div><div style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--mono)" }}>{fmtMoney(totalOriginal)}</div></div>
              <div><div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Total pagado</div><div style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--mono)", color: "#10b981" }}>{fmtMoney(totalPagado)}</div></div>
              <div><div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Saldo restante</div><div style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--mono)", color: "#f59e0b" }}>{fmtMoney(totalResta)}</div></div>
              <div><div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Avance global</div><div style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--mono)", color: "#3b82f6" }}>{pctGlobal.toFixed(1)}%</div></div>
              <div>
                <div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Ratio endeudamiento</div>
                <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--mono)", color: ratioColor }}>{ratio.toFixed(1)}%</div>
                <div style={{ fontSize: 10.5, color: "#555", marginTop: 2 }}>{ratio > 30 ? "⚠ Sobre 30%" : "del ingreso mensual"}</div>
              </div>
            </div>
            <ProgressBar pct={pctGlobal} color="#10b981" height={10} />
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {list.map((d) => <DeudaCard key={d.id} d={d} onPay={() => setPago(d)} onEdit={() => { setEditing(d); setDrawer(true); }} onDelete={() => setDel(d)} />)}
          </div>
        </>
      )}

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={editing ? "Editar deuda" : "Nueva deuda"}>
        {drawer && <DeudaForm initial={editing} onClose={() => setDrawer(false)} />}
      </Drawer>
      <Drawer open={!!pago} onClose={() => setPago(null)} title="Registrar pago" width={420}>
        {pago && <PagoForm deuda={pago} onClose={() => setPago(null)} />}
      </Drawer>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={() => { S.deleteDeuda(del.id); toast("Deuda eliminada", "err"); }}
        title="Eliminar deuda" message={del ? `¿Eliminar "${del.nombre}"? Los pagos registrados como transacciones no se eliminarán.` : ""} />
    </div>
  );
}

Object.assign(window, { Deudas });
