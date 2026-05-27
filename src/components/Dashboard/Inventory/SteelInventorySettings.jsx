import React, { useEffect, useState } from "react";
import { useAuth } from "@/Auth";

const createDefaultForm = () => ({
  baseCalculationUnit: "kg",
  valuationMethod: "WEIGHTED_AVG",
  coilTrackingMode: "REQUIRED",
  reservationMode: "COIL_WISE",
  productionMode: "JOURNAL",
  negativeStockPolicy: "BLOCK",
  displayDefaults: {
    primaryStockUnit: "kg",
    primaryDisplayUnit: "mt",
    secondaryDisplayUnits: ["kg", "coil", "sheet", "rmt"],
    stockSummaryMode: "LOT_AND_WEIGHT",
    displayPrecision: 3,
  },
  ledgerPreferences: {
    issueStrategy: "FIFO",
    requireLotReferenceOnIssue: true,
    trackScrapSeparately: true,
  },
  customStatuses: [
    "available",
    "reserved",
    "in_production",
    "partial",
    "consumed",
    "hold",
    "scrap",
  ],
  numberingPolicy: {
    productionJournalPrefix: "PJ",
  },
});

function SteelInventorySettings({ navigate }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(createDefaultForm());
  const [customStatusesText, setCustomStatusesText] = useState(
    createDefaultForm().customStatuses.join(", "),
  );

  const styles = {
    page: {
      minHeight: "100vh",
      padding: "28px",
      background: "linear-gradient(180deg, #f8fbff 0%, #eef4ff 40%, #f8fafc 100%)",
    },
    card: {
      background: "rgba(255,255,255,0.97)",
      borderRadius: "24px",
      border: "1px solid #dbeafe",
      boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
      padding: "22px",
      marginBottom: "18px",
    },
    title: { margin: 0, fontSize: "28px", fontWeight: 800, color: "#0f172a" },
    subtitle: { marginTop: "8px", color: "#475569", lineHeight: 1.6 },
    row: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "16px",
      marginTop: "18px",
    },
    field: { display: "flex", flexDirection: "column", gap: "6px" },
    label: { fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" },
    input: {
      border: "1px solid #cbd5e1",
      borderRadius: "14px",
      padding: "12px 14px",
      fontSize: "14px",
      outline: "none",
      background: "#fff",
      width: "100%",
    },
    textarea: {
      border: "1px solid #cbd5e1",
      borderRadius: "14px",
      padding: "12px 14px",
      fontSize: "14px",
      outline: "none",
      background: "#fff",
      width: "100%",
      minHeight: "110px",
      resize: "vertical",
    },
    actions: { display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "18px" },
    button: {
      border: "none",
      borderRadius: "14px",
      padding: "12px 16px",
      fontWeight: 700,
      cursor: "pointer",
    },
    primary: { background: "linear-gradient(135deg, #0f766e, #2563eb)", color: "#fff" },
    secondary: { background: "#fff", color: "#0f172a", border: "1px solid #cbd5e1" },
    note: {
      marginTop: "14px",
      padding: "14px 16px",
      borderRadius: "16px",
      background: "linear-gradient(135deg, #eff6ff, #f8fafc)",
      border: "1px solid #bfdbfe",
      color: "#334155",
      lineHeight: 1.6,
      fontSize: "13px",
    },
  };

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/inventory/steel/settings");
        const settings = res.data?.settings || createDefaultForm();
        setForm({
          ...createDefaultForm(),
          ...settings,
          displayDefaults: {
            ...createDefaultForm().displayDefaults,
            ...(settings.displayDefaults || {}),
          },
          ledgerPreferences: {
            ...createDefaultForm().ledgerPreferences,
            ...(settings.ledgerPreferences || {}),
          },
          numberingPolicy: {
            ...createDefaultForm().numberingPolicy,
            ...(settings.numberingPolicy || {}),
          },
        });
        setCustomStatusesText((settings.customStatuses || createDefaultForm().customStatuses).join(", "));
      } catch (error) {
        alert(error?.response?.data?.message || "Failed to load steel settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [axiosAPI]);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateNested = (group, field, value) =>
    setForm((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value,
      },
    }));

  const handleSave = async () => {
    try {
      setSaving(true);
      await axiosAPI.put("/inventory/steel/settings", {
        ...form,
        customStatuses: customStatusesText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        displayDefaults: {
          ...form.displayDefaults,
          displayPrecision: Number(form.displayDefaults.displayPrecision || 3),
          secondaryDisplayUnits: String(form.displayDefaults.secondaryDisplayUnits || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        },
      });
      alert("Steel inventory settings saved successfully");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to save steel settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Steel Inventory Settings</h1>
        <p style={styles.subtitle}>
          Keep one calculation unit for system math and valuation, but let accountants
          control how steel stock is shown, issued, valued, and lot-tracked.
        </p>
        <div style={styles.note}>
          Base calculation unit stays <strong>kg</strong> for formulas and ledger
          accuracy. Display units like <strong>MT</strong>, <strong>coil</strong>,
          <strong>sheet</strong>, and <strong>RMT</strong> remain customizable.
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Base Calculation Unit</label>
            <input style={{ ...styles.input, background: "#f8fafc" }} value={form.baseCalculationUnit} readOnly />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Valuation Method</label>
            <select style={styles.input} value={form.valuationMethod} onChange={(e) => updateField("valuationMethod", e.target.value)}>
              <option value="WEIGHTED_AVG">Weighted Average</option>
              <option value="FIFO">FIFO</option>
              <option value="STANDARD">Standard Cost</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Coil Tracking</label>
            <select style={styles.input} value={form.coilTrackingMode} onChange={(e) => updateField("coilTrackingMode", e.target.value)}>
              <option value="REQUIRED">Required</option>
              <option value="OPTIONAL">Optional</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Reservation Mode</label>
            <select style={styles.input} value={form.reservationMode} onChange={(e) => updateField("reservationMode", e.target.value)}>
              <option value="COIL_WISE">Coil Wise</option>
              <option value="PRODUCT_WISE">Product Wise</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Production Mode</label>
            <select style={styles.input} value={form.productionMode} onChange={(e) => updateField("productionMode", e.target.value)}>
              <option value="JOURNAL">Production Journal</option>
              <option value="DIRECT">Direct Consumption</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Negative Stock</label>
            <select style={styles.input} value={form.negativeStockPolicy} onChange={(e) => updateField("negativeStockPolicy", e.target.value)}>
              <option value="BLOCK">Block</option>
              <option value="WARN">Warn</option>
              <option value="ALLOW">Allow</option>
            </select>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={{ ...styles.title, fontSize: "22px" }}>Display And Ledger Preferences</h2>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Primary Stock Unit</label>
            <input style={{ ...styles.input, background: "#f8fafc" }} value={form.displayDefaults.primaryStockUnit} readOnly />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Primary Display Unit</label>
            <input style={styles.input} value={form.displayDefaults.primaryDisplayUnit} onChange={(e) => updateNested("displayDefaults", "primaryDisplayUnit", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Secondary Display Units</label>
            <input
              style={styles.input}
              value={Array.isArray(form.displayDefaults.secondaryDisplayUnits) ? form.displayDefaults.secondaryDisplayUnits.join(", ") : form.displayDefaults.secondaryDisplayUnits}
              onChange={(e) => updateNested("displayDefaults", "secondaryDisplayUnits", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Stock Summary Mode</label>
            <select style={styles.input} value={form.displayDefaults.stockSummaryMode} onChange={(e) => updateNested("displayDefaults", "stockSummaryMode", e.target.value)}>
              <option value="LOT_AND_WEIGHT">Lot And Weight</option>
              <option value="WEIGHT_ONLY">Weight Only</option>
              <option value="LOT_ONLY">Lot Only</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Display Precision</label>
            <input style={styles.input} type="number" value={form.displayDefaults.displayPrecision} onChange={(e) => updateNested("displayDefaults", "displayPrecision", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Issue Strategy</label>
            <select style={styles.input} value={form.ledgerPreferences.issueStrategy} onChange={(e) => updateNested("ledgerPreferences", "issueStrategy", e.target.value)}>
              <option value="FIFO">FIFO</option>
              <option value="LIFO">LIFO</option>
              <option value="MANUAL">Manual</option>
              <option value="SPECIFIC_LOT">Specific Lot</option>
            </select>
          </div>
        </div>
        <div style={styles.row}>
          <label style={{ ...styles.field, justifyContent: "center" }}>
            <span style={styles.label}>Require Lot Reference On Issue</span>
            <input type="checkbox" checked={form.ledgerPreferences.requireLotReferenceOnIssue} onChange={(e) => updateNested("ledgerPreferences", "requireLotReferenceOnIssue", e.target.checked)} />
          </label>
          <label style={{ ...styles.field, justifyContent: "center" }}>
            <span style={styles.label}>Track Scrap Separately</span>
            <input type="checkbox" checked={form.ledgerPreferences.trackScrapSeparately} onChange={(e) => updateNested("ledgerPreferences", "trackScrapSeparately", e.target.checked)} />
          </label>
          <div style={styles.field}>
            <label style={styles.label}>Production Journal Prefix</label>
            <input style={styles.input} value={form.numberingPolicy.productionJournalPrefix} onChange={(e) => updateNested("numberingPolicy", "productionJournalPrefix", e.target.value)} />
          </div>
        </div>
        <div style={{ ...styles.field, marginTop: "18px" }}>
          <label style={styles.label}>Custom Coil Statuses</label>
          <textarea style={styles.textarea} value={customStatusesText} onChange={(e) => setCustomStatusesText(e.target.value)} />
        </div>
        <div style={styles.actions}>
          <button style={{ ...styles.button, ...styles.secondary }} onClick={() => navigate("/inventory")}>
            Back
          </button>
          <button style={{ ...styles.button, ...styles.primary }} onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Steel Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SteelInventorySettings;
