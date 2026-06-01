/* ============================================================
   data.js — seed generator + in-memory store (localStorage)
   Simulates the FastAPI/SQLite backend for the prototype.
   Exposes window.FinanzasStore
   ============================================================ */
(function () {
  "use strict";

  const STORAGE_KEY = "finanzas_store_v2";
  const HOY = new Date(2026, 4, 31); // 31 may 2026 (mes 0-indexed: 4 = mayo)
  const MES_ACTUAL = HOY.getMonth() + 1; // 5
  const ANIO_ACTUAL = HOY.getFullYear(); // 2026

  const CATEGORIAS = [
    "Alimentación", "Transporte", "Entretenimiento", "Salud", "Ropa",
    "Educación", "Servicios", "Vivienda", "Ahorro", "Sueldo", "Freelance", "Otros",
  ];
  const TIPOS = ["Gasto", "Ingreso", "Pago de deuda", "Ahorro", "Transferencia"];

  // ---- pseudo-random (seeded) so data is stable across reloads on first seed ----
  let _seed = 20260531;
  function rnd() { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; }
  function rint(a, b) { return Math.floor(a + rnd() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function money(n) { return Math.round(n * 100) / 100; }

  function ymd(y, m, d) {
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // -------------------- SEED --------------------
  function seed() {
    let idc = 1;
    const nid = () => idc++;

    // -------- Cuentas --------
    const cuentas = [
      { id: nid(), nombre: "BBVA Nómina", tipo: "Débito", banco: "BBVA", saldo: 0, activa: true, notas: "Cuenta principal de nómina" },
      { id: nid(), nombre: "Nu Crédito", tipo: "Crédito", banco: "Nu", saldo: 0, activa: true, notas: "Tarjeta de crédito principal" },
      { id: nid(), nombre: "Efectivo", tipo: "Efectivo", banco: "—", saldo: 3200, activa: true, notas: "Cartera" },
      { id: nid(), nombre: "GBM Inversión", tipo: "Inversión", banco: "GBM", saldo: 48500, activa: true, notas: "Portafolio CETES + ETFs" },
      { id: nid(), nombre: "Klar Ahorro", tipo: "Débito", banco: "Klar", saldo: 0, activa: true, notas: "Cuenta de ahorro 12% anual" },
      { id: nid(), nombre: "Santander (cerrada)", tipo: "Débito", banco: "Santander", saldo: 0, activa: false, notas: "Cuenta antigua" },
    ];
    const cBBVA = cuentas[0].id, cNu = cuentas[1].id, cEfectivo = cuentas[2].id, cKlar = cuentas[4].id;

    // -------- Deudas --------
    const deudas = [
      { id: nid(), nombre: "Tarjeta Nu", monto_total: 32000, pagado: 0, tasa_interes: 45.9, fecha_pago: "2026-12-15", notas: "Compras diferidas a meses" },
      { id: nid(), nombre: "Préstamo automotriz", monto_total: 185000, pagado: 0, tasa_interes: 13.5, fecha_pago: "2028-06-01", notas: "Mazda 3 — 48 mensualidades" },
      { id: nid(), nombre: "Crédito educativo", monto_total: 60000, pagado: 0, tasa_interes: 9.0, fecha_pago: "2026-06-20", notas: "Diplomado en datos" },
      { id: nid(), nombre: "Préstamo familiar", monto_total: 15000, pagado: 0, tasa_interes: 0, fecha_pago: "2026-08-30", notas: "Préstamo de mi hermana" },
    ];
    const dNu = deudas[0].id, dAuto = deudas[1].id, dEdu = deudas[2].id, dFam = deudas[3].id;

    // -------- Metas --------
    const metas = [
      { id: nid(), nombre: "Fondo de emergencia", tipo: "Emergencia", monto_objetivo: 90000, monto_actual: 61500, fecha_objetivo: "2026-12-31", descripcion: "6 meses de gastos fijos" },
      { id: nid(), nombre: "Viaje a Japón", tipo: "Viaje", monto_objetivo: 75000, monto_actual: 22000, fecha_objetivo: "2027-04-01", descripcion: "Hanami 2027, 2 semanas" },
      { id: nid(), nombre: "MacBook Pro", tipo: "Compra", monto_objetivo: 48000, monto_actual: 41000, fecha_objetivo: "2026-07-15", descripcion: "Para trabajo freelance" },
      { id: nid(), nombre: "Enganche departamento", tipo: "Ahorro", monto_objetivo: 400000, monto_actual: 92000, fecha_objetivo: "2028-01-01", descripcion: "20% de enganche" },
      { id: nid(), nombre: "Inversión CETES", tipo: "Inversión", monto_objetivo: 50000, monto_actual: 48500, fecha_objetivo: "2026-06-30", descripcion: "Reinversión a 28 días" },
    ];

    // -------- Transacciones (12 meses) --------
    const transacciones = [];
    const addTx = (o) => {
      const [y, m, d] = o.fecha.split("-").map(Number);
      transacciones.push({ id: nid(), notas: "", cuenta: null, deuda: null, ...o, mes: m, anio: y });
    };

    // recorrer 12 meses hacia atrás desde mayo 2026
    for (let back = 11; back >= 0; back--) {
      let y = ANIO_ACTUAL, m = MES_ACTUAL - back;
      while (m <= 0) { m += 12; y -= 1; }
      const diasMes = new Date(y, m, 0).getDate();
      const esMesActual = (y === ANIO_ACTUAL && m === MES_ACTUAL);
      const topDia = esMesActual ? HOY.getDate() : diasMes;

      // Sueldo (día 1 y 16, quincenal)
      addTx({ nombre: "Nómina quincena 1", categoria: "Sueldo", monto: 14200, fecha: ymd(y, m, 1), tipo: "Ingreso", cuenta: cBBVA });
      if (topDia >= 16)
        addTx({ nombre: "Nómina quincena 2", categoria: "Sueldo", monto: 14200, fecha: ymd(y, m, 16), tipo: "Ingreso", cuenta: cBBVA });

      // Freelance (aleatorio, ~55% de los meses)
      if (rnd() < 0.55 && topDia >= 10)
        addTx({ nombre: pick(["Landing page cliente", "Dashboard analítico", "Consultoría datos", "App móvil MVP"]), categoria: "Freelance", monto: money(rint(6, 22) * 1000), fecha: ymd(y, m, rint(8, Math.min(24, topDia))), tipo: "Ingreso", cuenta: cBBVA });

      // Vivienda — renta día 3
      if (topDia >= 3)
        addTx({ nombre: "Renta departamento", categoria: "Vivienda", monto: 9500, fecha: ymd(y, m, 3), tipo: "Gasto", cuenta: cBBVA });

      // Servicios
      if (topDia >= 8) addTx({ nombre: "CFE (luz)", categoria: "Servicios", monto: money(rint(380, 920)), fecha: ymd(y, m, rint(6, Math.min(8, topDia))), tipo: "Gasto", cuenta: cBBVA });
      if (topDia >= 10) addTx({ nombre: "Internet Totalplay", categoria: "Servicios", monto: 599, fecha: ymd(y, m, 10), tipo: "Gasto", cuenta: cBBVA });
      if (topDia >= 12) addTx({ nombre: "Telcel plan", categoria: "Servicios", monto: 499, fecha: ymd(y, m, 12), tipo: "Gasto", cuenta: cBBVA });
      if (topDia >= 5) addTx({ nombre: pick(["Spotify", "Netflix", "iCloud"]), categoria: "Entretenimiento", monto: pick([115, 219, 49]), fecha: ymd(y, m, 5), tipo: "Gasto", cuenta: cNu });

      // Alimentación — varias compras
      const nComida = rint(5, 9);
      for (let i = 0; i < nComida; i++) {
        const dd = rint(1, topDia);
        addTx({ nombre: pick(["Súper Walmart", "La Comer", "Mercado local", "Oxxo", "Restaurante", "Cafetería", "Uber Eats"]), categoria: "Alimentación", monto: money(rint(120, 1400)), fecha: ymd(y, m, dd), tipo: "Gasto", cuenta: pick([cBBVA, cNu, cEfectivo]) });
      }

      // Transporte
      const nTrans = rint(3, 7);
      for (let i = 0; i < nTrans; i++) {
        const dd = rint(1, topDia);
        addTx({ nombre: pick(["Gasolina", "Uber", "Metro", "Caseta", "Estacionamiento"]), categoria: "Transporte", monto: money(rint(35, 850)), fecha: ymd(y, m, dd), tipo: "Gasto", cuenta: pick([cBBVA, cEfectivo]) });
      }

      // Entretenimiento ocasional
      if (rnd() < 0.7) addTx({ nombre: pick(["Cine", "Concierto", "Bar con amigos", "Videojuego", "Libro"]), categoria: "Entretenimiento", monto: money(rint(180, 1600)), fecha: ymd(y, m, rint(1, topDia)), tipo: "Gasto", cuenta: pick([cNu, cEfectivo]) });

      // Salud
      if (rnd() < 0.4) addTx({ nombre: pick(["Farmacia", "Consulta médica", "Dentista", "Gym mensualidad"]), categoria: "Salud", monto: money(rint(200, 1800)), fecha: ymd(y, m, rint(1, topDia)), tipo: "Gasto", cuenta: pick([cBBVA, cNu]) });

      // Ropa
      if (rnd() < 0.35) addTx({ nombre: pick(["Zara", "Nike", "Tenis", "Chamarra"]), categoria: "Ropa", monto: money(rint(450, 2600)), fecha: ymd(y, m, rint(1, topDia)), tipo: "Gasto", cuenta: cNu });

      // Educación
      if (rnd() < 0.3) addTx({ nombre: pick(["Curso Udemy", "Libro técnico", "Suscripción Platzi"]), categoria: "Educación", monto: money(rint(200, 1500)), fecha: ymd(y, m, rint(1, topDia)), tipo: "Gasto", cuenta: cNu });

      // Pagos de deuda
      if (topDia >= 18) {
        addTx({ nombre: "Pago Tarjeta Nu", categoria: "Otros", monto: money(rint(1500, 3500)), fecha: ymd(y, m, 18), tipo: "Pago de deuda", cuenta: cBBVA, deuda: dNu });
        addTx({ nombre: "Mensualidad auto", categoria: "Transporte", monto: 4650, fecha: ymd(y, m, 18), tipo: "Pago de deuda", cuenta: cBBVA, deuda: dAuto });
      }
      if (topDia >= 20 && rnd() < 0.7) addTx({ nombre: "Pago crédito educativo", categoria: "Educación", monto: money(rint(2000, 4000)), fecha: ymd(y, m, 20), tipo: "Pago de deuda", cuenta: cBBVA, deuda: dEdu });

      // Ahorro / Transferencia a metas
      if (topDia >= 17) addTx({ nombre: "Aportación fondo emergencia", categoria: "Ahorro", monto: money(rint(2500, 5000)), fecha: ymd(y, m, 17), tipo: "Ahorro", cuenta: cKlar });
      if (topDia >= 25 && rnd() < 0.8) addTx({ nombre: "Aportación inversión", categoria: "Ahorro", monto: money(rint(2000, 4000)), fecha: ymd(y, m, 25), tipo: "Ahorro", cuenta: cKlar });
    }

    // ---- recomputar pagado en deudas a partir de pagos de deuda ----
    deudas.forEach((d) => {
      const pagos = transacciones.filter((t) => t.tipo === "Pago de deuda" && t.deuda === d.id);
      d.pagado = money(pagos.reduce((s, t) => s + t.monto, 0));
      // tope: no más de monto_total
      if (d.pagado > d.monto_total) d.pagado = d.monto_total;
    });
    // ajustes para variedad de estados
    deudas[3].pagado = 15000; // préstamo familiar liquidado
    deudas[2].pagado = Math.max(deudas[2].pagado, 48000); // educativo casi listo

    // ---- recomputar saldos de cuentas a partir de transacciones ----
    // saldos base + flujo neto registrado
    const baseSaldos = { [cBBVA]: 18500, [cNu]: -8200, [cKlar]: 78000 };
    cuentas.forEach((c) => {
      if (baseSaldos[c.id] !== undefined) c.saldo = baseSaldos[c.id];
    });

    // -------- Presupuestos (mes actual + anterior) --------
    const presupuestos = [];
    const presupBase = [
      ["Comida del mes", "Alimentación", 9000],
      ["Transporte", "Transporte", 3500],
      ["Entretenimiento", "Entretenimiento", 2000],
      ["Servicios fijos", "Servicios", 2200],
      ["Salud", "Salud", 1500],
      ["Ropa", "Ropa", 1500],
      ["Educación", "Educación", 1200],
    ];
    [[MES_ACTUAL, ANIO_ACTUAL], [MES_ACTUAL - 1 <= 0 ? 12 : MES_ACTUAL - 1, MES_ACTUAL - 1 <= 0 ? ANIO_ACTUAL - 1 : ANIO_ACTUAL]].forEach(([mm, yy]) => {
      presupBase.forEach(([nombre, cat, limite]) => {
        presupuestos.push({ id: nid(), nombre, categoria: cat, mes: mm, anio: yy, presupuesto: limite });
      });
    });

    return { cuentas, deudas, metas, transacciones, presupuestos, _nextId: idc };
  }

  // -------------------- STORE --------------------
  let DB = null;

  // Carga desde servidor con XHR síncrono (funciona solo en localhost, sin bloquear UI)
  function loadFromServer() {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "/api/db", false); // false = síncrono
      xhr.send(null);
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        if (data && data._nextId) return data;
      }
    } catch (e) {}
    return null;
  }

  function load() {
    // 1. Servidor → persiste aunque limpies caché o uses otro navegador
    const fromServer = loadFromServer();
    if (fromServer) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fromServer)); } catch (e) {}
      return fromServer;
    }
    // 2. localStorage como respaldo
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    // 3. Primera vez: store vacío (sin datos demo)
    const fresh = emptyStore();
    save(fresh);
    return fresh;
  }

  function save(db) {
    DB = db || DB;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); } catch (e) {}
    // Persistir en servidor (no bloquea la UI)
    try {
      fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DB),
      }).catch(() => {});
    } catch (e) {}
    notify();
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    DB = emptyStore();
    save(DB);
  }
  function nextId() { return DB._nextId++; }

  function emptyStore() {
    return {
      _nextId: 1,
      categorias: [...CATEGORIAS],
      cuentas: [],
      deudas: [],
      metas: [],
      transacciones: [],
      presupuestos: [],
    };
  }

  // ---- subscribers ----
  const subs = new Set();
  function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
  function notify() { subs.forEach((fn) => fn()); }

  // inicializar después de declarar subs/notify (evita TDZ)
  DB = load();

  // -------------------- DERIVADOS --------------------
  function estadoPresupuesto(pct) {
    if (pct >= 100) return "Excedido";
    if (pct >= 90) return "Límite";
    if (pct >= 70) return "Precaución";
    return "OK";
  }
  function estadoDeuda(pagado, total) {
    const p = total > 0 ? (pagado / total) * 100 : 0;
    if (p >= 100) return "Liquidada";
    if (p >= 75) return "Casi lista";
    if (p >= 50) return "Mitad";
    if (p >= 25) return "Avanzando";
    return "Pendiente";
  }
  function estadoMeta(pct) {
    if (pct >= 100) return "Completada";
    if (pct >= 75) return "Casi lista";
    if (pct >= 50) return "A mitad";
    if (pct >= 25) return "En camino";
    return "Iniciando";
  }

  // gasto_actual de un presupuesto = suma de transacciones tipo Gasto de su categoría ese mes/año
  function gastoPresupuesto(p) {
    return money(DB.transacciones
      .filter((t) => t.tipo === "Gasto" && t.categoria === p.categoria && t.mes === p.mes && t.anio === p.anio)
      .reduce((s, t) => s + t.monto, 0));
  }

  function presupuestoConDerivados(p) {
    const gasto_actual = gastoPresupuesto(p);
    const porcentaje = p.presupuesto > 0 ? money((gasto_actual / p.presupuesto) * 100) : 0;
    return { ...p, gasto_actual, porcentaje, estado: estadoPresupuesto(porcentaje) };
  }
  function deudaConDerivados(d) {
    const saldo_restante = money(Math.max(0, d.monto_total - d.pagado));
    const porcentaje = d.monto_total > 0 ? money((d.pagado / d.monto_total) * 100) : 0;
    return { ...d, saldo_restante, porcentaje, estado: estadoDeuda(d.pagado, d.monto_total) };
  }
  function metaConDerivados(m) {
    const porcentaje = m.monto_objetivo > 0 ? money((m.monto_actual / m.monto_objetivo) * 100) : 0;
    const faltante = money(Math.max(0, m.monto_objetivo - m.monto_actual));
    return { ...m, porcentaje, faltante, estado: estadoMeta(porcentaje) };
  }

  // -------------------- API SELECTORS --------------------
  const nombreMes = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  function getCuentas() { return DB.cuentas.slice(); }
  function getDeudas() { return DB.deudas.map(deudaConDerivados); }
  function getMetas() { return DB.metas.map(metaConDerivados); }

  function getTransacciones(filtros = {}) {
    let list = DB.transacciones.slice();
    if (filtros.mes) list = list.filter((t) => t.mes === +filtros.mes);
    if (filtros.anio) list = list.filter((t) => t.anio === +filtros.anio);
    if (filtros.tipo && filtros.tipo !== "Todos") list = list.filter((t) => t.tipo === filtros.tipo);
    if (filtros.categoria && filtros.categoria !== "Todas") list = list.filter((t) => t.categoria === filtros.categoria);
    if (filtros.q) {
      const q = filtros.q.toLowerCase();
      list = list.filter((t) => t.nombre.toLowerCase().includes(q) || (t.notas || "").toLowerCase().includes(q));
    }
    return list.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.id - a.id));
  }

  function getPresupuestos(mes, anio) {
    return DB.presupuestos
      .filter((p) => (!mes || p.mes === +mes) && (!anio || p.anio === +anio))
      .map(presupuestoConDerivados);
  }

  function getDashboard() {
    const cuentasActivas = DB.cuentas.filter((c) => c.activa);
    const saldo_total = money(cuentasActivas.reduce((s, c) => s + c.saldo, 0));

    const txMes = DB.transacciones.filter((t) => t.mes === MES_ACTUAL && t.anio === ANIO_ACTUAL);
    const ingresos_mes = money(txMes.filter((t) => t.tipo === "Ingreso").reduce((s, t) => s + t.monto, 0));
    const gastos_mes = money(txMes.filter((t) => t.tipo === "Gasto" || t.tipo === "Pago de deuda").reduce((s, t) => s + t.monto, 0));
    const balance_mes = money(ingresos_mes - gastos_mes);
    const deuda_total = money(getDeudas().filter((d) => d.estado !== "Liquidada").reduce((s, d) => s + d.saldo_restante, 0));

    // flujo mensual últimos 6 meses
    const flujo_mensual = [];
    for (let back = 5; back >= 0; back--) {
      let y = ANIO_ACTUAL, m = MES_ACTUAL - back;
      while (m <= 0) { m += 12; y -= 1; }
      const tx = DB.transacciones.filter((t) => t.mes === m && t.anio === y);
      flujo_mensual.push({
        mes: m, anio: y, label: `${nombreMes[m]} ${String(y).slice(2)}`,
        ingresos: money(tx.filter((t) => t.tipo === "Ingreso").reduce((s, t) => s + t.monto, 0)),
        gastos: money(tx.filter((t) => t.tipo === "Gasto" || t.tipo === "Pago de deuda").reduce((s, t) => s + t.monto, 0)),
      });
    }

    // gastos por categoría mes actual
    const porCat = {};
    txMes.filter((t) => t.tipo === "Gasto").forEach((t) => { porCat[t.categoria] = (porCat[t.categoria] || 0) + t.monto; });
    const totalCat = Object.values(porCat).reduce((s, v) => s + v, 0) || 1;
    const gastos_por_categoria = Object.entries(porCat)
      .map(([categoria, total]) => ({ categoria, total: money(total), porcentaje: money((total / totalCat) * 100) }))
      .sort((a, b) => b.total - a.total);

    // tendencia balance últimos 12 meses
    const tendencia_balance = [];
    for (let back = 11; back >= 0; back--) {
      let y = ANIO_ACTUAL, m = MES_ACTUAL - back;
      while (m <= 0) { m += 12; y -= 1; }
      const tx = DB.transacciones.filter((t) => t.mes === m && t.anio === y);
      const ing = tx.filter((t) => t.tipo === "Ingreso").reduce((s, t) => s + t.monto, 0);
      const gas = tx.filter((t) => t.tipo === "Gasto" || t.tipo === "Pago de deuda").reduce((s, t) => s + t.monto, 0);
      tendencia_balance.push({ mes: m, anio: y, label: `${nombreMes[m]} ${String(y).slice(2)}`, balance: money(ing - gas) });
    }

    const presupuestos_mes = getPresupuestos(MES_ACTUAL, ANIO_ACTUAL);

    // alertas
    const presupuestos_excedidos = presupuestos_mes.filter((p) => p.estado === "Excedido" || p.estado === "Límite");
    const deudas_proximas = getDeudas().filter((d) => {
      if (d.estado === "Liquidada") return false;
      const dias = Math.round((new Date(d.fecha_pago) - HOY) / 86400000);
      return dias >= 0 && dias <= 30;
    }).map((d) => ({ ...d, dias: Math.round((new Date(d.fecha_pago) - HOY) / 86400000) }));
    const metas_criticas = getMetas().filter((m) => {
      if (m.porcentaje >= 25) return false;
      const dias = Math.round((new Date(m.fecha_objetivo) - HOY) / 86400000);
      return dias >= 0 && dias <= 92;
    });

    return {
      kpis: { saldo_total, ingresos_mes, gastos_mes, balance_mes, deuda_total },
      flujo_mensual, gastos_por_categoria, tendencia_balance, presupuestos_mes,
      alertas: { presupuestos_excedidos, deudas_proximas, metas_criticas },
    };
  }

  // -------------------- MUTACIONES --------------------
  function addTransaccion(data) {
    const [y, m] = data.fecha.split("-").map(Number);
    const t = { id: nextId(), notas: "", cuenta: null, deuda: null, ...data, monto: money(+data.monto), mes: m, anio: y };
    DB.transacciones.push(t);
    if (t.tipo === "Pago de deuda" && t.deuda) {
      const d = DB.deudas.find((x) => x.id === +t.deuda);
      if (d) d.pagado = money(Math.min(d.monto_total, d.pagado + t.monto));
    }
    save();
    return t;
  }
  function updateTransaccion(id, data) {
    const i = DB.transacciones.findIndex((t) => t.id === id);
    if (i < 0) return;
    const [y, m] = data.fecha.split("-").map(Number);
    DB.transacciones[i] = { ...DB.transacciones[i], ...data, monto: money(+data.monto), mes: m, anio: y };
    save();
  }
  function deleteTransaccion(id) {
    DB.transacciones = DB.transacciones.filter((t) => t.id !== id);
    save();
  }

  function addPresupuesto(d) { const p = { id: nextId(), notas: "", ...d, presupuesto: money(+d.presupuesto), mes: +d.mes, anio: +d.anio }; DB.presupuestos.push(p); save(); return p; }
  function updatePresupuesto(id, d) { const i = DB.presupuestos.findIndex((x) => x.id === id); if (i >= 0) { DB.presupuestos[i] = { ...DB.presupuestos[i], ...d, presupuesto: money(+d.presupuesto), mes: +d.mes, anio: +d.anio }; save(); } }
  function deletePresupuesto(id) { DB.presupuestos = DB.presupuestos.filter((x) => x.id !== id); save(); }

  function addDeuda(d) { const x = { id: nextId(), pagado: 0, notas: "", ...d, monto_total: money(+d.monto_total), tasa_interes: +d.tasa_interes || 0 }; DB.deudas.push(x); save(); return x; }
  function updateDeuda(id, d) { const i = DB.deudas.findIndex((x) => x.id === id); if (i >= 0) { DB.deudas[i] = { ...DB.deudas[i], ...d, monto_total: money(+d.monto_total), tasa_interes: +d.tasa_interes || 0 }; save(); } }
  function deleteDeuda(id) { DB.deudas = DB.deudas.filter((x) => x.id !== id); save(); }
  function registrarPagoDeuda(deudaId, monto, fecha, cuenta) {
    const d = DB.deudas.find((x) => x.id === deudaId);
    if (!d) return;
    return addTransaccion({ nombre: `Pago ${d.nombre}`, categoria: "Otros", monto, fecha, tipo: "Pago de deuda", cuenta: cuenta || null, deuda: deudaId });
  }

  function addMeta(d) { const x = { id: nextId(), descripcion: "", ...d, monto_objetivo: money(+d.monto_objetivo), monto_actual: money(+d.monto_actual || 0) }; DB.metas.push(x); save(); return x; }
  function updateMeta(id, d) { const i = DB.metas.findIndex((x) => x.id === id); if (i >= 0) { DB.metas[i] = { ...DB.metas[i], ...d, monto_objetivo: money(+d.monto_objetivo), monto_actual: money(+d.monto_actual) }; save(); } }
  function deleteMeta(id) { DB.metas = DB.metas.filter((x) => x.id !== id); save(); }

  // -------------------- CATEGORÍAS --------------------
  function getCategorias() {
    if (!DB.categorias || !DB.categorias.length) DB.categorias = [...CATEGORIAS];
    return DB.categorias.slice();
  }
  function addCategoria(nombre) {
    if (!DB.categorias) DB.categorias = [...CATEGORIAS];
    const n = nombre.trim();
    if (!n || DB.categorias.includes(n)) return false;
    DB.categorias.push(n);
    save();
    return true;
  }
  function renameCategoria(antigua, nueva) {
    if (!DB.categorias) DB.categorias = [...CATEGORIAS];
    const i = DB.categorias.indexOf(antigua);
    if (i < 0) return false;
    const n = nueva.trim();
    if (!n || (DB.categorias.includes(n) && n !== antigua)) return false;
    DB.categorias[i] = n;
    DB.transacciones.forEach((t) => { if (t.categoria === antigua) t.categoria = n; });
    DB.presupuestos.forEach((p) => { if (p.categoria === antigua) p.categoria = n; });
    save();
    return true;
  }
  function deleteCategoria(nombre) {
    if (!DB.categorias) DB.categorias = [...CATEGORIAS];
    const i = DB.categorias.indexOf(nombre);
    if (i < 0) return false;
    DB.categorias.splice(i, 1);
    save();
    return true;
  }
  function reorderCategorias(ordered) {
    DB.categorias = ordered;
    save();
  }

  function addCuenta(d) { const x = { id: nextId(), activa: true, notas: "", ...d, saldo: money(+d.saldo || 0) }; DB.cuentas.push(x); save(); return x; }
  function updateCuenta(id, d) { const i = DB.cuentas.findIndex((x) => x.id === id); if (i >= 0) { DB.cuentas[i] = { ...DB.cuentas[i], ...d, saldo: money(+d.saldo) }; save(); } }
  function deleteCuenta(id) { DB.cuentas = DB.cuentas.filter((x) => x.id !== id); save(); }
  function toggleCuenta(id) { const c = DB.cuentas.find((x) => x.id === id); if (c) { c.activa = !c.activa; save(); } }

  window.FinanzasStore = {
    CATEGORIAS, TIPOS, MES_ACTUAL, ANIO_ACTUAL, HOY, nombreMes,
    subscribe, reset,
    getCategorias, addCategoria, renameCategoria, deleteCategoria, reorderCategorias,
    getCuentas, getDeudas, getMetas, getTransacciones, getPresupuestos, getDashboard,
    addTransaccion, updateTransaccion, deleteTransaccion,
    addPresupuesto, updatePresupuesto, deletePresupuesto,
    addDeuda, updateDeuda, deleteDeuda, registrarPagoDeuda,
    addMeta, updateMeta, deleteMeta,
    addCuenta, updateCuenta, deleteCuenta, toggleCuenta,
    estadoPresupuesto, estadoDeuda, estadoMeta,
  };
})();
