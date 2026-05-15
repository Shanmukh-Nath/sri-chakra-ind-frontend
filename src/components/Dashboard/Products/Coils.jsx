import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../Purchases/Purchases.module.css";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import LoadingAnimation from "@/components/LoadingAnimation";
import success from "../../../images/animations/SuccessAnimation.gif";

function readStoredUser() {
  try {
    const raw = JSON.parse(localStorage.getItem("user") || "null");
    return raw?.user || raw;
  } catch {
    return null;
  }
}

function formatDisplayDate(isoDate) {
  if (!isoDate || isoDate.length < 10) return "—";
  const [y, m, d] = isoDate.slice(0, 10).split("-");
  return `${d}-${m}-${y}`;
}

function lineUid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const emptyAddRow = () => ({
  selectedSKU: "",
  coilSheet: "",
  coilNumber: "",
});

function Coils() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const user = readStoredUser();

  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  const [apiProducts, setApiProducts] = useState([]);
  /** Each entry is one coil being built (multiple coils on screen at once). */
  const [draftCoils, setDraftCoils] = useState([
    { coilId: lineUid(), lines: [] },
  ]);
  /** Per-coil "add line" form values */
  const [addRowByCoil, setAddRowByCoil] = useState({});
  const [lineErrorsByCoil, setLineErrorsByCoil] = useState({});

  const [completedBatches, setCompletedBatches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successmsg, setSuccessmsg] = useState("");

  const closeModal = () => setIsModalOpen(false);

  const refreshDateTime = useCallback(() => {
    const now = new Date();
    const indianTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    );
    setCurrentDate(indianTime.toISOString().slice(0, 10));
    setCurrentTime(indianTime.toTimeString().slice(0, 5));
  }, []);

  useEffect(() => {
    refreshDateTime();
  }, [refreshDateTime]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        let productsEndpoint = "/products/list";
        if (currentDivisionId && currentDivisionId !== "1") {
          productsEndpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          productsEndpoint += `?showAllDivisions=true`;
        }
        const res = await axiosAPI.get(productsEndpoint);
        setApiProducts(res.data.products || []);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load products");
        setIsModalOpen(true);
      }
    };
    fetchProducts();
  }, [axiosAPI]);

  const getAddRow = (coilId) =>
    addRowByCoil[coilId] ? { ...emptyAddRow(), ...addRowByCoil[coilId] } : emptyAddRow();

  const patchAddRow = (coilId, patch) => {
    setAddRowByCoil((prev) => {
      const cur =
        prev[coilId] != null
          ? { ...emptyAddRow(), ...prev[coilId] }
          : emptyAddRow();
      return { ...prev, [coilId]: { ...cur, ...patch } };
    });
  };

  const onProductSelect = (coilId, e) => {
    const sku = e.target.value;
    patchAddRow(coilId, { selectedSKU: sku });
  };

  const handleAddLine = (coilId) => {
    const add = getAddRow(coilId);
    const errs = {};
    if (!add.selectedSKU) errs.sku = true;
    if (!add.coilSheet.trim()) errs.coilSheet = true;
    if (!add.coilNumber.trim()) errs.coilNumber = true;
    if (Object.keys(errs).length) {
      setLineErrorsByCoil((prev) => ({ ...prev, [coilId]: errs }));
      return;
    }

    const prod = apiProducts.find((p) => p.SKU === add.selectedSKU);
    const row = {
      lineId: lineUid(),
      productId: prod.id,
      SKU: prod.SKU,
      name: prod.name,
      unit: prod.unit,
      productType: prod.productType,
      packageWeight: prod.packageWeight,
      packageWeightUnit: prod.packageWeightUnit,
      coilSheet: add.coilSheet.trim(),
      coilNumber: add.coilNumber.trim(),
    };

    setDraftCoils((prev) =>
      prev.map((c) =>
        c.coilId === coilId ? { ...c, lines: [...c.lines, row] } : c,
      ),
    );
    setAddRowByCoil((prev) => ({ ...prev, [coilId]: emptyAddRow() }));
    setLineErrorsByCoil((prev) => {
      const next = { ...prev };
      delete next[coilId];
      return next;
    });
  };

  const handleRemoveLine = (coilId, lineId) => {
    setDraftCoils((prev) =>
      prev.map((c) =>
        c.coilId === coilId
          ? { ...c, lines: c.lines.filter((r) => r.lineId !== lineId) }
          : c,
      ),
    );
  };

  const handleAddAnotherCoil = () => {
    const id = lineUid();
    setDraftCoils((prev) => [...prev, { coilId: id, lines: [] }]);
  };

  const handleRemoveCoilSection = (coilId) => {
    if (draftCoils.length <= 1) return;
    setDraftCoils((prev) => prev.filter((c) => c.coilId !== coilId));
    setAddRowByCoil((prev) => {
      const next = { ...prev };
      delete next[coilId];
      return next;
    });
    setLineErrorsByCoil((prev) => {
      const next = { ...prev };
      delete next[coilId];
      return next;
    });
  };

  const itemsPayload = (lines) =>
    lines.map((l) => ({
      productId: l.productId,
      sku: l.SKU,
      coilSheet: l.coilSheet,
      coilNumber: l.coilNumber,
    }));

  const handleCreateCoils = async () => {
    const coilsToSubmit = draftCoils.filter((c) => c.lines.length > 0);
    if (coilsToSubmit.length === 0) {
      setError(
        "Add product lines to at least one coil (use + Add another coil for more).",
      );
      setIsModalOpen(true);
      return;
    }

    const basePayload = {
      recordedDate: currentDate,
      recordedTime: currentTime,
      employeeId: user?.employeeId ?? null,
    };

    const snapshot = coilsToSubmit.map((c) => ({
      coilId: c.coilId,
      lines: c.lines.map((l) => ({ ...l })),
    }));

    const pushCompletedLocal = (batchId, message) => {
      setCompletedBatches((prev) => [
        {
          batchId,
          recordedDate: currentDate,
          recordedTime: currentTime,
          coils: snapshot,
        },
        ...prev,
      ]);
      setDraftCoils([{ coilId: lineUid(), lines: [] }]);
      setAddRowByCoil({});
      setLineErrorsByCoil({});
      refreshDateTime();
      setSuccessmsg(message);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2400);
    };

    const errMsg = (e) =>
      e.response?.data?.message || e.message || "Could not save coil details.";

    try {
      setLoading(true);
      const batchBody = {
        ...basePayload,
        coils: coilsToSubmit.map((c) => ({ items: itemsPayload(c.lines) })),
      };

      const res = await axiosAPI.post("/coils/batch", batchBody);
      const message =
        res.data?.message ||
        `${coilsToSubmit.length} coil(s) recorded successfully.`;
      pushCompletedLocal(res.data?.id || lineUid(), message);
    } catch (e) {
      setError(errMsg(e));
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const unitLabel = (p) =>
    p?.productType === "packed"
      ? `packets (${p.packageWeight} ${p.packageWeightUnit})`
      : p?.unit ?? "—";

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/products")}>Products</span>{" "}
        <i className="bi bi-chevron-right" /> Coils
      </p>

      {!loading && !showSuccess && (
        <>
          <div className="row m-0 p-3">
            <div className={`col-3 ${styles.longform}`}>
              <label>Date :</label>
              <input type="date" value={currentDate} readOnly />
            </div>
            <div className={`col-3 ${styles.longform}`}>
              <label>Time :</label>
              <input type="text" value={currentTime} readOnly />
            </div>
            <div className={`col-3 ${styles.longform}`}>
              <label>User ID :</label>
              <input
                type="text"
                value={user?.employeeId ?? "—"}
                readOnly
              />
            </div>
          </div>

          <div className="row m-0 p-3 justify-content-center">
            <div className="col-12 col-xl-10 d-flex flex-wrap align-items-center gap-2 mb-2">
              <button
                type="button"
                className={styles.addbtn}
                onClick={handleAddAnotherCoil}
              >
                + Add another coil
              </button>
              <button
                type="button"
                className={styles.addbtn}
                onClick={() => navigate("/coils/view")}
              >
                VIEW COILS
              </button>
            </div>

            {draftCoils.map((coil, coilIndex) => {
              const add = getAddRow(coil.coilId);
              const errs = lineErrorsByCoil[coil.coilId] || {};
              const selectedProduct = apiProducts.find(
                (p) => p.SKU === add.selectedSKU,
              );

              return (
                <div
                  key={coil.coilId}
                  className="col-12 col-xl-10 mb-4 pb-3 border-bottom"
                >
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                    <h5 className={`${styles.head} mb-0`}>
                      Coil {coilIndex + 1}
                    </h5>
                    {draftCoils.length > 1 && (
                      <button
                        type="button"
                        className={`${styles.addbtn} text-danger`}
                        onClick={() => handleRemoveCoilSection(coil.coilId)}
                      >
                        Remove this coil
                      </button>
                    )}
                  </div>

                  <div className="table-responsive">
                    <table className="table table-bordered borderedtable">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>SKU</th>
                          <th>Name</th>
                          <th>Unit</th>
                          <th>Coil sheet</th>
                          <th>Coil number</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coil.lines.map((p, i) => (
                          <tr key={p.lineId}>
                            <td>{i + 1}</td>
                            <td>{p.SKU}</td>
                            <td>{p.name}</td>
                            <td>{unitLabel(p)}</td>
                            <td>{p.coilSheet}</td>
                            <td>{p.coilNumber}</td>
                            <td>
                              <button
                                type="button"
                                className={styles.removebtn}
                                onClick={() =>
                                  handleRemoveLine(coil.coilId, p.lineId)
                                }
                                aria-label="Remove line"
                              >
                                <i className="bi bi-trash3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr className={styles.tableform}>
                          <td>#</td>
                          <td colSpan={2}>
                            <select
                              value={add.selectedSKU}
                              onChange={(e) =>
                                onProductSelect(coil.coilId, e)
                              }
                              className={errs.sku ? styles.errorinput : ""}
                            >
                              <option value="">-- select product --</option>
                              {apiProducts.map((p) => (
                                <option key={p.SKU} value={p.SKU}>
                                  {p.SKU} — {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            {selectedProduct
                              ? unitLabel(selectedProduct)
                              : "—"}
                          </td>
                          <td>
                            <input
                              type="text"
                              value={add.coilSheet}
                              onChange={(e) =>
                                patchAddRow(coil.coilId, {
                                  coilSheet: e.target.value,
                                })
                              }
                              placeholder="Sheet / spec"
                              className={
                                errs.coilSheet ? styles.errorinput : ""
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={add.coilNumber}
                              onChange={(e) =>
                                patchAddRow(coil.coilId, {
                                  coilNumber: e.target.value,
                                })
                              }
                              placeholder="Coil no."
                              className={
                                errs.coilNumber ? styles.errorinput : ""
                              }
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.addbtn}
                              onClick={() => handleAddLine(coil.coilId)}
                            >
                              + Add line
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="row m-0 p-3 pt-2 justify-content-center">
            <div className="col-auto d-flex flex-wrap gap-2">
              <button
                type="button"
                className="submitbtn"
                onClick={handleCreateCoils}
              >
                Create coils
              </button>
              <button
                type="button"
                className="cancelbtn"
                onClick={() => navigate("/products")}
              >
                Cancel
              </button>
            </div>
          </div>

          {completedBatches.length > 0 && (
            <div className="row m-0 p-3 justify-content-center">
              <h5 className={styles.head}>Submitted batches (this session)</h5>
              <div className="col-12 col-xl-10">
                <table className="table table-bordered borderedtable table-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Coils / lines</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedBatches.map((b, idx) => (
                      <tr key={b.batchId}>
                        <td>{completedBatches.length - idx}</td>
                        <td>{formatDisplayDate(b.recordedDate)}</td>
                        <td>{b.recordedTime}</td>
                        <td>
                          {b.coils.map((c, ci) => (
                            <div key={c.coilId} className="small mb-1">
                              <strong>Coil {ci + 1}</strong> ({c.lines.length}{" "}
                              line{c.lines.length === 1 ? "" : "s"}):
                              {c.lines.map((l) => (
                                <div key={l.lineId} className="ms-2">
                                  {l.SKU}: {l.coilSheet} / {l.coilNumber}
                                </div>
                              ))}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showSuccess && <LoadingAnimation gif={success} msg={successmsg} />}
      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
      {loading && <Loading />}
    </>
  );
}

export default Coils;
