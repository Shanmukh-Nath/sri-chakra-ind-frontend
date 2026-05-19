import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../Purchases/Purchases.module.css";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";

const PAGE_SIZE = 50;

function formatDisplayDate(isoDate) {
  if (!isoDate || String(isoDate).length < 10) return "—";
  const s = String(isoDate).slice(0, 10);
  const [y, m, d] = s.split("-");
  return `${d}-${m}-${y}`;
}

function divisionQueryParams() {
  const currentDivisionId = localStorage.getItem("currentDivisionId");
  if (currentDivisionId && currentDivisionId !== "1") {
    return { divisionId: currentDivisionId };
  }
  if (currentDivisionId === "1") {
    return { showAllDivisions: "true" };
  }
  return {};
}

function ViewCoils() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [responseLimit, setResponseLimit] = useState(PAGE_SIZE);
  const [offset, setOffset] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const aliveRef = useRef(true);

  const [deletingId, setDeletingId] = useState(null);

  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        limit: PAGE_SIZE,
        offset,
        ...divisionQueryParams(),
      };
      if (fromDate.trim()) params.fromDate = fromDate.trim();
      if (toDate.trim()) params.toDate = toDate.trim();

      const res = await axiosAPI.get("/coils", params);
      if (!aliveRef.current) return;
      const body = res.data || {};
      const list = Array.isArray(body.data) ? body.data : [];
      setRows(list);
      setTotal(typeof body.total === "number" ? body.total : list.length);
      setResponseLimit(
        typeof body.limit === "number" ? body.limit : PAGE_SIZE,
      );
    } catch (e) {
      if (!aliveRef.current) return;
      setError(
        e.response?.data?.message ||
          e.message ||
          "Could not load coil records.",
      );
      setIsModalOpen(true);
      setRows([]);
      setTotal(0);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, [axiosAPI, offset, fromDate, toDate]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const canPrev = offset > 0;
  const canNext = offset + rows.length < total;

  const handleDelete = async (batch) => {
    const id = batch?.id;
    if (id == null) return;
    const ok = window.confirm(
      `Delete coil batch #${id}? This cannot be undone.`,
    );
    if (!ok) return;
    try {
      setDeletingId(id);
      setError("");
      await axiosAPI.delete(`/coils/${id}`);
      await fetchList();
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.message ||
          "Could not delete this batch.",
      );
      setIsModalOpen(true);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/products")}>Products</span>{" "}
        <i className="bi bi-chevron-right" /> View coils
      </p>

      <div className="row m-0 p-3 justify-content-between align-items-center flex-wrap gap-2">
        <h5 className={`${styles.head} mb-0`}>Saved coil batches</h5>
        <div className="d-flex flex-wrap gap-2">
          <button type="button" className={styles.addbtn} onClick={fetchList}>
            Refresh
          </button>
        </div>
      </div>

      <div className="row m-0 px-3 pb-2">
        <div className="col-12 col-xl-10 d-flex flex-wrap align-items-end gap-3">
          <div className={`${styles.longform} mb-0`}>
            <label>From date :</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setOffset(0);
              }}
            />
          </div>
          <div className={`${styles.longform} mb-0`}>
            <label>To date :</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setOffset(0);
              }}
            />
          </div>
        </div>
      </div>

      <div className="row m-0 px-3 pb-2 text-muted small">
        {total > 0
          ? `Showing ${offset + 1}–${offset + rows.length} of ${total} (limit ${responseLimit})`
          : !loading && "No batches in this range."}
      </div>

      <div className="row m-0 p-3 justify-content-center">
        <div className="col-12 col-xl-10">
          {loading ? (
            <Loading />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-bordered borderedtable">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Batch ID</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Employee</th>
                      <th>Coils / lines</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-4">
                          No coil batches found.
                        </td>
                      </tr>
                    ) : (
                      rows.map((b, i) => (
                        <tr key={b.id ?? i}>
                          <td>{offset + i + 1}</td>
                          <td>{b.id ?? "—"}</td>
                          <td>
                            {formatDisplayDate(
                              b.recordedDate ?? b.createdAt,
                            )}
                          </td>
                          <td>{b.recordedTime ?? "—"}</td>
                          <td className="small">
                            <div>{b.employeeId ?? "—"}</div>
                            {b.recordedByEmployeeId != null &&
                              String(b.recordedByEmployeeId) !==
                                String(b.employeeId) && (
                                <div className="text-muted">
                                  By user id: {b.recordedByEmployeeId}
                                </div>
                              )}
                          </td>
                          <td className="small">
                            {Array.isArray(b.coils) && b.coils.length > 0 ? (
                              b.coils.map((c, ci) => (
                                <div key={ci} className="mb-1">
                                  <strong>Coil {ci + 1}</strong> (
                                  {Array.isArray(c.items) ? c.items.length : 0}{" "}
                                  lines)
                                  {Array.isArray(c.items) &&
                                    c.items.map((it) => (
                                      <div
                                        key={
                                          it.id ??
                                          `${ci}-${it.sku}-${it.coilNumber}`
                                        }
                                        className="ms-2 text-muted"
                                      >
                                        {(it.sku ?? it.SKU) ?? "—"}:{" "}
                                        {it.coilSheet ?? "—"} /{" "}
                                        {it.coilNumber ?? "—"}
                                      </div>
                                    ))}
                                </div>
                              ))
                            ) : Array.isArray(b.items) ? (
                              b.items.map((it) => (
                                <div
                                  key={it.id ?? `${it.sku}-${it.coilNumber}`}
                                  className="text-muted"
                                >
                                  {(it.sku ?? it.SKU) ?? "—"}:{" "}
                                  {it.coilSheet ?? "—"} / {it.coilNumber ?? "—"}
                                </div>
                              ))
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="text-nowrap">
                            <div className="d-flex flex-wrap gap-1">
                              <button
                                type="button"
                                className={styles.addbtn}
                                disabled={
                                  b.id == null || deletingId === b.id
                                }
                                onClick={() =>
                                  navigate(`/coils/edit/${b.id}`)
                                }
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={styles.removebtn}
                                disabled={
                                  b.id == null || deletingId === b.id
                                }
                                onClick={() => handleDelete(b)}
                              >
                                {deletingId === b.id ? "…" : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2">
                <button
                  type="button"
                  className={styles.addbtn}
                  disabled={!canPrev}
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                >
                  Previous page
                </button>
                <button
                  type="button"
                  className={styles.addbtn}
                  disabled={!canNext}
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
                >
                  Next page
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </>
  );
}

export default ViewCoils;
