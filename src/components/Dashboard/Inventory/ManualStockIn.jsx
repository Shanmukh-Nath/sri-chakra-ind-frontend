import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  Truck,
  Warehouse,
} from "lucide-react";
import { FaRupeeSign } from "react-icons/fa";
import { useAuth } from "@/Auth";
import SuccessModal from "@/components/SuccessModal";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";

const MotionDiv = motion.div;

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background:
      "radial-gradient(circle at top left, #fff4d6 0%, #f7fbff 38%, #eef8f1 100%)",
    fontFamily: "'Segoe UI', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    gap: "16px",
    flexWrap: "wrap",
  },
  hero: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  heroIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #ff8a00, #ffbd59)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 14px 28px rgba(255, 138, 0, 0.24)",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
    color: "#0f172a",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: "14px",
    color: "#475569",
    maxWidth: "640px",
    lineHeight: 1.6,
  },
  backBtn: {
    border: "1px solid #d6e1ef",
    background: "#fff",
    borderRadius: "12px",
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    color: "#0f172a",
    fontWeight: 600,
  },
  card: {
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(203, 213, 225, 0.75)",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.06)",
    marginBottom: "22px",
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "0 0 16px",
    color: "#0f172a",
    fontWeight: 700,
    fontSize: "18px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    color: "#475569",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    borderRadius: "12px",
    border: "1px solid #d7e3ef",
    background: "#fff",
    padding: "12px 14px",
    fontSize: "14px",
    color: "#0f172a",
    outline: "none",
  },
  textarea: {
    minHeight: "92px",
    resize: "vertical",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  searchWrap: {
    position: "relative",
    maxWidth: "360px",
    width: "100%",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748b",
  },
  searchInput: {
    paddingLeft: "40px",
  },
  itemHeaderRow: {
    display: "grid",
    gridTemplateColumns:
      "minmax(200px, 2fr) minmax(90px, 1fr) minmax(90px, 1fr) minmax(100px, 1fr) minmax(110px, 1fr) minmax(110px, 1fr) 90px 52px",
    gap: "10px",
    alignItems: "center",
    marginBottom: "8px",
    padding: "0 2px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  itemRow: {
    display: "grid",
    gridTemplateColumns:
      "minmax(200px, 2fr) minmax(90px, 1fr) minmax(90px, 1fr) minmax(100px, 1fr) minmax(110px, 1fr) minmax(110px, 1fr) 90px 52px",
    gap: "10px",
    alignItems: "center",
    marginBottom: "12px",
  },
  inlineValue: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 700,
    color: "#0f172a",
  },
  deleteBtn: {
    border: "none",
    borderRadius: "12px",
    background: "#ffe4e6",
    color: "#be123c",
    padding: "10px",
    cursor: "pointer",
  },
  addBtn: {
    border: "none",
    borderRadius: "12px",
    background: "#fff1cf",
    color: "#92400e",
    padding: "12px 16px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 700,
    cursor: "pointer",
  },
  summary: {
    marginTop: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "18px 20px",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    color: "#fff",
    borderRadius: "18px",
    flexWrap: "wrap",
  },
  summaryLabel: {
    fontSize: "13px",
    opacity: 0.8,
    marginBottom: "4px",
  },
  summaryValue: {
    fontSize: "24px",
    fontWeight: 700,
  },
  submitArea: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
  },
  primaryBtn: {
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
    color: "#fff",
    padding: "14px 22px",
    fontWeight: 700,
    cursor: "pointer",
    minWidth: "220px",
    boxShadow: "0 16px 30px rgba(37, 99, 235, 0.24)",
  },
  mutedBox: {
    padding: "14px 16px",
    borderRadius: "14px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "13px",
    lineHeight: 1.6,
    border: "1px dashed #cbd5e1",
  },
  infoBox: {
    padding: "14px 16px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #fff7ed, #eff6ff)",
    color: "#475569",
    fontSize: "13px",
    lineHeight: 1.7,
    border: "1px solid #dbeafe",
    marginBottom: "16px",
  },
};

function ManualStockIn({ navigate }) {
  const { axiosAPI } = useAuth();

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    warehouseId: "",
    supplierName: "",
    supplierInvoiceNumber: "",
    supplierInvoiceDate: "",
    transactionDate: new Date().toISOString().slice(0, 10),
    vehicleNumber: "",
    referenceNumber: "",
    reason: "",
    remarks: "",
  });
  const emptyItem = () => ({
    productId: "",
    quantity: "",
    unit: "",
    unitCost: "",
    coilSheet: "",
    coilNumber: "",
  });
  const [items, setItems] = useState([emptyItem()]);

  useEffect(() => {
    async function load() {
      const [warehousesRes, productsRes] = await Promise.all([
        axiosAPI.get("/warehouses", { params: { divisionId: "all" } }),
        axiosAPI.get("/products", { params: { divisionId: "all" } }),
      ]);

      setWarehouses(warehousesRes.data.warehouses || []);
      setProducts(productsRes.data.products || []);
    }

    load();
  }, [axiosAPI]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;

    return products.filter((product) => {
      const name = product.name?.toLowerCase() || "";
      const sku = product.SKU?.toLowerCase() || "";
      return name.includes(term) || sku.includes(term);
    });
  }, [products, search]);

  const totalValue = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (Number(item.quantity || 0) || 0) * (Number(item.unitCost || 0) || 0),
        0,
      ),
    [items],
  );

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProductSelect = (index, productId) => {
    const product = products.find((entry) => String(entry.id) === String(productId));
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex !== index
          ? item
          : {
              ...item,
              productId,
              unit: product?.inventoryUnit || product?.defaultUnit || product?.unit || "kg",
              unitCost: product?.purchasePrice || "",
            },
      ),
    );
  };

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addRow = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeRow = (index) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const resetForm = () => {
    setForm({
      warehouseId: "",
      supplierName: "",
      supplierInvoiceNumber: "",
      supplierInvoiceDate: "",
      transactionDate: new Date().toISOString().slice(0, 10),
      vehicleNumber: "",
      referenceNumber: "",
      reason: "",
      remarks: "",
    });
    setItems([emptyItem()]);
    setSearch("");
  };

  const showError = (message) => {
    setErrorMessage(message);
    setIsErrorModalOpen(true);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setIsSuccessModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.warehouseId || !form.reason || form.reason.trim().length < 5) {
      showError(
        "Select warehouse and enter a clear reason with at least 5 characters.",
      );
      return;
    }

    const cleanItems = items
      .filter((item) => item.productId && item.quantity)
      .map((item) => {
        const product = products.find(
          (entry) => String(entry.id) === String(item.productId),
        );
        const payload = {
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unit: item.unit || "kg",
          unitCost: item.unitCost ? Number(item.unitCost) : null,
        };
        const sheet = item.coilSheet?.trim();
        const number = item.coilNumber?.trim();
        if (sheet) payload.coilSheet = sheet;
        if (number) payload.coilNumber = number;
        if (product?.SKU) payload.sku = product.SKU;
        return payload;
      });

    if (!cleanItems.length) {
      showError("Add at least one valid product line.");
      return;
    }

    const coilLinesForBatch = cleanItems.filter(
      (item) => item.coilSheet && item.coilNumber,
    );
    const coilLinesPartial = cleanItems.filter(
      (item) =>
        (item.coilSheet && !item.coilNumber) ||
        (!item.coilSheet && item.coilNumber),
    );
    if (coilLinesPartial.length) {
      showError(
        "Each stock line with coil tracking needs both Coil sheet and Coil number, or leave both empty.",
      );
      return;
    }

    try {
      setLoading(true);

      if (coilLinesForBatch.length > 0) {
        let storedUser = null;
        try {
          const raw = JSON.parse(localStorage.getItem("user") || "null");
          storedUser = raw?.user || raw;
        } catch {
          storedUser = null;
        }
        const now = new Date();
        const indianTime = new Date(
          now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        );
        await axiosAPI.post("/coils/batch", {
          recordedDate: form.transactionDate || indianTime.toISOString().slice(0, 10),
          recordedTime: indianTime.toTimeString().slice(0, 5),
          employeeId: storedUser?.employeeId ?? null,
          coils: [
            {
              items: coilLinesForBatch.map((item) => ({
                productId: item.productId,
                sku: item.sku,
                coilSheet: item.coilSheet,
                coilNumber: item.coilNumber,
              })),
            },
          ],
        });
      }

      await axiosAPI.post("/warehouses/inventory/manual-stock-in", {
        warehouseId: Number(form.warehouseId),
        supplierName: form.supplierName || null,
        supplierInvoiceNumber: form.supplierInvoiceNumber || null,
        supplierInvoiceDate: form.supplierInvoiceDate || null,
        transactionDate: form.transactionDate || null,
        vehicleNumber: form.vehicleNumber || null,
        referenceNumber: form.referenceNumber || null,
        reason: form.reason,
        remarks: form.remarks || null,
        items: cleanItems,
      });

      const coilNote =
        coilLinesForBatch.length > 0
          ? ` ${coilLinesForBatch.length} coil line(s) were registered.`
          : "";
      showSuccess(`Direct stock in created successfully.${coilNote}`);
      resetForm();
    } catch (error) {
      showError(
        error?.response?.data?.message || "Failed to complete direct stock in",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <MotionDiv
        style={styles.header}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={styles.hero}>
          <div style={styles.heroIcon}>
            <PackagePlus size={28} />
          </div>
          <div>
            <h1 style={styles.title}>Direct Stock In</h1>
            <p style={styles.subtitle}>
              Record supplier stock directly into inventory with bill date, truck
              reference, and item-wise cost so today&apos;s stock and backdated stock
              stay clean for billing.
            </p>
          </div>
        </div>

        <button style={styles.backBtn} onClick={() => navigate("/inventory")}>
          <ArrowLeft size={18} />
          Back
        </button>
      </MotionDiv>

      <MotionDiv style={styles.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 style={styles.cardTitle}>
          <Warehouse size={18} />
          Stock Entry Details
        </h2>
        <div style={styles.infoBox}>
          Use supplier-facing quantities here, but make sure the product has correct conversion rules first. If a roofing sheet is stocked in kg and sold by sheet or rmt, the product setup should define that once so stock and billing both stay correct.
        </div>

        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Warehouse</label>
            <select
              style={styles.input}
              value={form.warehouseId}
              onChange={(e) => updateForm("warehouseId", e.target.value)}
            >
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Supplier Name</label>
            <input
              style={styles.input}
              value={form.supplierName}
              onChange={(e) => updateForm("supplierName", e.target.value)}
              placeholder="JSW Steel, vendor, mill name"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Supplier Invoice No.</label>
            <input
              style={styles.input}
              value={form.supplierInvoiceNumber}
              onChange={(e) => updateForm("supplierInvoiceNumber", e.target.value)}
              placeholder="Enter supplier bill number"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="supplierInvoiceDate">
              Supplier Invoice Date
            </label>
            <input
              id="supplierInvoiceDate"
              style={styles.input}
              type="date"
              value={form.supplierInvoiceDate}
              onChange={(e) => updateForm("supplierInvoiceDate", e.target.value)}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Stock Transaction Date</label>
            <input
              style={styles.input}
              type="date"
              value={form.transactionDate}
              onChange={(e) => updateForm("transactionDate", e.target.value)}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Vehicle Number</label>
            <div style={{ position: "relative" }}>
              <Truck size={16} style={{ position: "absolute", right: 14, top: 14, color: "#64748b" }} />
              <input
                style={styles.input}
                value={form.vehicleNumber}
                onChange={(e) => updateForm("vehicleNumber", e.target.value)}
                placeholder="Truck / lorry number"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Reference Number</label>
            <input
              style={styles.input}
              value={form.referenceNumber}
              onChange={(e) => updateForm("referenceNumber", e.target.value)}
              placeholder="PO ref / LR no / challan ref"
            />
          </div>
        </div>

        <div style={{ ...styles.grid, marginTop: "16px" }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Reason</label>
            <input
              style={styles.input}
              value={form.reason}
              onChange={(e) => updateForm("reason", e.target.value)}
              placeholder="Example: JSW direct stock receipt for roofing sheet order"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Remarks</label>
            <textarea
              style={{ ...styles.input, ...styles.textarea }}
              value={form.remarks}
              onChange={(e) => updateForm("remarks", e.target.value)}
              placeholder="Any loading, material, or QC note for billing and stock team"
            />
          </div>
        </div>
      </MotionDiv>

      <MotionDiv style={styles.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={styles.itemHeader}>
          <h2 style={styles.cardTitle}>
            <FileText size={18} />
            Item Lines
          </h2>

          <div style={styles.searchWrap}>
            <Search size={16} style={styles.searchIcon} />
            <input
              style={{ ...styles.input, ...styles.searchInput }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product by name or SKU"
            />
          </div>
        </div>

        <div style={styles.itemHeaderRow}>
          <span>Product</span>
          <span>Qty</span>
          <span>Unit</span>
          <span>Rate</span>
          <span>Coil sheet</span>
          <span>Coil number</span>
          <span>Line total</span>
          <span />
        </div>

        {items.map((item, index) => {
          const selectedProduct = products.find(
            (product) => String(product.id) === String(item.productId),
          );
          const supportedUnits =
            selectedProduct?.supportedUnits?.length
              ? selectedProduct.supportedUnits
              : [selectedProduct?.inventoryUnit || selectedProduct?.unit || "kg"];

          return (
            <div key={`${index}-${item.productId || "new"}`} style={styles.itemRow}>
              <select
                style={styles.input}
                value={item.productId}
                onChange={(e) => handleProductSelect(index, e.target.value)}
              >
                <option value="">Select product</option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.SKU})
                  </option>
                ))}
              </select>

              <input
                style={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                placeholder="Qty"
              />

              <select
                style={styles.input}
                value={item.unit}
                onChange={(e) => updateItem(index, "unit", e.target.value)}
              >
                {supportedUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>

              <input
                style={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={item.unitCost}
                onChange={(e) => updateItem(index, "unitCost", e.target.value)}
                placeholder="Rate"
              />

              <input
                style={styles.input}
                value={item.coilSheet}
                onChange={(e) => updateItem(index, "coilSheet", e.target.value)}
                placeholder="Sheet / spec"
              />

              <input
                style={styles.input}
                value={item.coilNumber}
                onChange={(e) => updateItem(index, "coilNumber", e.target.value)}
                placeholder="Coil no."
              />

              <div style={styles.inlineValue}>
                <FaRupeeSign size={13} />
                {(
                  (Number(item.quantity || 0) || 0) * (Number(item.unitCost || 0) || 0)
                ).toFixed(2)}
              </div>

              <button style={styles.deleteBtn} onClick={() => removeRow(index)}>
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}

        <button style={styles.addBtn} onClick={addRow}>
          <Plus size={16} />
          Add another line
        </button>

        <div style={styles.summary}>
          <div>
            <div style={styles.summaryLabel}>Estimated inward stock value</div>
            <div style={styles.summaryValue}>Rs. {totalValue.toFixed(2)}</div>
          </div>
          <div style={styles.mutedBox}>
            Use this screen for supplier stock receipts. Use stock adjustment only for
            correction entries, shortages, excess, or audit differences.
          </div>
        </div>
      </MotionDiv>

      <div style={styles.submitArea}>
        <button style={styles.backBtn} onClick={resetForm}>
          Reset
        </button>
        <button style={styles.primaryBtn} onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving direct stock in..." : "Confirm Direct Stock In"}
        </button>
      </div>

      {loading && <Loading />}

      <SuccessModal
        isOpen={isSuccessModalOpen}
        message={successMessage}
        onClose={() => setIsSuccessModalOpen(false)}
      />

      <ErrorModal
        isOpen={isErrorModalOpen}
        message={errorMessage}
        onClose={() => setIsErrorModalOpen(false)}
      />
    </div>
  );
}


export default ManualStockIn;
