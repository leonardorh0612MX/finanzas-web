/* page-cuentas.jsx */

const CUENTA_COLOR = { "Débito": "#3b82f6", "Crédito": "#a855f7", "Efectivo": "#10b981", "Inversión": "#f59e0b" };

function CuentaForm({ initial, onClose }) {
  const S = window.FinanzasStore;
  const toast = useToast();
  const isEditing = !!(initial && initial.id);
  const [f, setF] = React.useState(isEditing
    ? { nombre: initial.nombre, tipo: initial.tipo, banco: initial.banco || "", notas: initial.notas || "" }
    : { nombre: "", tipo: "Débito", banco: "", saldo: "", notas: "" });
  const [err, setErr] = React.useState({});
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => {
    const e = {};
    if (!f.nombre.trim()) e.nombre = "Requerido";
    setErr(e); if (Object.keys(e).length) return;
    if (isEditing) { S.updateCuenta(initial.id, f); toast("Cuenta actualizada"); }
    else { S.addCuenta(f); toast("Cuenta creada"); }
    onClose();
  };
  return (
    <>
      <Field label="Nombre" error={err.nombre}><TextInput value={f.nombre} onChange={set("nombre")} placeholder="Ej. BBVA Nómina" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Tipo"><Select value={f.tipo} onChange={set("tipo")} options={["Débito", "Crédito", "Efectivo", "Inversión"]} /></Field>
        <Field label="Banco / Institución"><TextInput value={f.banco} onChange={set("banco")} placeholder="Ej. BBVA" /></Field>
      </div>
      {isEditing ? (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#888" }}>
            <span>Saldo inicial (fijo)</span>
            <span style={{ fontFamily: "var(--mono)", color: "#ccc" }}>{fmtMoney(initial.saldo_inicial)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#888" }}>
            <span>Saldo actual (calculado)</span>
            <span style={{ fontFamily: "var(--mono)", color: initial.saldo_actual < 0 ? "#ef4444" : "#10b981", fontWeight: 600 }}>{fmtMoney(initial.saldo_actual)}</span>
          </div>
        </div>
      ) : (
        <Field label="Saldo inicial (MXN)" hint="Punto de partida — el saldo actual se calcula sumando tus transacciones">
          <TextInput type="number" mono value={f.saldo} onChange={set("saldo")} placeholder="0.00" />
        </Field>
      )}
      <Field label="Notas"><Textarea value={f.notas} onChange={set("notas")} placeholder="Opcional" /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" icon="check" onClick={submit}>{isEditing ? "Guardar" : "Crear cuenta"}</Button>
      </div>
    </>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={onChange} style={{ width: 38, height: 22, borderRadius: 12, border: "none", cursor: "pointer", padding: 2,
      background: on ? "#10b981" : "rgba(255,255,255,0.12)", transition: "background .2s", display: "flex", justifyContent: on ? "flex-end" : "flex-start" }}>
      <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "all .2s", boxShadow: "0 1px 3px rgba(0,0,0,.4)" }}></span>
    </button>
  );
}

function CuentaCard({ c, onEdit, onDelete, onToggle }) {
  const color = CUENTA_COLOR[c.tipo] || "#888";
  return (
    <Card hover style={{ opacity: c.activa ? 1 : 0.55, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: color + "1a", color }}><Icon name="wallet" size={19} /></span>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.nombre}</div>
            <div style={{ fontSize: 11.5, color: "#888" }}>{c.banco || "—"}</div>
          </div>
        </div>
        <Badge color={color}>{c.tipo}</Badge>
      </div>

      <div>
        <div style={{ fontSize: 10.5, color: "#777", marginBottom: 3 }}>Saldo actual</div>
        <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--mono)", color: c.saldo_actual < 0 ? "#ef4444" : "#eaeaea" }}>{fmtMoney(c.saldo_actual)}</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#999" }}>
          <Toggle on={c.activa} onChange={onToggle} />{c.activa ? "Activa" : "Inactiva"}
        </span>
        <div style={{ display: "flex", gap: 2 }}>
          <button className="ibtn" onClick={onEdit} title="Editar"><Icon name="edit" size={15} /></button>
          <button className="ibtn" onClick={onDelete} title="Eliminar"><Icon name="trash" size={15} /></button>
        </div>
      </div>
    </Card>
  );
}

function Cuentas() {
  const S = useStore();
  const toast = useToast();
  const [drawer, setDrawer] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [del, setDel] = React.useState(null);
  const list = S.getCuentas();
  const activas = list.filter((c) => c.activa);
  const totalActivo = activas.reduce((s, c) => s + c.saldo_actual, 0);

  // agrupar por tipo para resumen
  const porTipo = {};
  activas.forEach((c) => { porTipo[c.tipo] = (porTipo[c.tipo] || 0) + c.saldo_actual; });

  return (
    <div>
      <PageHeader title="Cuentas" subtitle={`${activas.length} activa(s) de ${list.length} · Patrimonio neto en cuentas`}
        actions={<Button variant="primary" icon="plus" onClick={() => { setEditing(null); setDrawer(true); }}>Nueva cuenta</Button>} />

      {list.length === 0 ? (
        <Card><EmptyState icon="wallet" title="Sin cuentas" hint="Agrega tus cuentas bancarias, efectivo e inversiones para ver tu saldo total."
          action={<Button variant="primary" icon="plus" onClick={() => { setEditing(null); setDrawer(true); }}>Nueva cuenta</Button>} /></Card>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>Saldo total (cuentas activas)</div>
                <div style={{ fontSize: 28, fontWeight: 600, fontFamily: "var(--mono)", color: totalActivo < 0 ? "#ef4444" : "#eaeaea" }}>{fmtMoney(totalActivo)}</div>
              </div>
              <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
                {Object.entries(porTipo).map(([tipo, saldo]) => (
                  <div key={tipo}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: CUENTA_COLOR[tipo] }}></span>{tipo}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--mono)", color: saldo < 0 ? "#ef4444" : "#ddd" }}>{fmtMoneyShort(saldo)}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {list.map((c) => <CuentaCard key={c.id} c={c} onEdit={() => { setEditing(c); setDrawer(true); }} onDelete={() => setDel(c)} onToggle={() => { S.toggleCuenta(c.id); }} />)}
          </div>
        </>
      )}

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={editing ? "Editar cuenta" : "Nueva cuenta"} width={420}>
        {drawer && <CuentaForm initial={editing} onClose={() => setDrawer(false)} />}
      </Drawer>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={() => { S.deleteCuenta(del.id); toast("Cuenta eliminada", "err"); }}
        title="Eliminar cuenta" message={del ? `¿Eliminar la cuenta "${del.nombre}"?` : ""} />
    </div>
  );
}

Object.assign(window, { Cuentas });
