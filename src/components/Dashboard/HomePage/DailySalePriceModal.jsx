import React, { useCallback, useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import SuccessModal from "@/components/SuccessModal";
import ErrorModal from "@/components/ErrorModal";
import {
  buildDailySalePricesQuery,
  buildProductsListQuery,
  buildDailyPriceTableRows,
  buildSaveDailyPricesBody,
  extractDailySalePricesResponse,
  formatDisplayDate,
  getIstDateString,
  groupTableRowsForSave,
  computeSummaryFromTableRows,
} from "@/utils/dailySalePriceUtils";
import styles from "./DailySalePriceModal.module.css";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatInr(value) {
  const n = Number(value);
  if (value === "" || value == null || !Number.isFinite(n)) return "—";
  return inrFormatter.format(n);
}

export default function DailySalePriceModal({
  isOpen,
  onClose,
  divisionId,
  showAllDivisions,
  onSaved,
}) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadProducts = useCallback(async () => {
    if (!divisionId) return;
    try {
      setLoading(true);
      const istToday = getIstDateString();

      let productsList = [];
      const productsQuery = buildProductsListQuery(divisionId, showAllDivisions);
      const productEndpoints = [`/products${productsQuery}`, `/products/list${productsQuery}`];

      for (const endpoint of productEndpoints) {
        try {
          const productsRes = await axiosAPI.get(endpoint);
          const list = productsRes.data?.products ?? productsRes.data ?? [];
          if (Array.isArray(list) && list.length > 0) {
            productsList = list;
            break;
          }
          if (Array.isArray(list)) {
            productsList = list;
          }
        } catch (e) {
          console.warn(`DailySalePriceModal - ${endpoint} failed:`, e);
        }
      }

      let dailyProducts = [];
      try {
        const dailyRes = await axiosAPI.get(
          buildDailySalePricesQuery(divisionId, showAllDivisions, istToday),
        );
        const dailyData = extractDailySalePricesResponse(dailyRes.data);
        dailyProducts = dailyData.products ?? [];
      } catch (e) {
        if (e.response?.status !== 404) {
          console.warn("DailySalePriceModal - daily prices fetch failed:", e);
        }
      }

      setRows(buildDailyPriceTableRows(productsList, dailyProducts));
    } catch (e) {
      setErrorMessage(
        e.response?.data?.message ||
          e.message ||
          "Could not load products for daily prices.",
      );
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  }, [axiosAPI, divisionId, showAllDivisions]);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    } else {
      setSearch("");
    }
  }, [isOpen, loadProducts]);

  const updateUnitPrice = (productId, unit, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (String(row.productId) !== String(productId)) return row;
        return {
          ...row,
          units: row.units.map((u) =>
            u.unit === unit ? { ...u, dailyPrice: value } : u,
          ),
        };
      }),
    );
  };

  const filteredRows = rows.filter((row) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const unitMatch = (row.units || []).some((u) =>
      u.unit?.toLowerCase().includes(term),
    );
    return (
      row.name?.toLowerCase().includes(term) ||
      row.SKU?.toLowerCase().includes(term) ||
      unitMatch
    );
  });

  const handleSave = async () => {
    const grouped = groupTableRowsForSave(rows);
    if (!grouped.length) {
      setErrorMessage(
        "Enter today's price for at least one unit (per product unit price).",
      );
      setErrorOpen(true);
      return;
    }

    try {
      setSaving(true);
      const body = buildSaveDailyPricesBody(
        rows,
        divisionId,
        showAllDivisions,
        getIstDateString(),
      );
      const res = await axiosAPI.post("/dashboard/daily-sale-prices", body);
      let savedPayload = extractDailySalePricesResponse(res.data);
      const istToday = getIstDateString();
      if (
        !savedPayload.summary?.perMetre &&
        !savedPayload.summary?.perKg &&
        !savedPayload.summary?.perFeet
      ) {
        savedPayload = {
          ...savedPayload,
          summary: computeSummaryFromTableRows(rows),
        };
      }
      savedPayload = {
        ...savedPayload,
        updatedToday: true,
        lastUpdatedDate: savedPayload.lastUpdatedDate || istToday,
        recordedDate: savedPayload.recordedDate || istToday,
      };
      setSuccessMessage(
        `Daily unit prices saved for ${formatDisplayDate(getIstDateString())}.`,
      );
      setSuccessOpen(true);
      onSaved?.(savedPayload);
    } catch (e) {
      setErrorMessage(
        e.response?.data?.message ||
          e.message ||
          "Failed to save daily prices.",
      );
      setErrorOpen(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal show={isOpen} onHide={onClose} size="xl" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Update daily sale prices</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className={styles.hint}>
            Update today&apos;s selling rate for each product unit (
            {formatDisplayDate(getIstDateString())}). Unit price column shows
            the catalog rate from product setup.
          </p>

          <input
            type="search"
            className={styles.search}
            placeholder="Search by product name, SKU, or unit"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading ? (
            <Loading />
          ) : (
            <div className={styles.tableWrap}>
              <table className={`table table-bordered table-sm ${styles.table}`}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Unit prices (₹)</th>
                    <th>Today&apos;s prices (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, index) => (
                      <tr key={row.rowKey}>
                        <td>{index + 1}</td>
                        <td className={styles.productCell}>{row.name}</td>
                        <td>{row.SKU}</td>
                        <td>
                          <div className={styles.unitList}>
                            {(row.units || []).map((u) => (
                              <div key={u.unit} className={styles.unitRow}>
                                <span className={styles.unitBadge}>
                                  {u.unit}
                                </span>
                                <span className={styles.catalogPriceCell}>
                                  {formatInr(u.catalogPrice)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className={styles.unitList}>
                            {(row.units || []).map((u) => (
                              <div key={u.unit} className={styles.unitRow}>
                                <span className={styles.unitBadge}>
                                  {u.unit}
                                </span>
                                <div className={styles.todayInputWrap}>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={styles.priceInput}
                                    value={u.dailyPrice}
                                    onChange={(e) =>
                                      updateUnitPrice(
                                        row.productId,
                                        u.unit,
                                        e.target.value,
                                      )
                                    }
                                    placeholder={
                                      u.catalogPrice !== "" &&
                                      u.catalogPrice != null
                                        ? String(u.catalogPrice)
                                        : "0.00"
                                    }
                                  />
                                  {u.previousPrice != null &&
                                    u.previousPrice !== "" && (
                                      <div className={styles.prevPrice}>
                                        Last: {formatInr(u.previousPrice)}
                                      </div>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving…" : "Confirm & save"}
          </Button>
        </Modal.Footer>
      </Modal>

      <SuccessModal
        isOpen={successOpen}
        message={successMessage}
        onClose={() => {
          setSuccessOpen(false);
          onClose();
        }}
      />

      <ErrorModal
        isOpen={errorOpen}
        message={errorMessage}
        onClose={() => setErrorOpen(false)}
      />
    </>
  );
}

