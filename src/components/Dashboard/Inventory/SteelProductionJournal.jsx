import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/Auth";

const createLine = () => ({
  productId: "",
  quantity: "",
  unit: "kg",
  coilNumber: "",
  coilSheet: "",
});

function SteelProductionJournal({ navigate }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [journals, setJournals] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    warehouseId: "",
    journalDate: new Date().toISOString().slice(0, 10),
    journalType: "PRODUCTION",
    referenceType: "",
    referenceId: "",
    remarks: "",
    narration: "",
    inputs: [createLine()],
    outputs: [createLine()],
    scrap: [],
  });

  const styles = {
    page: { minHeight: "100vh", padding: "28px", background: "linear-gradient(180deg,#f8fbff,#f8fafc)" },
    card: { background: "#fff", border: "1px solid #dbeafe", borderRadius: "24px", padding: "22px", boxShadow: "0 18px 40px rgba(15,23,42,0.08)", marginBottom: "18px" },
    title: { margin: 0, fontSize: "28px", fontWeight: 800, color: "#0f172a" },
    subtitle: { marginTop: "8px", color: "#475569", lineHeight: 1.6 },
    row: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginTop: "16px" },
    field: { display: "flex", flexDirection: "column", gap: "6px" },
    label: { fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" },
    input: { border: "1px solid #cbd5e1", borderRadius: "14px", padding: "12px 14px", fontSize: "14px", background: "#fff", width: "100%" },
    textarea: { border: "1px solid #cbd5e1", borderRadius: "14px", padding: "12px 14px", fontSize: "14px", background: "#fff", width: "100%", minHeight: "90px", resize: "vertical" },
    actions: { display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "18px" },
    button: { border: "none", borderRadius: "14px", padding: "12px 16px", fontWeight: 700, cursor: "pointer" },
    primary: { background: "linear-gradient(135deg,#0f766e,#2563eb)", color: "#fff" },
    secondary: { background: "#fff", border: "1px solid #cbd5e1", color: "#0f172a" },
    sectionTitle: { margin: "0 0 10px", fontSize: "18px", fontWeight: 800, color: "#0f172a" },
    lineCard: { border: "1px solid #e2e8f0", borderRadius: "18px", padding: "14px", marginTop: "12px", background: "#f8fafc" },
    tableWrap: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "12px", background: "#eff6ff", color: "#334155", fontWeight: 800, fontSize: "13px" },
    td: { padding: "12px", borderBottom: "1px solid #eef2f7", color: "#0f172a", fontSize: "14px", verticalAlign: "top" },
  };

  const loadBootstrap = async () => {
    try {
      setLoading(true);
      const [journalRes, warehouseRes, productRes] = await Promise.all([
        axiosAPI.get("/inventory/steel/production-journals"),
        axiosAPI.get("/warehouses"),
        axiosAPI.get("/products"),
      ]);
      setJournals(journalRes.data?.journals || []);
      setWarehouses(warehouseRes.data?.warehouses || warehouseRes.data || []);
      setProducts(productRes.data?.products || productRes.data || []);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to load production journal data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBootstrap();
  }, []);

  const addLine = (group) =>
    setForm((prev) => ({ ...prev, [group]: [...prev[group], createLine()] }));

  const removeLine = (group, index) =>
    setForm((prev) => ({
      ...prev,
      [group]: prev[group].filter((_, lineIndex) => lineIndex !== index),
    }));

  const updateLine = (group, index, field, value) =>
    setForm((prev) => ({
      ...prev,
      [group]: prev[group].map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      ),
    }));

  const cleanLines = (lines) =>
    lines
      .filter((line) => line.productId && line.quantity)
      .map((line) => ({
        productId: Number(line.productId),
        quantity: Number(line.quantity),
        unit: line.unit || "kg",
        ...(line.coilNumber ? { coilNumber: line.coilNumber.trim() } : {}),
        ...(line.coilSheet ? { coilSheet: line.coilSheet.trim() } : {}),
      }));

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await axiosAPI.post("/inventory/steel/production-journals", {
        ...form,
        warehouseId: Number(form.warehouseId),
        inputs: cleanLines(form.inputs),
        outputs: cleanLines(form.outputs),
        scrap: cleanLines(form.scrap),
      });
      alert("Production journal posted successfully");
      setForm({
        warehouseId: form.warehouseId,
        journalDate: new Date().toISOString().slice(0, 10),
        journalType: "PRODUCTION",
        referenceType: "",
        referenceId: "",
        remarks: "",
        narration: "",
        inputs: [createLine()],
        outputs: [createLine()],
        scrap: [],
      });
      await loadBootstrap();
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to post production journal");
    } finally {
      setSubmitting(false);
    }
  };

  const totals = useMemo(
    () => ({
      inputs: cleanLines(form.inputs).reduce((sum, line) => sum + Number(line.quantity || 0), 0),
      outputs: cleanLines(form.outputs).reduce((sum, line) => sum + Number(line.quantity || 0), 0),
      scrap: cleanLines(form.scrap).reduce((sum, line) => sum + Number(line.quantity || 0), 0),
    }),
    [form],
  );

  const renderLines = (group, title, showCoilFields = false) => (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <h3 style={styles.sectionTitle}>{title}</h3>
        <button style={{ ...styles.button, ...styles.secondary }} onClick={() => addLine(group)}>
          Add Line
        </button>
      </div>
      {form[group].map((line, index) => (
        <div style={styles.lineCard} key={`${group}-${index}`}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Product</label>
              <select style={styles.input} value={line.productId} onChange={(e) => updateLine(group, index, "productId", e.target.value)}>
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.SKU ? `(${product.SKU})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Quantity</label>
              <input style={styles.input} type="number" value={line.quantity} onChange={(e) => updateLine(group, index, "quantity", e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Unit</label>
              <input style={styles.input} value={line.unit} onChange={(e) => updateLine(group, index, "unit", e.target.value)} />
            </div>
            {showCoilFields && (
              <>
                <div style={styles.field}>
                  <label style={styles.label}>Coil Number</label>
                  <input style={styles.input} value={line.coilNumber} onChange={(e) => updateLine(group, index, "coilNumber", e.target.value)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Coil Sheet</label>
                  <input style={styles.input} value={line.coilSheet} onChange={(e) => updateLine(group, index, "coilSheet", e.target.value)} />
                </div>
              </>
            )}
          </div>
          <div style={styles.actions}>
            <button style={{ ...styles.button, ...styles.secondary }} onClick={() => removeLine(group, index)} disabled={form[group].length === 1 && group !== "scrap"}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Production Journal</h1>
        <p style={styles.subtitle}>
          Post raw coil consumption, finished roofing sheet output, and scrap in one
          journal so stock stays close to Tally-style stock journal behavior.
        </p>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Warehouse</label>
            <select style={styles.input} value={form.warehouseId} onChange={(e) => setForm((prev) => ({ ...prev, warehouseId: e.target.value }))}>
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Journal Date</label>
            <input style={styles.input} type="date" value={form.journalDate} onChange={(e) => setForm((prev) => ({ ...prev, journalDate: e.target.value }))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Journal Type</label>
            <input style={styles.input} value={form.journalType} onChange={(e) => setForm((prev) => ({ ...prev, journalType: e.target.value }))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Reference Type</label>
            <input style={styles.input} value={form.referenceType} onChange={(e) => setForm((prev) => ({ ...prev, referenceType: e.target.value }))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Reference Id</label>
            <input style={styles.input} value={form.referenceId} onChange={(e) => setForm((prev) => ({ ...prev, referenceId: e.target.value }))} />
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Remarks</label>
            <textarea style={styles.textarea} value={form.remarks} onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Narration</label>
            <textarea style={styles.textarea} value={form.narration} onChange={(e) => setForm((prev) => ({ ...prev, narration: e.target.value }))} />
          </div>
        </div>
      </div>

      {renderLines("inputs", "Raw Coil Inputs", true)}
      {renderLines("outputs", "Finished Goods Outputs")}
      {renderLines("scrap", "Scrap Lines")}

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Journal Totals</h3>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Input Qty</label>
            <input style={{ ...styles.input, background: "#f8fafc" }} value={`${totals.inputs} (source unit totals)`} readOnly />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Output Qty</label>
            <input style={{ ...styles.input, background: "#f8fafc" }} value={`${totals.outputs} (source unit totals)`} readOnly />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Scrap Qty</label>
            <input style={{ ...styles.input, background: "#f8fafc" }} value={`${totals.scrap} (source unit totals)`} readOnly />
          </div>
        </div>
        <div style={styles.actions}>
          <button style={{ ...styles.button, ...styles.secondary }} onClick={() => navigate("/inventory")}>Back</button>
          <button style={{ ...styles.button, ...styles.secondary }} onClick={loadBootstrap} disabled={loading}>Refresh Journals</button>
          <button style={{ ...styles.button, ...styles.primary }} onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? "Posting..." : "Post Production Journal"}
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Recent Production Journals</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Journal</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Warehouse</th>
                <th style={styles.th}>Input Kg</th>
                <th style={styles.th}>Output Kg</th>
                <th style={styles.th}>Scrap Kg</th>
                <th style={styles.th}>Loss Kg</th>
              </tr>
            </thead>
            <tbody>
              {journals.map((journal) => (
                <tr key={journal.id}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 800 }}>{journal.journalNumber}</div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>{journal.referenceType || "-"} / {journal.referenceId || "-"}</div>
                  </td>
                  <td style={styles.td}>{journal.journalDate || "-"}</td>
                  <td style={styles.td}>{journal.warehouse?.name || "-"}</td>
                  <td style={styles.td}>{Number(journal.totalInputKg || 0).toFixed(3)}</td>
                  <td style={styles.td}>{Number(journal.totalOutputKg || 0).toFixed(3)}</td>
                  <td style={styles.td}>{Number(journal.totalScrapKg || 0).toFixed(3)}</td>
                  <td style={styles.td}>{Number(journal.totalLossKg || 0).toFixed(3)}</td>
                </tr>
              ))}
              {journals.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan={7}>No production journals found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SteelProductionJournal;
