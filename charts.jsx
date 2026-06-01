/* charts.jsx — hand-built animated SVG charts (exported to window) */

function useWidth() {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(640);
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((e) => setW(e[0].contentRect.width));
    ro.observe(ref.current);
    setW(ref.current.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

const AXIS = "rgba(255,255,255,0.06)";
const TICK = "rgba(255,255,255,0.40)";

/* ---------- 1. Barras agrupadas: ingresos vs gastos ---------- */
function GroupedBarChart({ data, ingColor = "#3b82f6", gasColor = "#ef4444", height = 240 }) {
  const [ref, w] = useWidth();
  const on = useMountAnim([data, w]);
  const padL = 44, padR = 12, padT = 12, padB = 26;
  const iw = Math.max(10, w - padL - padR), ih = height - padT - padB;
  const max = Math.max(1, ...data.map((d) => Math.max(d.ingresos, d.gastos))) * 1.1;
  const y = (v) => padT + ih - (v / max) * ih;
  const groupW = iw / data.length;
  const barW = Math.min(26, groupW * 0.30);
  const ticks = 4;
  const [hover, setHover] = React.useState(null);

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      <svg width="100%" height={height} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="gbIng" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ingColor} stopOpacity="0.95" /><stop offset="100%" stopColor={ingColor} stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="gbGas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gasColor} stopOpacity="0.95" /><stop offset="100%" stopColor={gasColor} stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const v = (max / ticks) * i, yy = y(v);
          return (<g key={i}>
            <line x1={padL} y1={yy} x2={w - padR} y2={yy} stroke={AXIS} />
            <text x={padL - 8} y={yy + 3} textAnchor="end" fontSize="10" fill={TICK} fontFamily="var(--mono)">{fmtMoneyShort(v)}</text>
          </g>);
        })}
        {data.map((d, i) => {
          const gx = padL + groupW * i + groupW / 2;
          const hI = (d.ingresos / max) * ih;
          const hG = (d.gastos / max) * ih;
          const delay = `${0.05 * i}s`;
          return (<g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                      style={{ cursor: "pointer", opacity: hover === null || hover === i ? 1 : 0.45, transition: "opacity .2s" }}>
            <rect className="bar-grow" x={gx - barW - 3} y={padT + ih - hI} width={barW} height={hI} rx="3" fill="url(#gbIng)" style={{ animationDelay: delay }} />
            <rect className="bar-grow" x={gx + 3} y={padT + ih - hG} width={barW} height={hG} rx="3" fill="url(#gbGas)" style={{ animationDelay: delay }} />
            <text x={gx} y={height - 8} textAnchor="middle" fontSize="10.5" fill={TICK} fontFamily="var(--mono)">{d.label}</text>
          </g>);
        })}
      </svg>
      {hover !== null && (() => {
        const gx = padL + groupW * hover + groupW / 2;
        return (<div style={{ position: "absolute", left: Math.min(w - 130, Math.max(0, gx - 65)), top: 4, width: 130, pointerEvents: "none",
          background: "#161616", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "8px 10px", fontSize: 11, boxShadow: "0 8px 24px rgba(0,0,0,.5)" }}>
          <div style={{ color: "#888", marginBottom: 4, fontFamily: "var(--mono)" }}>{data[hover].label}</div>
          <div style={{ display: "flex", justifyContent: "space-between", color: ingColor }}><span>Ingresos</span><b style={{ fontFamily: "var(--mono)" }}>{fmtMoneyShort(data[hover].ingresos)}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", color: gasColor }}><span>Gastos</span><b style={{ fontFamily: "var(--mono)" }}>{fmtMoneyShort(data[hover].gastos)}</b></div>
        </div>);
      })()}
    </div>
  );
}

/* ---------- 2. Donut: gastos por categoría ---------- */
function DonutChart({ data, colors = {}, size = 220, total }) {
  const [hover, setHover] = React.useState(null);
  const cx = size / 2, cy = size / 2, r = size / 2 - 8, rin = r * 0.62;
  const sum = total ?? data.reduce((s, d) => s + d.total, 0);
  let acc = -Math.PI / 2;
  const arcs = data.map((d) => {
    const frac = sum > 0 ? d.total / sum : 0;
    const a0 = acc, a1 = acc + frac * Math.PI * 2; acc = a1;
    return { ...d, a0, a1, frac, color: colors[d.categoria] || CAT_COLORS[d.categoria] || "#64748b" };
  });
  const arcPath = (a0, a1) => {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (ang, rr) => [cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr];
    const [x0, y0] = p(a0, r), [x1, y1] = p(a1, r), [x2, y2] = p(a1, rin), [x3, y3] = p(a0, rin);
    return `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${rin},${rin} 0 ${large} 0 ${x3},${y3} Z`;
  };
  const hv = hover !== null ? arcs[hover] : null;
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} className="pop-in">
          {arcs.map((a, i) => (
            <path key={i} d={arcPath(a.a0, a.a1)} fill={a.color}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              style={{ opacity: hover === null || hover === i ? 1 : 0.4, transition: "opacity .2s", cursor: "pointer",
                transform: hover === i ? "scale(1.03)" : "scale(1)", transformOrigin: "center" }} />
          ))}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ fontSize: 10, color: "#777", textTransform: "uppercase", letterSpacing: ".06em" }}>{hv ? hv.categoria : "Total mes"}</div>
          <div style={{ fontSize: 19, fontWeight: 600, fontFamily: "var(--mono)", marginTop: 2 }}>{fmtMoneyShort(hv ? hv.total : sum)}</div>
          {hv && <div style={{ fontSize: 11, color: "#999", fontFamily: "var(--mono)" }}>{hv.porcentaje.toFixed(1)}%</div>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 150 }}>
        {arcs.map((a, i) => (
          <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer", opacity: hover === null || hover === i ? 1 : 0.5, transition: "opacity .15s" }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: a.color, flexShrink: 0 }}></span>
            <span style={{ flex: 1, color: "#ccc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.categoria}</span>
            <span style={{ fontFamily: "var(--mono)", color: "#888" }}>{a.frac ? (a.frac * 100).toFixed(0) : 0}%</span>
            <span style={{ fontFamily: "var(--mono)", color: "#eee", minWidth: 56, textAlign: "right" }}>{fmtMoneyShort(a.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 3. Línea de área: tendencia de balance ---------- */
function AreaLineChart({ data, posColor = "#10b981", negColor = "#ef4444", height = 220 }) {
  const [ref, w] = useWidth();
  const on = useMountAnim([data, w]);
  const padL = 44, padR = 14, padT = 14, padB = 26;
  const iw = Math.max(10, w - padL - padR), ih = height - padT - padB;
  const vals = data.map((d) => d.balance);
  const max = Math.max(1, ...vals), min = Math.min(0, ...vals);
  const range = (max - min) || 1;
  const x = (i) => padL + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => padT + ih - ((v - min) / range) * ih;
  const y0 = y(0);
  const pts = data.map((d, i) => [x(i), y(d.balance)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0] + "," + p[1]).join(" ");
  const area = `${line} L${x(data.length - 1)},${y0} L${x(0)},${y0} Z`;
  const lastPos = vals[vals.length - 1] >= 0;
  const [hover, setHover] = React.useState(null);
  const pathRef = React.useRef(null);
  const [len, setLen] = React.useState(0);
  React.useEffect(() => { if (pathRef.current) setLen(pathRef.current.getTotalLength()); }, [w, data]);

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}
         onMouseMove={(e) => {
           const rect = e.currentTarget.getBoundingClientRect();
           const mx = e.clientX - rect.left;
           let best = 0, bd = 1e9;
           data.forEach((d, i) => { const dd = Math.abs(x(i) - mx); if (dd < bd) { bd = dd; best = i; } });
           setHover(best);
         }} onMouseLeave={() => setHover(null)}>
      <svg width="100%" height={height} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="alFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lastPos ? posColor : negColor} stopOpacity="0.38" />
            <stop offset="100%" stopColor={lastPos ? posColor : negColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: 4 }).map((_, i) => {
          const v = min + (range / 3) * i, yy = y(v);
          return (<g key={i}>
            <line x1={padL} y1={yy} x2={w - padR} y2={yy} stroke={AXIS} />
            <text x={padL - 8} y={yy + 3} textAnchor="end" fontSize="10" fill={TICK} fontFamily="var(--mono)">{fmtMoneyShort(v)}</text>
          </g>);
        })}
        <line x1={padL} y1={y0} x2={w - padR} y2={y0} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />
        <path d={area} className="area-fade" fill="url(#alFill)" />
        <path ref={pathRef} d={line} className="line-draw" fill="none" stroke={lastPos ? posColor : negColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: len, strokeDashoffset: 0, "--len": len + "px" }} />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 4.5 : 0} fill={data[i].balance >= 0 ? posColor : negColor}
            stroke="#0a0a0a" strokeWidth="2" style={{ transition: "r .15s" }} />
        ))}
        {data.map((d, i) => (i % 2 === 0 || data.length <= 7) && (
          <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize="9.5" fill={TICK} fontFamily="var(--mono)">{d.label}</text>
        ))}
      </svg>
      {hover !== null && (
        <div style={{ position: "absolute", left: Math.min(w - 120, Math.max(0, x(hover) - 60)), top: 2, width: 120, pointerEvents: "none",
          background: "#161616", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "6px 10px", fontSize: 11, boxShadow: "0 8px 24px rgba(0,0,0,.5)" }}>
          <div style={{ color: "#888", fontFamily: "var(--mono)", marginBottom: 2 }}>{data[hover].label}</div>
          <div style={{ fontFamily: "var(--mono)", fontWeight: 600, color: data[hover].balance >= 0 ? posColor : negColor }}>{fmtMoney(data[hover].balance)}</div>
        </div>
      )}
    </div>
  );
}

/* ---------- 4. Barras horizontales: presupuestos ---------- */
function HBarChart({ data, height }) {
  const rowH = 34;
  if (!data.length) return <div style={{ color: "#666", fontSize: 13, padding: 20 }}>Sin presupuestos este mes.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((p, i) => {
        const color = STATE_COLOR[p.estado] || "#10b981";
        const pct = Math.min(100, p.porcentaje);
        return (
          <div key={p.id ?? i}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: "#ddd" }}>{p.nombre}</span>
              <span style={{ fontFamily: "var(--mono)", color: "#999" }}>
                {fmtMoneyShort(p.gasto_actual)} <span style={{ color: "#555" }}>/ {fmtMoneyShort(p.presupuesto)}</span>
                <span style={{ color, marginLeft: 8, fontWeight: 600 }}>{p.porcentaje.toFixed(0)}%</span>
              </span>
            </div>
            <div style={{ height: 9, borderRadius: 6, background: "rgba(255,255,255,0.05)", overflow: "hidden", position: "relative" }}>
              <div className="barh-grow" style={{ height: "100%", borderRadius: 6, width: pct + "%", background: `linear-gradient(90deg, ${color}aa, ${color})`, animationDelay: `${0.05 * i}s` }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- comparativo metas (barras horizontales con dos tonos) ---------- */
function MetaBars({ data, color = "#10b981" }) {
  if (!data.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {data.map((m, i) => {
        const pct = Math.min(100, m.porcentaje);
        return (
          <div key={m.id}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: "#ddd" }}>{m.nombre}</span>
              <span style={{ fontFamily: "var(--mono)", color: "#999" }}>{fmtMoneyShort(m.monto_actual)} <span style={{ color: "#555" }}>/ {fmtMoneyShort(m.monto_objetivo)}</span></span>
            </div>
            <div style={{ height: 9, borderRadius: 6, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <div className="barh-grow" style={{ height: "100%", borderRadius: 6, width: pct + "%", background: `linear-gradient(90deg, ${color}88, ${color})`, animationDelay: `${0.05 * i}s` }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- anillo de progreso (metas) ---------- */
function ProgressRing({ pct, size = 96, stroke = 9, color = "#10b981", children }) {
  const on = useMountAnim([pct]);
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const p = Math.min(100, pct);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          className="ring-fill" strokeDasharray={c} strokeDashoffset={c - (p / 100) * c} style={{ "--c": c + "px" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

Object.assign(window, { GroupedBarChart, DonutChart, AreaLineChart, HBarChart, MetaBars, ProgressRing });
