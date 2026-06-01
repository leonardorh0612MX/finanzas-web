"""
Importa datos reales desde finanzas.db (del agente) al formato de la web app.
Ejecutar una vez para migrar datos existentes.

Uso:
    python importar_datos.py
    → genera finanzas_data.json con tus datos reales
"""

import json
import os
import sqlite3

# Ruta a la base de datos del agente
DB_AGENTE = os.path.join(
    os.path.dirname(__file__),
    "..", "finanzas-personal", "finanzas.db"
)
OUT_FILE = os.path.join(os.path.dirname(__file__), "finanzas_data.json")


def build_store(conn):
    cur = conn.cursor()
    store = {
        "_nextId": 1,
        "cuentas": [],
        "deudas": [],
        "metas": [],
        "transacciones": [],
        "presupuestos": [],
    }

    id_map = {}   # sqlite id → nuevo id numérico
    next_id = [1]

    def new_id(original=None):
        nid = next_id[0]
        next_id[0] += 1
        if original is not None:
            id_map[original] = nid
        return nid

    # -------- Cuentas --------
    cur.execute("SELECT id, nombre, tipo, banco, saldo, activa, notas FROM cuentas")
    for row in cur.fetchall():
        sid, nombre, tipo, banco, saldo, activa, notas = row
        nid = new_id(("cuenta", sid))
        store["cuentas"].append({
            "id": nid,
            "nombre": nombre or "Sin nombre",
            "tipo": tipo or "Débito",
            "banco": banco or "—",
            "saldo": round(saldo or 0, 2),
            "activa": bool(activa),
            "notas": notas or "",
        })
    print(f"  {len(store['cuentas'])} cuentas importadas")

    # -------- Deudas --------
    cur.execute("SELECT id, nombre, monto_total, pagado, tasa_interes, fecha_pago, estado, notas FROM deudas")
    for row in cur.fetchall():
        sid, nombre, monto_total, pagado, tasa, fecha_pago, estado, notas = row
        nid = new_id(("deuda", sid))
        store["deudas"].append({
            "id": nid,
            "nombre": nombre or "Sin nombre",
            "monto_total": round(monto_total or 0, 2),
            "pagado": round(pagado or 0, 2),
            "tasa_interes": round(tasa or 0, 2),
            "fecha_pago": fecha_pago or "",
            "notas": notas or "",
        })
    print(f"  {len(store['deudas'])} deudas importadas")

    # -------- Metas --------
    cur.execute("SELECT id, nombre, tipo, monto_objetivo, monto_actual, fecha_objetivo, descripcion FROM metas")
    for row in cur.fetchall():
        sid, nombre, tipo, obj, act, fecha, desc = row
        nid = new_id(("meta", sid))
        store["metas"].append({
            "id": nid,
            "nombre": nombre or "Sin nombre",
            "tipo": tipo or "Ahorro",
            "monto_objetivo": round(obj or 0, 2),
            "monto_actual": round(act or 0, 2),
            "fecha_objetivo": fecha or "",
            "descripcion": desc or "",
        })
    print(f"  {len(store['metas'])} metas importadas")

    # -------- Presupuestos --------
    cur.execute("SELECT id, nombre, categoria, mes, anio, presupuesto, notas FROM presupuestos")
    for row in cur.fetchall():
        sid, nombre, cat, mes, anio, presupuesto, notas = row
        nid = new_id(("pres", sid))
        store["presupuestos"].append({
            "id": nid,
            "nombre": nombre or "Sin nombre",
            "categoria": cat or "Otros",
            "mes": int(mes or 0),
            "anio": int(anio or 0),
            "presupuesto": round(presupuesto or 0, 2),
            "notas": notas or "",
        })
    print(f"  {len(store['presupuestos'])} presupuestos importados")

    # -------- Transacciones --------
    cur.execute("""
        SELECT id, nombre, categoria, monto, fecha, mes, anio, tipo, cuenta, deuda, notas
        FROM transacciones
    """)
    for row in cur.fetchall():
        sid, nombre, cat, monto, fecha, mes, anio, tipo, cuenta_sid, deuda_sid, notas = row
        nid = new_id()
        # Resolver FKs al nuevo id numérico
        cuenta_nid = id_map.get(("cuenta", cuenta_sid))
        deuda_nid = id_map.get(("deuda", deuda_sid))

        store["transacciones"].append({
            "id": nid,
            "nombre": nombre or "Sin descripción",
            "categoria": cat or "Otros",
            "monto": round(monto or 0, 2),
            "fecha": fecha or "",
            "mes": int(mes or 0),
            "anio": int(anio or 0),
            "tipo": tipo or "Gasto",
            "cuenta": cuenta_nid,
            "deuda": deuda_nid,
            "notas": notas or "",
        })
    print(f"  {len(store['transacciones'])} transacciones importadas")

    store["_nextId"] = next_id[0]
    return store


def main():
    db_path = os.path.abspath(DB_AGENTE)
    if not os.path.isfile(db_path):
        print(f"No se encontro finanzas.db en:\n  {db_path}")
        print("\nSi quieres empezar con datos de ejemplo, borra finanzas_data.json")
        print("y abre la app: el demo se carga automaticamente en el primer arranque.")
        return

    print(f"Leyendo: {db_path}")
    conn = sqlite3.connect(db_path)
    try:
        store = build_store(conn)
    finally:
        conn.close()

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(store, f, ensure_ascii=False, indent=2)

    print(f"\nGuardado en: {OUT_FILE}")
    print("Abre la app (start.bat) para ver tus datos reales.")


if __name__ == "__main__":
    main()
