import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/Auth";
import { GST_STATES, findStateCodeByName } from "@/constants/gstStates";

const createDefaultGstCompliance = () => ({
  provider: "generic",
  baseUrl: "",
  authUrl: "",
  authType: "body",
  clientId: "",
  clientSecret: "",
  username: "",
  password: "",
  gstin: "",
  tokenPath: "access_token",
  tokenExpiresInPath: "expires_in",
  timeoutMs: 30000,
  endpoints: {
    lookupGstin: { path: "", method: "GET" },
    generateEInvoice: { path: "", method: "POST" },
    cancelEInvoice: { path: "", method: "POST" },
    generateEWayBill: { path: "", method: "POST" },
    getDocumentStatus: { path: "", method: "GET" },
  },
  defaultHeaders: {},
  authPayload: null,
});

const normalizeGstCompliance = (value) => {
  const defaults = createDefaultGstCompliance();
  const source = value || {};

  return {
    ...defaults,
    ...source,
    endpoints: {
      ...defaults.endpoints,
      ...(source.endpoints || {}),
      lookupGstin: {
        ...defaults.endpoints.lookupGstin,
        ...(source.endpoints?.lookupGstin || {}),
      },
      generateEInvoice: {
        ...defaults.endpoints.generateEInvoice,
        ...(source.endpoints?.generateEInvoice || {}),
      },
      cancelEInvoice: {
        ...defaults.endpoints.cancelEInvoice,
        ...(source.endpoints?.cancelEInvoice || {}),
      },
      generateEWayBill: {
        ...defaults.endpoints.generateEWayBill,
        ...(source.endpoints?.generateEWayBill || {}),
      },
      getDocumentStatus: {
        ...defaults.endpoints.getDocumentStatus,
        ...(source.endpoints?.getDocumentStatus || {}),
      },
    },
    defaultHeaders:
      source.defaultHeaders && typeof source.defaultHeaders === "object"
        ? source.defaultHeaders
        : {},
    authPayload:
      source.authPayload && typeof source.authPayload === "object"
        ? source.authPayload
        : null,
  };
};

const formatJson = (value) => {
  if (!value || (typeof value === "object" && Object.keys(value).length === 0)) {
    return "";
  }

  return JSON.stringify(value, null, 2);
};

const parseOptionalJson = (value, fallback, label) => {
  if (!String(value || "").trim()) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background:
      "linear-gradient(135deg, #fff7ed 0%, #eff6ff 45%, #f0fdf4 100%)",
  },
  card: {
    background: "rgba(255,255,255,0.95)",
    border: "1px solid #dbeafe",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "28px",
    fontWeight: 700,
  },
  subtitle: {
    marginTop: "8px",
    color: "#475569",
    fontSize: "14px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginTop: "18px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    color: "#475569",
    fontWeight: 600,
  },
  hint: {
    fontSize: "12px",
    color: "#64748b",
    lineHeight: 1.5,
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  },
  textarea: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    minHeight: "120px",
    resize: "vertical",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "18px",
  },
  button: {
    border: "none",
    borderRadius: "14px",
    padding: "14px 20px",
    fontWeight: 700,
    cursor: "pointer",
  },
  primary: {
    background: "linear-gradient(135deg, #ea580c, #2563eb)",
    color: "#fff",
  },
  secondary: {
    background: "#fff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
  },
  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: 700,
  },
  banner: {
    marginTop: "16px",
    padding: "14px 16px",
    borderRadius: "18px",
    border: "1px solid #fed7aa",
    background: "linear-gradient(135deg, #fff7ed, #eff6ff)",
    color: "#334155",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  toggleRow: {
    display: "flex",
    gap: "18px",
    flexWrap: "wrap",
    marginTop: "18px",
  },
  toggleCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    borderRadius: "16px",
    border: "1px solid #dbeafe",
    background: "#f8fbff",
    minWidth: "220px",
  },
};

function BillingSetup({ navigate }) {
  const { axiosAPI } = useAuth();
  const selectedDivisionId = localStorage.getItem("currentDivisionId");
  const [divisions, setDivisions] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [advancedJson, setAdvancedJson] = useState({
    defaultHeaders: "",
    authPayload: "",
  });
  const [form, setForm] = useState({
    divisionId:
      selectedDivisionId && selectedDivisionId !== "1" ? selectedDivisionId : "",
    legalName: "",
    displayName: "",
    addressLine1: "",
    addressLine2: "",
    area: "",
    city: "",
    district: "",
    state: "",
    stateCode: "",
    pincode: "",
    country: "India",
    gstinNumber: "",
    panNumber: "",
    cinNumber: "",
    contactPhone: "",
    contactEmail: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
    branchName: "",
    ifscCode: "",
    invoicePrefix: "INV",
    quotationPrefix: "QT",
    salesOrderPrefix: "SO",
    defaultDocumentType: "tax_invoice",
    defaultTransportMode: "Road",
    defaultSupplyType: "B2B",
    notesFooter: "",
    declarationText: "",
    eInvoiceEnabled: false,
    eWayBillEnabled: false,
    settings: {
      gstCompliance: createDefaultGstCompliance(),
    },
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/billing-profiles/bootstrap");
        setDivisions(res.data?.divisions || []);
        setProfiles(res.data?.profiles || []);
      } catch (error) {
        alert(error?.response?.data?.message || "Failed to load billing setup");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [axiosAPI]);

  const selectedProfile = useMemo(
    () =>
      profiles.find(
        (profile) => String(profile.divisionId) === String(form.divisionId),
      ),
    [profiles, form.divisionId],
  );

  useEffect(() => {
    if (!selectedProfile) return;

    const gstCompliance = normalizeGstCompliance(
      selectedProfile.settings?.gstCompliance,
    );

    setForm((prev) => ({
      ...prev,
      divisionId: String(selectedProfile.divisionId),
      legalName: selectedProfile.legalName || "",
      displayName: selectedProfile.displayName || "",
      addressLine1: selectedProfile.addressLine1 || "",
      addressLine2: selectedProfile.addressLine2 || "",
      area: selectedProfile.area || "",
      city: selectedProfile.city || "",
      district: selectedProfile.district || "",
      state: selectedProfile.state || "",
      stateCode: selectedProfile.stateCode || "",
      pincode: selectedProfile.pincode || "",
      country: selectedProfile.country || "India",
      gstinNumber: selectedProfile.gstinNumber || "",
      panNumber: selectedProfile.panNumber || "",
      cinNumber: selectedProfile.cinNumber || "",
      contactPhone: selectedProfile.contactPhone || "",
      contactEmail: selectedProfile.contactEmail || "",
      bankAccountName: selectedProfile.bankAccountName || "",
      bankAccountNumber: selectedProfile.bankAccountNumber || "",
      bankName: selectedProfile.bankName || "",
      branchName: selectedProfile.branchName || "",
      ifscCode: selectedProfile.ifscCode || "",
      invoicePrefix: selectedProfile.invoicePrefix || "INV",
      quotationPrefix: selectedProfile.quotationPrefix || "QT",
      salesOrderPrefix: selectedProfile.salesOrderPrefix || "SO",
      defaultDocumentType:
        selectedProfile.defaultDocumentType === "e_invoice"
          ? "tax_invoice"
          : selectedProfile.defaultDocumentType || "tax_invoice",
      defaultTransportMode: selectedProfile.defaultTransportMode || "Road",
      defaultSupplyType: selectedProfile.defaultSupplyType || "B2B",
      notesFooter: selectedProfile.notesFooter || "",
      declarationText: selectedProfile.declarationText || "",
      eInvoiceEnabled: Boolean(selectedProfile.eInvoiceEnabled),
      eWayBillEnabled: Boolean(selectedProfile.eWayBillEnabled),
      settings: {
        ...(selectedProfile.settings || {}),
        gstCompliance,
      },
    }));

    setAdvancedJson({
      defaultHeaders: formatJson(gstCompliance.defaultHeaders),
      authPayload: formatJson(gstCompliance.authPayload),
    });
  }, [selectedProfile]);

  useEffect(() => {
    if (!form.divisionId || selectedProfile) return;

    const division = divisions.find(
      (entry) => String(entry.id) === String(form.divisionId),
    );

    setForm((prev) => ({
      ...prev,
      legalName: "",
      displayName: "",
      addressLine1: "",
      addressLine2: "",
      area: "",
      city: "",
      district: "",
      state: division?.state || "",
      stateCode: division?.stateCode || "",
      pincode: "",
      country: "India",
      gstinNumber: division?.gstinNumber || "",
      panNumber: "",
      cinNumber: "",
      contactPhone: "",
      contactEmail: "",
      bankAccountName: "",
      bankAccountNumber: "",
      bankName: "",
      branchName: "",
      ifscCode: "",
      invoicePrefix: "INV",
      quotationPrefix: "QT",
      salesOrderPrefix: "SO",
      defaultDocumentType: "tax_invoice",
      defaultTransportMode: "Road",
      defaultSupplyType: "B2B",
      notesFooter: "",
      declarationText: "",
      eInvoiceEnabled: false,
      eWayBillEnabled: false,
      settings: {
        gstCompliance: {
          ...createDefaultGstCompliance(),
          gstin: division?.gstinNumber || "",
        },
      },
    }));

    setAdvancedJson({
      defaultHeaders: "",
      authPayload: "",
    });
  }, [divisions, form.divisionId, selectedProfile]);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateGstComplianceField = (field, value) =>
    setForm((prev) => ({
      ...prev,
      settings: {
        ...(prev.settings || {}),
        gstCompliance: {
          ...normalizeGstCompliance(prev.settings?.gstCompliance),
          [field]: value,
        },
      },
    }));

  const updateGstEndpoint = (endpoint, field, value) =>
    setForm((prev) => ({
      ...prev,
      settings: {
        ...(prev.settings || {}),
        gstCompliance: {
          ...normalizeGstCompliance(prev.settings?.gstCompliance),
          endpoints: {
            ...normalizeGstCompliance(prev.settings?.gstCompliance).endpoints,
            [endpoint]: {
              ...normalizeGstCompliance(prev.settings?.gstCompliance).endpoints[
                endpoint
              ],
              [field]: value,
            },
          },
        },
      },
    }));

  const handleStateChange = (value) => {
    setForm((prev) => ({
      ...prev,
      state: value,
      stateCode: findStateCodeByName(value),
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const gstCompliance = normalizeGstCompliance(
        form.settings?.gstCompliance,
      );

      const payload = {
        ...form,
        divisionId: Number(form.divisionId),
        settings: {
          ...(form.settings || {}),
          gstCompliance: {
            ...gstCompliance,
            gstin: gstCompliance.gstin || form.gstinNumber || "",
            timeoutMs: Number(gstCompliance.timeoutMs || 30000),
            defaultHeaders: parseOptionalJson(
              advancedJson.defaultHeaders,
              {},
              "Default headers",
            ),
            authPayload: parseOptionalJson(
              advancedJson.authPayload,
              null,
              "Auth payload",
            ),
          },
        },
      };

      await axiosAPI.post("/billing-profiles", payload);
      alert("Billing profile saved successfully");
      navigate("/invoices");
    } catch (error) {
      alert(error?.response?.data?.message || error.message || "Failed to save billing profile");
    } finally {
      setLoading(false);
    }
  };

  const gstCompliance = normalizeGstCompliance(form.settings?.gstCompliance);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Billing Setup</h1>
        <p style={styles.subtitle}>
          Configure each company or division with legal billing identity, GST
          data, bank details, and document defaults.
        </p>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Division / Company</label>
            <select
              style={styles.input}
              value={form.divisionId}
              onChange={(e) => updateField("divisionId", e.target.value)}
            >
              <option value="">Select division</option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Legal Name</label>
            <input
              style={styles.input}
              value={form.legalName}
              onChange={(e) => updateField("legalName", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Display Name</label>
            <input
              style={styles.input}
              value={form.displayName}
              onChange={(e) => updateField("displayName", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>GSTIN</label>
            <input
              style={styles.input}
              value={form.gstinNumber}
              onChange={(e) => updateField("gstinNumber", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>PAN</label>
            <input
              style={styles.input}
              value={form.panNumber}
              onChange={(e) => updateField("panNumber", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>CIN</label>
            <input
              style={styles.input}
              value={form.cinNumber}
              onChange={(e) => updateField("cinNumber", e.target.value)}
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Address Line 1</label>
            <input
              style={styles.input}
              value={form.addressLine1}
              onChange={(e) => updateField("addressLine1", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Address Line 2</label>
            <input
              style={styles.input}
              value={form.addressLine2}
              onChange={(e) => updateField("addressLine2", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Area</label>
            <input
              style={styles.input}
              value={form.area}
              onChange={(e) => updateField("area", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>City</label>
            <input
              style={styles.input}
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>District</label>
            <input
              style={styles.input}
              value={form.district}
              onChange={(e) => updateField("district", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>State</label>
            <select
              style={styles.input}
              value={form.state}
              onChange={(e) => handleStateChange(e.target.value)}
            >
              <option value="">Select state</option>
              {GST_STATES.map((state) => (
                <option key={state.code} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>State Code</label>
            <input
              style={{ ...styles.input, background: "#f8fafc" }}
              value={form.stateCode}
              readOnly
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Pincode</label>
            <input
              style={styles.input}
              value={form.pincode}
              onChange={(e) => updateField("pincode", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contact Phone</label>
            <input
              style={styles.input}
              value={form.contactPhone}
              onChange={(e) => updateField("contactPhone", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contact Email</label>
            <input
              style={styles.input}
              value={form.contactEmail}
              onChange={(e) => updateField("contactEmail", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Bank And Document Defaults</h2>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Bank Account Name</label>
            <input
              style={styles.input}
              value={form.bankAccountName}
              onChange={(e) => updateField("bankAccountName", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Bank Account Number</label>
            <input
              style={styles.input}
              value={form.bankAccountNumber}
              onChange={(e) => updateField("bankAccountNumber", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Bank Name</label>
            <input
              style={styles.input}
              value={form.bankName}
              onChange={(e) => updateField("bankName", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Branch Name</label>
            <input
              style={styles.input}
              value={form.branchName}
              onChange={(e) => updateField("branchName", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>IFSC Code</label>
            <input
              style={styles.input}
              value={form.ifscCode}
              onChange={(e) => updateField("ifscCode", e.target.value)}
            />
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Invoice Prefix</label>
            <input
              style={styles.input}
              value={form.invoicePrefix}
              onChange={(e) => updateField("invoicePrefix", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Quotation Prefix</label>
            <input
              style={styles.input}
              value={form.quotationPrefix}
              onChange={(e) => updateField("quotationPrefix", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Sales Order Prefix</label>
            <input
              style={styles.input}
              value={form.salesOrderPrefix}
              onChange={(e) => updateField("salesOrderPrefix", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Default Document Type</label>
            <select
              style={styles.input}
              value={form.defaultDocumentType}
              onChange={(e) => updateField("defaultDocumentType", e.target.value)}
            >
              <option value="tax_invoice">Tax Invoice</option>
              <option value="bill_of_supply">Bill Of Supply</option>
              <option value="proforma_invoice">Proforma Invoice</option>
              <option value="delivery_challan">Delivery Challan</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Default Transport Mode</label>
            <input
              style={styles.input}
              value={form.defaultTransportMode}
              onChange={(e) =>
                updateField("defaultTransportMode", e.target.value)
              }
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Default Supply Type</label>
            <input
              style={styles.input}
              value={form.defaultSupplyType}
              onChange={(e) => updateField("defaultSupplyType", e.target.value)}
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Footer Notes</label>
            <textarea
              style={styles.textarea}
              value={form.notesFooter}
              onChange={(e) => updateField("notesFooter", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Declaration Text</label>
            <textarea
              style={styles.textarea}
              value={form.declarationText}
              onChange={(e) => updateField("declarationText", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>GST, E-Invoice, And GSP Integration</h2>
        <p style={styles.subtitle}>
          Save the customer&apos;s preferred GSP or IRP credentials at the billing
          profile level, so each division can work with its own GST setup.
        </p>

        <div style={styles.banner}>
          Use this section for IRIS, NIC, Clear, Masters India, or any other
          provider that exposes GST lookup, IRN, and e-way bill APIs. Custom
          endpoint paths let you map the provider without changing backend code.
        </div>

        <div style={styles.toggleRow}>
          <label style={styles.toggleCard}>
            <input
              type="checkbox"
              checked={form.eInvoiceEnabled}
              onChange={(e) => updateField("eInvoiceEnabled", e.target.checked)}
            />
            <span>Enable e-invoice workflow</span>
          </label>
          <label style={styles.toggleCard}>
            <input
              type="checkbox"
              checked={form.eWayBillEnabled}
              onChange={(e) => updateField("eWayBillEnabled", e.target.checked)}
            />
            <span>Enable e-way bill workflow</span>
          </label>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Provider Name</label>
            <input
              style={styles.input}
              value={gstCompliance.provider}
              onChange={(e) =>
                updateGstComplianceField("provider", e.target.value)
              }
              placeholder="iris / nic / clear / generic"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Seller GSTIN For API</label>
            <input
              style={styles.input}
              value={gstCompliance.gstin}
              onChange={(e) => updateGstComplianceField("gstin", e.target.value)}
              placeholder="Falls back to billing GSTIN if left blank"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Base URL</label>
            <input
              style={styles.input}
              value={gstCompliance.baseUrl}
              onChange={(e) =>
                updateGstComplianceField("baseUrl", e.target.value)
              }
              placeholder="https://provider-base-url"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Auth URL</label>
            <input
              style={styles.input}
              value={gstCompliance.authUrl}
              onChange={(e) =>
                updateGstComplianceField("authUrl", e.target.value)
              }
              placeholder="https://provider-auth-url"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Auth Type</label>
            <select
              style={styles.input}
              value={gstCompliance.authType}
              onChange={(e) =>
                updateGstComplianceField("authType", e.target.value)
              }
            >
              <option value="body">Body</option>
              <option value="basic">Basic</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Timeout (ms)</label>
            <input
              style={styles.input}
              type="number"
              value={gstCompliance.timeoutMs}
              onChange={(e) =>
                updateGstComplianceField("timeoutMs", e.target.value)
              }
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Client ID</label>
            <input
              style={styles.input}
              value={gstCompliance.clientId}
              onChange={(e) =>
                updateGstComplianceField("clientId", e.target.value)
              }
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Client Secret</label>
            <input
              style={styles.input}
              type="password"
              value={gstCompliance.clientSecret}
              onChange={(e) =>
                updateGstComplianceField("clientSecret", e.target.value)
              }
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>API Username</label>
            <input
              style={styles.input}
              value={gstCompliance.username}
              onChange={(e) =>
                updateGstComplianceField("username", e.target.value)
              }
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>API Password</label>
            <input
              style={styles.input}
              type="password"
              value={gstCompliance.password}
              onChange={(e) =>
                updateGstComplianceField("password", e.target.value)
              }
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Token Path</label>
            <input
              style={styles.input}
              value={gstCompliance.tokenPath}
              onChange={(e) =>
                updateGstComplianceField("tokenPath", e.target.value)
              }
              placeholder="access_token"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Token Expiry Path</label>
            <input
              style={styles.input}
              value={gstCompliance.tokenExpiresInPath}
              onChange={(e) =>
                updateGstComplianceField("tokenExpiresInPath", e.target.value)
              }
              placeholder="expires_in"
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>GSTIN Lookup Path</label>
            <input
              style={styles.input}
              value={gstCompliance.endpoints.lookupGstin.path}
              onChange={(e) =>
                updateGstEndpoint("lookupGstin", "path", e.target.value)
              }
              placeholder="/gstin/{gstin}"
            />
            <div style={styles.hint}>
              Use placeholders like <code>{"{gstin}"}</code> when your provider
              expects values inside the URL path.
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>GSTIN Lookup Method</label>
            <select
              style={styles.input}
              value={gstCompliance.endpoints.lookupGstin.method}
              onChange={(e) =>
                updateGstEndpoint("lookupGstin", "method", e.target.value)
              }
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Generate E-Invoice Path</label>
            <input
              style={styles.input}
              value={gstCompliance.endpoints.generateEInvoice.path}
              onChange={(e) =>
                updateGstEndpoint("generateEInvoice", "path", e.target.value)
              }
              placeholder="/einvoice/generate"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Generate E-Invoice Method</label>
            <select
              style={styles.input}
              value={gstCompliance.endpoints.generateEInvoice.method}
              onChange={(e) =>
                updateGstEndpoint("generateEInvoice", "method", e.target.value)
              }
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </select>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Cancel E-Invoice Path</label>
            <input
              style={styles.input}
              value={gstCompliance.endpoints.cancelEInvoice.path}
              onChange={(e) =>
                updateGstEndpoint("cancelEInvoice", "path", e.target.value)
              }
              placeholder="/einvoice/cancel"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Cancel E-Invoice Method</label>
            <select
              style={styles.input}
              value={gstCompliance.endpoints.cancelEInvoice.method}
              onChange={(e) =>
                updateGstEndpoint("cancelEInvoice", "method", e.target.value)
              }
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Generate E-Way Bill Path</label>
            <input
              style={styles.input}
              value={gstCompliance.endpoints.generateEWayBill.path}
              onChange={(e) =>
                updateGstEndpoint("generateEWayBill", "path", e.target.value)
              }
              placeholder="/ewaybill/generate"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Generate E-Way Bill Method</label>
            <select
              style={styles.input}
              value={gstCompliance.endpoints.generateEWayBill.method}
              onChange={(e) =>
                updateGstEndpoint("generateEWayBill", "method", e.target.value)
              }
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </select>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Compliance Status Path</label>
            <input
              style={styles.input}
              value={gstCompliance.endpoints.getDocumentStatus.path}
              onChange={(e) =>
                updateGstEndpoint("getDocumentStatus", "path", e.target.value)
              }
              placeholder="/compliance/status"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Compliance Status Method</label>
            <select
              style={styles.input}
              value={gstCompliance.endpoints.getDocumentStatus.method}
              onChange={(e) =>
                updateGstEndpoint("getDocumentStatus", "method", e.target.value)
              }
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Default Headers (JSON)</label>
            <textarea
              style={styles.textarea}
              value={advancedJson.defaultHeaders}
              onChange={(e) =>
                setAdvancedJson((prev) => ({
                  ...prev,
                  defaultHeaders: e.target.value,
                }))
              }
              placeholder={`{\n  "x-api-key": "optional-key"\n}`}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Auth Payload Override (JSON)</label>
            <textarea
              style={styles.textarea}
              value={advancedJson.authPayload}
              onChange={(e) =>
                setAdvancedJson((prev) => ({
                  ...prev,
                  authPayload: e.target.value,
                }))
              }
              placeholder={`{\n  "client_id": "abc",\n  "client_secret": "xyz"\n}`}
            />
          </div>
        </div>

        <div style={styles.footer}>
          <button
            style={{ ...styles.button, ...styles.secondary }}
            onClick={() => navigate("/invoices")}
          >
            Back
          </button>
          <button
            style={{ ...styles.button, ...styles.primary }}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Billing Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BillingSetup;
