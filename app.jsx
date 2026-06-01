/* app.jsx — shell: top tabs, routing, tweaks */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "ingColor": "#10b981",
  "gasColor": "#ef4444",
  "infoColor": "#3b82f6",
  "font": "Geist",
  "chartPalette": ["#10b981", "#ef4444"]
}/*EDITMODE-END*/;

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "transacciones", label: "Transacciones", icon: "list" },
  { id: "presupuestos", label: "Presupuestos", icon: "budget" },
  { id: "deudas", label: "Deudas", icon: "debt" },
  { id: "metas", label: "Metas", icon: "goal" },
  { id: "cuentas", label: "Cuentas", icon: "wallet" },
  { id: "config", label: "Configuración", icon: "settings" },
];

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#04130d", fontFamily: "var(--mono)" }}>F</div>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: "-0.01em" }}>Finanzas</div>
        <div style={{ fontSize: 10.5, color: "#777" }}>Leonardo · MXN</div>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = React.useState(() => (location.hash || "#dashboard").slice(1));
  const [menu, setMenu] = React.useState(false);
  const toast = useToast();

  React.useEffect(() => {
    const h = () => setTab((location.hash || "#dashboard").slice(1));
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  const nav = (id) => { location.hash = id; setTab(id); setMenu(false); };

  // aplicar font + palette a variables CSS
  React.useEffect(() => {
    document.documentElement.style.setProperty("--font", `'${t.font}', system-ui, sans-serif`);
  }, [t.font]);

  const tw = { ingColor: t.ingColor, gasColor: t.gasColor, infoColor: t.infoColor, catColors: {} };

  const PAGES = {
    dashboard: <Dashboard tw={tw} onNav={nav} />,
    transacciones: <Transacciones />,
    presupuestos: <Presupuestos />,
    deudas: <Deudas />,
    metas: <Metas />,
    cuentas: <Cuentas />,
    config: <Config />,
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font)" }}>
      {/* top bar */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,10,10,0.82)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <Logo />
          {/* tabs desktop */}
          <nav className="tabs-desktop" style={{ display: "flex", gap: 2 }}>
            {TABS.map((tb) => (
              <button key={tb.id} onClick={() => nav(tb.id)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 500, fontFamily: "inherit", transition: "all .15s",
                  background: tab === tb.id ? "rgba(255,255,255,0.07)" : "transparent",
                  color: tab === tb.id ? "#fff" : "#999" }}
                onMouseEnter={(e) => { if (tab !== tb.id) e.currentTarget.style.color = "#ccc"; }}
                onMouseLeave={(e) => { if (tab !== tb.id) e.currentTarget.style.color = "#999"; }}>
                <Icon name={tb.icon} size={15} />{tb.label}
              </button>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="ibtn" title="Restablecer datos de ejemplo" onClick={() => { window.FinanzasStore.reset(); toast("Datos restablecidos", "info"); }}><Icon name="refresh" size={16} /></button>
            <button className="tabs-mobile ibtn" onClick={() => setMenu((m) => !m)}><Icon name="menu" size={18} /></button>
          </div>
        </div>
        {/* tabs mobile */}
        {menu && (
          <nav className="tabs-mobile" style={{ borderTop: "1px solid var(--border)", padding: 8, display: "flex", flexDirection: "column", gap: 2 }}>
            {TABS.map((tb) => (
              <button key={tb.id} onClick={() => nav(tb.id)}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 14, fontFamily: "inherit", background: tab === tb.id ? "rgba(255,255,255,0.07)" : "transparent", color: tab === tb.id ? "#fff" : "#aaa", textAlign: "left" }}>
                <Icon name={tb.icon} size={16} />{tb.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "26px 20px 80px" }}>
        <div key={tab} className="page-fade">{PAGES[tab] || PAGES.dashboard}</div>
      </main>

      {/* Tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Colores de gráficas" />
        <TweakColor label="Ingresos" value={t.ingColor} options={["#10b981", "#22c55e", "#3b82f6", "#14b8a6"]} onChange={(v) => setTweak("ingColor", v)} />
        <TweakColor label="Gastos" value={t.gasColor} options={["#ef4444", "#f97316", "#f43f5e", "#e11d48"]} onChange={(v) => setTweak("gasColor", v)} />
        <TweakColor label="Info / neutral" value={t.infoColor} options={["#3b82f6", "#6366f1", "#8b5cf6", "#06b6d4"]} onChange={(v) => setTweak("infoColor", v)} />
        <TweakSection label="Tipografía del sistema" />
        <TweakSelect label="Fuente" value={t.font} options={["Geist", "Space Grotesk", "IBM Plex Sans", "Sora", "Instrument Sans"]} onChange={(v) => setTweak("font", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ToastProvider><App /></ToastProvider>
);
