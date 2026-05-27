import React, { useEffect, useState } from "react";
import { useAuth } from "@/Auth";
import { useDivision } from "@/components/context/DivisionContext";

function CurrentStock() {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();

  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [coilInventory, setCoilInventory] = useState([]);
  const [filteredCoilInventory, setFilteredCoilInventory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [coilSummary, setCoilSummary] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(10);

  const styles = {
    page: {
      padding: "30px",
      background: "linear-gradient(135deg,#eef2ff,#f8fafc)",
      minHeight: "100vh",
      fontFamily: "Inter, sans-serif",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px",
      gap: "16px",
      flexWrap: "wrap",
    },
    title: {
      fontSize: "28px",
      fontWeight: 700,
      color: "#111827",
    },
    sectionTitle: {
      fontSize: "20px",
      fontWeight: 700,
      color: "#111827",
      margin: "28px 0 14px",
    },
    searchBox: {
      padding: "10px 14px",
      borderRadius: "10px",
      border: "1px solid #e5e7eb",
      width: "280px",
      outline: "none",
      transition: "0.2s ease",
    },
    cardGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "20px",
      marginBottom: "30px",
    },
    statCard: {
      padding: "20px",
      borderRadius: "16px",
      color: "#fff",
      boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    },
    filterBar: {
      display: "flex",
      gap: "20px",
      marginBottom: "20px",
      alignItems: "center",
      flexWrap: "wrap",
    },
    select: {
      padding: "10px",
      borderRadius: "10px",
      border: "1px solid #e5e7eb",
      background: "#fff",
      minWidth: "180px",
    },
    tableWrapper: {
      background: "#fff",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 15px 40px rgba(0,0,0,0.05)",
      marginBottom: "22px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    th: {
      padding: "14px",
      textAlign: "left",
      fontSize: "14px",
      fontWeight: 600,
      background: "#f9fafb",
      borderBottom: "1px solid #e5e7eb",
    },
    td: {
      padding: "14px",
      borderBottom: "1px solid #f3f4f6",
      fontSize: "14px",
      verticalAlign: "top",
    },
    quantityBlock: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    quantityPrimary: {
      fontWeight: 700,
      color: "#111827",
    },
    quantityHint: {
      fontSize: "12px",
      color: "#6b7280",
    },
    badge: {
      padding: "5px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#fff",
      textTransform: "capitalize",
      display: "inline-block",
    },
    helpBox: {
      marginBottom: "20px",
      padding: "16px 18px",
      borderRadius: "16px",
      background: "linear-gradient(135deg,#fff7ed,#eff6ff)",
      border: "1px solid #dbeafe",
      color: "#334155",
      lineHeight: 1.7,
      fontSize: "13px",
    },
    loadingOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(255,255,255,0.7)",
      backdropFilter: "blur(4px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999,
    },
    spinner: {
      width: "60px",
      height: "60px",
      border: "6px solid #e5e7eb",
      borderTop: "6px solid #6366f1",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
  };

  useEffect(() => {
    if (selectedDivision?.id || showAllDivisions) {
      fetchCurrentStock();
    }
  }, [selectedDivision?.id, showAllDivisions]);

  const fetchCurrentStock = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (showAllDivisions) params.showAllDivisions = true;
      else if (selectedDivision?.id) params.divisionId = selectedDivision.id;

      const [stockRes, coilRes] = await Promise.all([
        axiosAPI.get("/inventory/current-stock", { params }),
        axiosAPI.get("/inventory/coil-stock-summary", { params }),
      ]);

      const stockData = stockRes.data.inventory || [];
      const coilData = coilRes.data.data || [];

      setInventory(stockData);
      setFilteredInventory(stockData);
      setCoilInventory(coilData);
      setFilteredCoilInventory(coilData);
      setSummary(stockRes.data.summary || null);
      setCoilSummary(coilRes.data.summary || null);
      setWarehouses(stockRes.data.filters?.warehouses || []);
    } catch (err) {
      setError("Failed to load stock");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let stockRows = [...inventory];
    let coilRows = [...coilInventory];

    if (selectedWarehouse) {
      stockRows = stockRows.filter(
        (item) => item.warehouse?.id === Number(selectedWarehouse),
      );
      coilRows = coilRows.filter(
        (item) => item.warehouseId === Number(selectedWarehouse),
      );
    }

    if (search) {
      const lower = search.toLowerCase();

      stockRows = stockRows.filter(
        (item) =>
          item.product?.name?.toLowerCase().includes(lower) ||
          item.product?.SKU?.toLowerCase().includes(lower),
      );

      coilRows = coilRows.filter((item) =>
        [
          item.productName,
          item.productSKU,
          item.coilNumber,
          item.coilSheet,
          item.warehouseName,
          item.steelConfig?.brand,
          item.steelConfig?.grade,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(lower)),
      );
    }

    setFilteredInventory(stockRows);
    setFilteredCoilInventory(coilRows);
  }, [selectedWarehouse, search, inventory, coilInventory]);

  const getStatusBadge = (status) => {
    const base = { ...styles.badge };
    if (status === "low") return { ...base, background: "#f59e0b" };
    if (status === "critical") return { ...base, background: "#ef4444" };
    if (status === "out_of_stock") return { ...base, background: "#b91c1c" };
    return { ...base, background: "#10b981" };
  };

  const getCoilStatusBadge = (status) => {
    const base = { ...styles.badge };
    if (status === "consumed") return { ...base, background: "#1f2937" };
    if (status === "reserved") return { ...base, background: "#f59e0b" };
    if (status === "over_reserved") return { ...base, background: "#dc2626" };
    return { ...base, background: "#0ea5e9" };
  };

  const formatDerivedMetrics = (metrics = []) =>
    metrics
      .slice(0, 2)
      .map(
        (metric) =>
          `${Number(metric.quantity || 0).toLocaleString("en-IN", {
            maximumFractionDigits: 2,
          })} ${metric.unit}`,
      )
      .join(" | ");

  const formatKg = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 3,
    });

  const coilSpecLabel = (steelConfig = {}) =>
    [
      steelConfig.brand,
      steelConfig.thicknessMm ? `${steelConfig.thicknessMm} mm` : null,
      steelConfig.widthMm ? `${steelConfig.widthMm} mm` : null,
      steelConfig.grade,
    ]
      .filter(Boolean)
      .join(" | ") || "-";

  const filteredCoilTotals = {
    physicalRemainingKg: filteredCoilInventory.reduce(
      (sum, item) => sum + Number(item.physicalRemainingKg || 0),
      0,
    ),
    reservedQuantityKg: filteredCoilInventory.reduce(
      (sum, item) => sum + Number(item.reservedQuantityKg || 0),
      0,
    ),
    availableToPlanKg: filteredCoilInventory.reduce(
      (sum, item) => sum + Number(item.availableToPlanKg || 0),
      0,
    ),
  };

  return (
    <div style={styles.page}>
      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner}></div>
        </div>
      )}

      {error && <div>{error}</div>}

      <div style={styles.header}>
        <div style={styles.title}>Current Stock</div>

        <input
          type="text"
          placeholder="Search product, SKU, or coil..."
          style={styles.searchBox}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={styles.helpBox}>
        Stock is controlled in one stock-keeping unit, but this page also shows
        business-friendly views using each product&apos;s conversion rules. For
        steel operations, the coil section below helps planners see each coil as
        its own usable stock bucket instead of only a combined product balance.
      </div>

      {summary && (
        <div style={styles.cardGrid}>
          <div
            style={{
              ...styles.statCard,
              background: "linear-gradient(135deg,#6366f1,#4f46e5)",
            }}
          >
            <div>Total Products</div>
            <h2>
              {new Set(filteredInventory.map((item) => item.productId)).size}
            </h2>
          </div>

          <div
            style={{
              ...styles.statCard,
              background: "linear-gradient(135deg,#10b981,#059669)",
            }}
          >
            <div>Total Quantity</div>
            <h2>{summary.currentStockQuantityKg}</h2>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>kg in stock</div>
          </div>

          <div
            style={{
              ...styles.statCard,
              background: "linear-gradient(135deg,#f59e0b,#d97706)",
            }}
          >
            <div>Low Stock</div>
            <h2>
              {filteredInventory.filter((item) => item.stockStatus === "low").length}
            </h2>
          </div>

          <div
            style={{
              ...styles.statCard,
              background: "linear-gradient(135deg,#ef4444,#dc2626)",
            }}
          >
            <div>Critical</div>
            <h2>
              {
                filteredInventory.filter((item) => item.stockStatus === "critical")
                  .length
              }
            </h2>
          </div>

          <div
            style={{
              ...styles.statCard,
              background: "linear-gradient(135deg,#06b6d4,#0891b2)",
            }}
          >
            <div>Total Value</div>
            <h2>
              Rs.
              {filteredInventory
                .reduce((sum, item) => sum + Number(item.stockValue || 0), 0)
                .toLocaleString("en-IN")}
            </h2>
          </div>
        </div>
      )}

      <div style={styles.filterBar}>
        <select
          style={styles.select}
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
        >
          <option value="">All Warehouses</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </select>

        <select
          style={styles.select}
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value, 10))}
        >
          <option value={10}>10 Rows</option>
          <option value={20}>20 Rows</option>
          <option value={50}>50 Rows</option>
          <option value={100}>100 Rows</option>
        </select>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Steel Spec</th>
              <th style={styles.th}>SKU</th>
              <th style={styles.th}>Warehouse</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Measure</th>
              <th style={styles.th}>Value</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  style={{ textAlign: "center", padding: "30px" }}
                >
                  No stock found
                </td>
              </tr>
            ) : (
              filteredInventory.slice(0, limit).map((item, index) => (
                <tr key={item.id}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>
                    <div style={styles.quantityBlock}>
                      <span style={styles.quantityPrimary}>{item.product?.name}</span>
                      <span style={styles.quantityHint}>
                        {(item.product?.productFamily || "general").replaceAll("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td style={styles.td}>{coilSpecLabel(item.product?.steelConfig)}</td>
                  <td style={styles.td}>{item.product?.SKU}</td>
                  <td style={styles.td}>{item.warehouse?.name}</td>
                  <td style={styles.td}>
                    <div style={styles.quantityBlock}>
                      <span style={styles.quantityPrimary}>
                        {Number(item.stockQuantity || 0).toLocaleString("en-IN", {
                          maximumFractionDigits: 3,
                        })}{" "}
                        {item.product?.inventoryUnit || "kg"}
                      </span>
                      {item.derivedMetrics?.length > 0 && (
                        <span style={styles.quantityHint}>
                          {formatDerivedMetrics(item.derivedMetrics)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {item.product?.measurementType || item.product?.unit || "-"}
                  </td>
                  <td style={styles.td}>
                    Rs.{Number(item.stockValue || 0).toLocaleString("en-IN")}
                  </td>
                  <td style={styles.td}>
                    <span style={getStatusBadge(item.stockStatus)}>
                      {item.stockStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.sectionTitle}>Coil Inventory</div>
      <div style={styles.helpBox}>
        Physical remaining is coil-tagged inward stock minus coil-tagged outward
        movement. Reserved comes from open sales orders that already selected a
        coil number. Available to plan is what is still free for the next order
        or production cut.
      </div>

      {coilSummary && (
        <div style={styles.cardGrid}>
          <div
            style={{
              ...styles.statCard,
              background: "linear-gradient(135deg,#0f766e,#0d9488)",
            }}
          >
            <div>Tracked Coils</div>
            <h2>{filteredCoilInventory.length}</h2>
          </div>

          <div
            style={{
              ...styles.statCard,
              background: "linear-gradient(135deg,#0369a1,#0284c7)",
            }}
          >
            <div>Physical Remaining</div>
            <h2>{formatKg(filteredCoilTotals.physicalRemainingKg)}</h2>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>kg across coils</div>
          </div>

          <div
            style={{
              ...styles.statCard,
              background: "linear-gradient(135deg,#b45309,#d97706)",
            }}
          >
            <div>Reserved</div>
            <h2>{formatKg(filteredCoilTotals.reservedQuantityKg)}</h2>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>kg in open orders</div>
          </div>

          <div
            style={{
              ...styles.statCard,
              background: "linear-gradient(135deg,#166534,#16a34a)",
            }}
          >
            <div>Available To Plan</div>
            <h2>{formatKg(filteredCoilTotals.availableToPlanKg)}</h2>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>kg free for next job</div>
          </div>
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Coil Number</th>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Steel Spec</th>
              <th style={styles.th}>Warehouse</th>
              <th style={styles.th}>Received</th>
              <th style={styles.th}>Issued</th>
              <th style={styles.th}>Reserved</th>
              <th style={styles.th}>Remaining</th>
              <th style={styles.th}>Available</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoilInventory.length === 0 ? (
              <tr>
                <td
                  colSpan="11"
                  style={{ textAlign: "center", padding: "30px" }}
                >
                  No coil-tracked stock found
                </td>
              </tr>
            ) : (
              filteredCoilInventory.slice(0, limit).map((item, index) => (
                <tr key={item.key || `${item.productId}-${item.coilNumber}-${index}`}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>
                    <div style={styles.quantityBlock}>
                      <span style={styles.quantityPrimary}>
                        {item.coilNumber || "-"}
                      </span>
                      <span style={styles.quantityHint}>{item.coilSheet || "-"}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.quantityBlock}>
                      <span style={styles.quantityPrimary}>{item.productName}</span>
                      <span style={styles.quantityHint}>{item.productSKU || "-"}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{coilSpecLabel(item.steelConfig)}</td>
                  <td style={styles.td}>{item.warehouseName || "-"}</td>
                  <td style={styles.td}>{formatKg(item.receivedQuantityKg)} kg</td>
                  <td style={styles.td}>{formatKg(item.issuedQuantityKg)} kg</td>
                  <td style={styles.td}>{formatKg(item.reservedQuantityKg)} kg</td>
                  <td style={styles.td}>{formatKg(item.physicalRemainingKg)} kg</td>
                  <td style={styles.td}>{formatKg(item.availableToPlanKg)} kg</td>
                  <td style={styles.td}>
                    <span style={getCoilStatusBadge(item.status)}>
                      {String(item.status || "available").replaceAll("_", " ")}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CurrentStock;
