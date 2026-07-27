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
  { id: "prestamos", label: "Préstamos", icon: "lend" },
  { id: "metas", label: "Metas", icon: "goal" },
  { id: "cuentas", label: "Cuentas", icon: "wallet" },
  { id: "suscripciones", label: "Suscripciones", icon: "subscription" },
  { id: "config", label: "Configuración", icon: "settings" },
];

/* --- móvil: tabs principales de la barra inferior; el resto va al sheet "Más" --- */
const BOTTOM_MAIN = TABS.slice(0, 4);
const BOTTOM_MORE = TABS.slice(4);

function useIsPhone() {
  const [is, setIs] = React.useState(() => window.matchMedia("(max-width: 640px)").matches);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const h = (e) => setIs(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", h);
    else mq.addListener(h);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", h);
      else mq.removeListener(h);
    };
  }, []);
  return is;
}

function BottomNavItem({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick}
      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
        padding: "6px 2px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit",
        color: active ? "#10b981" : "#888", transition: "color .15s" }}>
      <Icon name={icon} size={20} strokeWidth={active ? 2.1 : 1.8} />
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 500, letterSpacing: "0.01em" }}>{label}</span>
    </button>
  );
}

function BottomNav({ tab, onNav, onMore, moreOpen }) {
  const moreActive = BOTTOM_MORE.some((tb) => tb.id === tab);
  return (
    <nav className="bottomnav"
      style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60,
        background: "rgba(10,10,10,0.92)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderTop: "1px solid var(--border)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div style={{ display: "flex", alignItems: "stretch", height: 58 }}>
        {BOTTOM_MAIN.map((tb) => (
          <BottomNavItem key={tb.id} active={tab === tb.id} icon={tb.icon} label={tb.label} onClick={() => onNav(tb.id)} />
        ))}
        <BottomNavItem active={moreActive || moreOpen} icon="menu" label="Más" onClick={onMore} />
      </div>
    </nav>
  );
}

function BottomSheet({ tab, onNav, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.55)" }} />
      <div className="toast-in"
        style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 71,
          background: "#141414", border: "1px solid var(--border-strong)", borderBottom: "none",
          borderRadius: "16px 16px 0 0", padding: "10px 12px calc(12px + env(safe-area-inset-bottom))" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)", margin: "2px auto 10px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {BOTTOM_MORE.map((tb) => (
            <button key={tb.id} onClick={() => onNav(tb.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 13px", borderRadius: 10,
                border: "none", cursor: "pointer", fontSize: 14, fontFamily: "inherit", textAlign: "left",
                background: tab === tb.id ? "rgba(255,255,255,0.07)" : "transparent",
                color: tab === tb.id ? "#fff" : "#aaa" }}>
              <Icon name={tb.icon} size={17} />{tb.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

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
  const [sheet, setSheet] = React.useState(false);
  const isPhone = useIsPhone();

  React.useEffect(() => {
    const h = () => setTab((location.hash || "#dashboard").slice(1));
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  const nav = (id) => { location.hash = id; setTab(id); setMenu(false); setSheet(false); };

  // FAB → abrir alta de transacción; si Transacciones aún no montó,
  // esperar doble rAF + respaldo con timeout (el listener es idempotente)
  const openNewTx = () => {
    setSheet(false);
    const fire = () => window.dispatchEvent(new Event("fin:new-tx"));
    if (tab === "transacciones") { fire(); return; }
    nav("transacciones");
    requestAnimationFrame(() => requestAnimationFrame(fire));
    setTimeout(fire, 150);
  };

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
    prestamos: <Prestamos />,
    metas: <Metas />,
    cuentas: <Cuentas />,
    suscripciones: <Suscripciones />,
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

      {/* navegación inferior móvil + FAB nueva transacción */}
      {isPhone && (
        <>
          <BottomNav tab={tab} onNav={nav} onMore={() => setSheet((s) => !s)} moreOpen={sheet} />
          {sheet && <BottomSheet tab={tab} onNav={nav} onClose={() => setSheet(false)} />}
          <button className="fab" onClick={openNewTx} aria-label="Nueva transacción"
            style={{ position: "fixed", right: 16, bottom: "calc(74px + env(safe-area-inset-bottom))", zIndex: 65,
              width: 54, height: 54, borderRadius: "50%", border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #10b981, #059669)", color: "#04130d",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 20px rgba(16,185,129,0.35)" }}>
            <Icon name="plus" size={24} strokeWidth={2.2} />
          </button>
        </>
      )}

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
