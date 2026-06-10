/* page-dashboard.jsx — vista analítica principal */

function KpiCard({ label, value, sub, color = "#eaeaea", icon, accent, delay = 0, delta, deltaInvert }) {
  const dtColor = delta == null ? null : ((delta > 0) !== !!deltaInvert) ? "#10b981" : "#ef4444";
  const dtText  = delta == null ? null : `${delta > 0 ? "▲" : "▼"} ${Math.abs(delta)}% vs mes ant.`;
  return (
    <Card pad={16} className="fade-up" style={{ animationDelay: `${delay}s` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11.5, color: "#888", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 600 }}>{label}</span>
        {icon && <span style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: (accent || "#888") + "1a", color: accent || "#888" }}><Icon name={icon} size={15} /></span>}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--mono)", color, letterSpacing: "-0.01em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "#777", marginTop: 5 }}>{sub}</div>}
      {dtText && <div style={{ fontSize: 10.5, color: dtColor, marginTop: 4, fontFamily: "var(--mono)" }}>{dtText}</div>}
    </Card>
  );
}

function ChartCard({ title, subtitle, children, right, style }) {
  return (
    <Card pad={20} style={style}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h3 style={{ fontSize: 14.5, fontWeight: 600, margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#777" }}>{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </Card>
  );
}

function AlertRow({ color, icon, title, detail, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: color + "1a", color }}><Icon name={icon} size={15} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "#e6e6e6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ fontSize: 11.5, color: "#888" }}>{detail}</div>
      </div>
      {right}
    </div>
  );
}

function Dashboard({ tw, onNav }) {
  useStore();
  const d = window.FinanzasStore.getDashboard();
  const k = d.kpis;
  const balPos = k.balance_mes >= 0;
  const totalAlertas = d.alertas.presupuestos_excedidos.length + d.alertas.deudas_proximas.length + d.alertas.metas_criticas.length;
  const pct = (a, b) => (!b) ? null : +((a - b) / b * 100).toFixed(0);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Resumen de ${window.FinanzasStore.nombreMes[window.FinanzasStore.MES_ACTUAL]} ${window.FinanzasStore.ANIO_ACTUAL} · Leonardo`} />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: 14, marginBottom: 16 }}>
        <KpiCard label="Patrimonio neto"
          value={fmtMoney(k.patrimonio_neto)}
          sub={`Activos ${fmtMoneyShort(k.activos)} · Pasivos ${fmtMoneyShort(k.pasivos)}`}
          color={k.patrimonio_neto >= 0 ? "#3b82f6" : "#ef4444"}
          icon="wallet" accent="#3b82f6" delay={0} />
        <KpiCard label="Ingresos del mes"
          value={fmtMoney(k.ingresos_mes)} color={tw.ingColor}
          icon="up" accent={tw.ingColor} delay={0.04}
          delta={pct(k.ingresos_mes, k.comp.ingresos_ant)} />
        <KpiCard label="Gastos del mes"
          value={fmtMoney(k.gastos_mes)} color={tw.gasColor}
          sub="Excl. pagos de deuda" icon="down" accent={tw.gasColor} delay={0.08}
          delta={pct(k.gastos_mes, k.comp.gastos_ant)} deltaInvert />
        <KpiCard label="Tasa de ahorro"
          value={`${k.tasa_ahorro.toFixed(1)}%`}
          sub={`${fmtMoneyShort(k.ahorro_mes)} ahorrado`}
          color={k.tasa_ahorro >= 20 ? "#10b981" : k.tasa_ahorro >= 10 ? "#f59e0b" : "#ef4444"}
          icon="piggy" accent="#10b981" delay={0.12}
          delta={pct(k.tasa_ahorro, k.comp.tasa_ahorro_ant)} />
        <KpiCard label="Balance neto"
          value={fmtMoney(k.balance_mes)}
          color={balPos ? tw.ingColor : tw.gasColor} sub={balPos ? "Superávit" : "Déficit"}
          icon="trend" accent={balPos ? tw.ingColor : tw.gasColor} delay={0.16}
          delta={pct(k.balance_mes, k.comp.balance_ant)} />
        <KpiCard label="Deuda activa"
          value={fmtMoney(k.deuda_total)} color="#f59e0b"
          sub="Saldo restante" icon="debt" accent="#f59e0b" delay={0.2} />
      </div>

      {/* fila gráficas 1 + 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 16 }} className="dash-2col">
        <ChartCard title="Flujo de ingresos vs gastos" subtitle="Últimos 6 meses"
          right={<div style={{ display: "flex", gap: 14, fontSize: 11.5 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#aaa" }}><span style={{ width: 9, height: 9, borderRadius: 2, background: tw.ingColor }}></span>Ingresos</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#aaa" }}><span style={{ width: 9, height: 9, borderRadius: 2, background: tw.gasColor }}></span>Gastos</span>
          </div>}>
          <GroupedBarChart data={d.flujo_mensual} ingColor={tw.ingColor} gasColor={tw.gasColor} />
        </ChartCard>
        <ChartCard title="Gastos por categoría" subtitle="Mes actual">
          {d.gastos_por_categoria.length ? <DonutChart data={d.gastos_por_categoria} colors={tw.catColors} />
            : <EmptyState icon="budget" title="Sin gastos aún" hint="Registra transacciones para ver el desglose." />}
        </ChartCard>
      </div>

      {/* fila gráficas 3 + 4 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }} className="dash-2col">
        <ChartCard title="Tendencia de balance neto" subtitle="Últimos 12 meses">
          <AreaLineChart data={d.tendencia_balance} posColor={tw.ingColor} negColor={tw.gasColor} />
        </ChartCard>
        <ChartCard title="Estado de presupuestos" subtitle="Mes actual"
          right={<Button size="sm" variant="ghost" onClick={() => onNav("presupuestos")}>Ver todos</Button>}>
          {d.presupuestos_mes.length ? (
            <>
              {(() => {
                const fijos = d.presupuestos_mes.filter(p => p.tipo === "Fijo");
                const vars  = d.presupuestos_mes.filter(p => p.tipo !== "Fijo");
                const restaFijo = Math.max(0, fijos.reduce((s, p) => s + p.presupuesto, 0) - fijos.reduce((s, p) => s + p.gasto_actual, 0));
                const dispVar   = vars.reduce((s, p) => s + p.presupuesto, 0) - vars.reduce((s, p) => s + p.gasto_actual, 0);
                if (!fijos.length && !vars.length) return null;
                return (
                  <div style={{ display: "grid", gridTemplateColumns: fijos.length && vars.length ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 14 }}>
                    {fijos.length > 0 && (
                      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: 10.5, color: "#888", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600, marginBottom: 5 }}>Fijos · Resta de pagar</div>
                        <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--mono)", color: restaFijo > 0 ? "#f87171" : "#10b981" }}>{fmtMoney(restaFijo)}</div>
                        <div style={{ fontSize: 11, color: "#555", marginTop: 3 }}>{fijos.length} fijo{fijos.length !== 1 ? "s" : ""}</div>
                      </div>
                    )}
                    {vars.length > 0 && (
                      <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: 10.5, color: "#888", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600, marginBottom: 5 }}>Variables · Disponible</div>
                        <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--mono)", color: dispVar >= 0 ? "#10b981" : "#ef4444" }}>{fmtMoney(dispVar)}</div>
                        <div style={{ fontSize: 11, color: "#555", marginTop: 3 }}>{vars.length} variable{vars.length !== 1 ? "s" : ""}</div>
                      </div>
                    )}
                  </div>
                );
              })()}
              <HBarChart data={d.presupuestos_mes} />
            </>
          ) : <EmptyState icon="budget" title="Sin presupuestos" hint="Crea presupuestos para monitorear tus límites." />}
        </ChartCard>
      </div>

      {/* alertas */}
      <ChartCard title="Alertas rápidas" subtitle={totalAlertas ? `${totalAlertas} elemento${totalAlertas > 1 ? "s" : ""} requieren atención` : "Todo en orden"}>
        {totalAlertas === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#10b981", fontSize: 13, padding: "8px 0" }}>
            <Icon name="check" size={16} /> No hay alertas activas. Tus finanzas van por buen camino.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 22 }}>
            <div>
              <div style={{ fontSize: 11.5, color: "#888", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>Presupuestos en riesgo</div>
              {d.alertas.presupuestos_excedidos.length ? d.alertas.presupuestos_excedidos.map((p) => (
                <AlertRow key={p.id} color={STATE_COLOR[p.estado]} icon="alert" title={p.nombre}
                  detail={`${p.porcentaje.toFixed(0)}% usado · ${fmtMoney(p.gasto_actual)}`}
                  right={<Badge color={STATE_COLOR[p.estado]}>{p.estado}</Badge>} />
              )) : <div style={{ fontSize: 12.5, color: "#666", padding: "10px 0" }}>Ninguno excedido.</div>}
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: "#888", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>Deudas próximas (&lt; 30 días)</div>
              {d.alertas.deudas_proximas.length ? d.alertas.deudas_proximas.map((dd) => (
                <AlertRow key={dd.id} color="#f59e0b" icon="clock" title={dd.nombre}
                  detail={`Vence ${fmtDate(dd.fecha_pago)} · ${fmtMoney(dd.saldo_restante)}`}
                  right={<Badge color="#f59e0b">{dd.dias}d</Badge>} />
              )) : <div style={{ fontSize: 12.5, color: "#666", padding: "10px 0" }}>Sin vencimientos cercanos.</div>}
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: "#888", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>Metas críticas</div>
              {d.alertas.metas_criticas.length ? d.alertas.metas_criticas.map((m) => (
                <AlertRow key={m.id} color="#ef4444" icon="goal" title={m.nombre}
                  detail={`${m.porcentaje.toFixed(0)}% · objetivo ${fmtDate(m.fecha_objetivo)}`}
                  right={<Badge color="#ef4444">{diasRestantes(m.fecha_objetivo)}d</Badge>} />
              )) : <div style={{ fontSize: 12.5, color: "#666", padding: "10px 0" }}>Ninguna en riesgo.</div>}
            </div>
          </div>
        )}
      </ChartCard>
    </div>
  );
}

Object.assign(window, { Dashboard, ChartCard, KpiCard, AlertRow });
