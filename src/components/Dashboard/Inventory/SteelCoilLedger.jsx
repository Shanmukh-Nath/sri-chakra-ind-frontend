import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/Auth";

function SteelCoilLedger({ navigate }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [coils, setCoils] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const styles = {
    page: { minHeight: "100vh", padding: "28px", background: "linear-gradient(180deg,#f8fbff,#f8fafc)" },
    card: { background: "#fff", border: "1px solid #dbeafe", borderRadius: "24px", padding: "22px", boxShadow: "0 18px 40px rgba(15,23,42,0.08)", marginBottom: "18px" },
    title: { margin: 0, fontSize: "28px", fontWeight: 800, color: "#0f172a" },
    subtitle: { marginTop: "8px", color: "#475569", lineHeight: 1.6 },
    row: { display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "18px" },
    input: { border: "1px solid #cbd5e1", borderRadius: "14px", padding: "12px 14px", fontSize: "14px", minWidth: "220px", background: "#fff" },
    button: { border: "none", borderRadius: "14px", padding: "12px 16px", fontWeight: 700, cursor: "pointer" },
    primary: { background: "linear-gradient(135deg,#0f766e,#2563eb)", color: "#fff" },
    secondary: { background: "#fff", border: "1px solid #cbd5e1", color: "#0f172a" },
    statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "14px", marginTop: "18px" },
    statCard: { borderRadius: "18px", border: "1px solid #dbeafe", padding: "16px", background: "linear-gradient(135deg,#eff6ff,#fff7ed)" },
    label: { fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" },
    value: { marginTop: "6px", fontSize: "20px", fontWeight: 800, color: "#0f172a" },
    tableWrap: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "12px", background: "#eff6ff", color: "#334155", fontWeight: 800, fontSize: "13px" },
    td: { padding: "12px", borderBottom: "1px solid #eef2f7", color: "#0f172a", fontSize: "14px", verticalAlign: "top" },
    badge: { display: "inline-block", padding: "6px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, color: "#fff", textTransform: "capitalize" },
  };

  const loadCoils = async () => {
    try {
      setLoading(true);
      const res = await axiosAPI.get("/inventory/steel/coils");
      setCoils(res.data?.coils || []);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to load coil ledger");
    } finally {
      setLoading(false);
    }
  };

  const rebuildCoils = async () => {
    try {
      setLoading(true);
      await axiosAPI.post("/inventory/steel/coils/rebuild");
      await loadCoils();
      alert("Coil ledger rebuilt successfully");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to rebuild coil ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoils();
  }, []);

  const filtered = useMemo(() => {
    return coils.filter((coil) => {
      const matchesStatus = statusFilter ? String(coil.status || "").toLowerCase() === statusFilter : true;
      const matchesSearch = search
        ? [
            coil.coilNumber,
            coil.coilSheet,
            coil.product?.name,
            coil.product?.SKU,
            coil.materialGrade,
            coil.coating,
            coil.millName,
            coil.warehouse?.name,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(search.toLowerCase()))
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [coils, search, statusFilter]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, coil) => {
        acc.inward += Number(coil.inwardQuantityKg || 0);
        acc.remaining += Number(coil.remainingQuantityKg || 0);
        acc.available += Number(coil.availableQuantityKg || 0);
        acc.reserved += Number(coil.reservedQuantityKg || 0);
        return acc;
      },
      { inward: 0, remaining: 0, available: 0, reserved: 0 },
    );
  }, [filtered]);

  const getBadge = (status) => {
    const colors = {
      consumed: "#1f2937",
      reserved: "#f59e0b",
      partial: "#0ea5e9",
      over_reserved: "#dc2626",
      available: "#10b981",
    };
    return { ...styles.badge, background: colors[status] || "#64748b" };
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Coil Ledger</h1>
        <p style={styles.subtitle}>
          Live coil-wise stock register with received, issued, reserved, and available
          balances rebuilt from actual stock and production movements.
        </p>
        <div style={styles.row}>
          <input style={styles.input} placeholder="Search coil, product, grade, mill" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={styles.input} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="partial">Partial</option>
            <option value="consumed">Consumed</option>
            <option value="over_reserved">Over Reserved</option>
          </select>
          <button style={{ ...styles.button, ...styles.secondary }} onClick={() => navigate("/inventory")}>Back</button>
          <button style={{ ...styles.button, ...styles.secondary }} onClick={loadCoils} disabled={loading}>Refresh</button>
          <button style={{ ...styles.button, ...styles.primary }} onClick={rebuildCoils} disabled={loading}>
            {loading ? "Working..." : "Rebuild Ledger"}
          </button>
        </div>
        <div style={styles.statGrid}>
          <div style={styles.statCard}><div style={styles.label}>Coils</div><div style={styles.value}>{filtered.length}</div></div>
          <div style={styles.statCard}><div style={styles.label}>Received Kg</div><div style={styles.value}>{totals.inward.toFixed(3)}</div></div>
          <div style={styles.statCard}><div style={styles.label}>Remaining Kg</div><div style={styles.value}>{totals.remaining.toFixed(3)}</div></div>
          <div style={styles.statCard}><div style={styles.label}>Available Kg</div><div style={styles.value}>{totals.available.toFixed(3)}</div></div>
          <div style={styles.statCard}><div style={styles.label}>Reserved Kg</div><div style={styles.value}>{totals.reserved.toFixed(3)}</div></div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Coil</th>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Specification</th>
                <th style={styles.th}>Warehouse</th>
                <th style={styles.th}>Received</th>
                <th style={styles.th}>Issued</th>
                <th style={styles.th}>Reserved</th>
                <th style={styles.th}>Available</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((coil) => (
                <tr key={coil.id}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 800 }}>{coil.coilNumber || "-"}</div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>{coil.coilSheet || "-"}</div>
                  </td>
                  <td style={styles.td}>
                    <div>{coil.product?.name || "-"}</div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>{coil.product?.SKU || "-"}</div>
                  </td>
                  <td style={styles.td}>
                    {(coil.materialGrade || "-")} / {(coil.coating || "-")}
                    <div style={{ color: "#64748b", fontSize: "12px" }}>
                      {coil.thicknessMm || "-"} mm x {coil.widthMm || "-"} mm
                    </div>
                  </td>
                  <td style={styles.td}>{coil.warehouse?.name || "-"}</td>
                  <td style={styles.td}>{Number(coil.inwardQuantityKg || 0).toFixed(3)} kg</td>
                  <td style={styles.td}>{Number(coil.issuedQuantityKg || 0).toFixed(3)} kg</td>
                  <td style={styles.td}>{Number(coil.reservedQuantityKg || 0).toFixed(3)} kg</td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 800 }}>{Number(coil.availableQuantityKg || 0).toFixed(3)} kg</div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>
                      Remaining {Number(coil.remainingQuantityKg || 0).toFixed(3)} kg
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={getBadge(coil.status)}>{coil.status || "-"}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan={9}>No coil records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SteelCoilLedger;
