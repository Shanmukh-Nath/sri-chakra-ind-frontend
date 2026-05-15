import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

function lineUid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const emptyAddRow = () => ({
  selectedSKU: "",
  coilSheet: "",
  coilNumber: "",
});

function enrichLineFromItem(item, apiProducts) {
  const prod = apiProducts.find(
    (p) => String(p.id) === String(item.productId),
  );
  return {
    lineId: lineUid(),
    productId: item.productId,
    SKU: item.sku ?? item.SKU ?? prod?.SKU ?? "",
    name: prod?.name ?? item.sku ?? item.SKU ?? "—",
    unit: prod?.unit,
    productType: prod?.productType,
    packageWeight: prod?.packageWeight,
    packageWeightUnit: prod?.packageWeightUnit,
    coilSheet: item.coilSheet ?? "",
    coilNumber: item.coilNumber ?? "",
  };
}

function batchToDraftCoils(batch, apiProducts) {
  const coils = Array.isArray(batch?.coils) ? batch.coils : [];
  if (coils.length === 0) {
    const flat = Array.isArray(batch?.items) ? batch.items : [];
    if (flat.length === 0) {
      return [{ coilId: lineUid(), lines: [] }];
    }
    return [
      {
        coilId: lineUid(),
        lines: flat.map((it) => enrichLineFromItem(it, apiProducts)),
      },
    ];
  }
  return coils.map((c) => ({
    coilId: lineUid(),
    lines: (Array.isArray(c.items) ? c.items : []).map((it) =>
      enrichLineFromItem(it, apiProducts),
    ),
  }));
}

function EditCoilBatch() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const user = readStoredUser();

  const [pageLoading, setPageLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [apiProducts, setApiProducts] = useState([]);
  const [draftCoils, setDraftCoils] = useState([
    { coilId: lineUid(), lines: [] },
  ]);
  const [addRowByCoil, setAddRowByCoil] = useState({});
  const [lineErrorsByCoil, setLineErrorsByCoil] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successmsg, setSuccessmsg] = useState("");

  const closeModal = () => setIsModalOpen(false);

  const getAddRow = (coilId) =>
    addRowByCoil[coilId]
      ? { ...emptyAddRow(), ...addRowByCoil[coilId] }
      : emptyAddRow();

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
    patchAddRow(coilId, { selectedSKU: e.target.value });
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

  const updateLine = (coilId, lineId, partial) => {
    setDraftCoils((prev) =>
      prev.map((c) => {
        if (c.coilId !== coilId) return c;
        return {
          ...c,
          lines: c.lines.map((ln) =>
            ln.lineId === lineId ? { ...ln, ...partial } : ln,
          ),
        };
      }),
    );
  };

  const onLineProductChange = (coilId, lineId, sku) => {
    const prod = apiProducts.find((p) => p.SKU === sku);
    if (!prod) {
      updateLine(coilId, lineId, {
        SKU: sku,
        name: "",
        productId: null,
        productType: undefined,
        packageWeight: undefined,
        packageWeightUnit: undefined,
        unit: undefined,
        unitText: "",
      });
      return;
    }
    updateLine(coilId, lineId, {
      productId: prod.id,
      SKU: prod.SKU,
      name: prod.name,
      unit: prod.unit,
      productType: prod.productType,
      packageWeight: prod.packageWeight,
      packageWeightUnit: prod.packageWeightUnit,
      unitText: "",
    });
  };

  const handleAddAnotherCoil = () => {
    setDraftCoils((prev) => [...prev, { coilId: lineUid(), lines: [] }]);
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
      coilSheet: String(l.coilSheet ?? "").trim(),
      coilNumber: String(l.coilNumber ?? "").trim(),
    }));

  const unitLabel = (p) =>
    p?.productType === "packed"
      ? `packets (${p.packageWeight} ${p.packageWeightUnit})`
      : p?.unit ?? "—";

  const displayUnit = (p) =>
    p.unitText != null && String(p.unitText).length > 0
      ? p.unitText
      : unitLabel(p);

  useEffect(() => {
    const load = async () => {
      try {
        setPageLoading(true);
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        let productsEndpoint = "/products/list";
        if (currentDivisionId && currentDivisionId !== "1") {
          productsEndpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          productsEndpoint += `?showAllDivisions=true`;
        }
        const [pRes, bRes] = await Promise.all([
          axiosAPI.get(productsEndpoint),
          axiosAPI.get(`/coils/${batchId}`),
        ]);
        const products = pRes.data.products || [];
        setApiProducts(products);
        const batch = bRes.data?.data ?? bRes.data;
        if (!batch) {
          throw new Error("Batch not found");
        }
        const d = batch.recordedDate
          ? String(batch.recordedDate).slice(0, 10)
          : "";
        setCurrentDate(d);
        setCurrentTime(batch.recordedTime ?? "");
        setEmployeeId(
          batch.employeeId != null ? String(batch.employeeId) : "",
        );
        setDraftCoils(batchToDraftCoils(batch, products));
        setAddRowByCoil({});
        setLineErrorsByCoil({});
      } catch (e) {
        setError(
          e.response?.data?.message ||
            e.message ||
            "Failed to load coil batch.",
        );
        setIsModalOpen(true);
      } finally {
        setPageLoading(false);
      }
    };
    if (batchId) load();
  }, [axiosAPI, batchId]);

  const handleSave = async () => {
    const coilsToSubmit = draftCoils.filter((c) => c.lines.length > 0);
    if (coilsToSubmit.length === 0) {
      setError("Add at least one product line to a coil before saving.");
      setIsModalOpen(true);
      return;
    }
    const missingProduct = coilsToSubmit.some((c) =>
      c.lines.some((ln) => ln.productId == null),
    );
    if (missingProduct) {
      setError("Each line must have a product selected (valid SKU).");
      setIsModalOpen(true);
      return;
    }
    const errMsg = (e) =>
      e.response?.data?.message || e.message || "Could not save changes.";
    try {
      setLoading(true);
      const body = {
        recordedDate: currentDate,
        recordedTime: currentTime,
        employeeId: employeeId.trim() || user?.employeeId || null,
        coils: coilsToSubmit.map((c) => ({ items: itemsPayload(c.lines) })),
      };
      const res = await axiosAPI.put(`/coils/${batchId}`, body);
      setSuccessmsg(
        res.data?.message || "Coil batch updated.",
      );
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/coils/view");
      }, 1800);
    } catch (e) {
      setError(errMsg(e));
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <Loading />;
  }

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/products")}>Products</span>{" "}
        <i className="bi bi-chevron-right" />{" "}
        <span onClick={() => navigate("/coils")}>Coils</span>{" "}
        <i className="bi bi-chevron-right" />{" "}
        <span onClick={() => navigate("/coils/view")}>View coils</span>{" "}
        <i className="bi bi-chevron-right" /> Edit batch {batchId}
      </p>

      {!loading && !showSuccess && (
        <>
          <div className="row m-0 p-3">
            <div className={`col-3 ${styles.longform}`}>
              <label>Date :</label>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
              />
            </div>
            <div className={`col-3 ${styles.longform}`}>
              <label>Time :</label>
              <input
                type="text"
                value={currentTime}
                onChange={(e) => setCurrentTime(e.target.value)}
              />
            </div>
            <div className={`col-3 ${styles.longform}`}>
              <label>User ID :</label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
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
                          <tr key={p.lineId} className={styles.tableform}>
                            <td>{i + 1}</td>
                            <td>
                              <select
                                value={p.SKU || ""}
                                onChange={(e) =>
                                  onLineProductChange(
                                    coil.coilId,
                                    p.lineId,
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="">-- select product --</option>
                                {apiProducts.map((prod) => (
                                  <option key={prod.SKU} value={prod.SKU}>
                                    {prod.SKU} — {prod.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                value={p.name ?? ""}
                                onChange={(e) =>
                                  updateLine(coil.coilId, p.lineId, {
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Name"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={displayUnit(p)}
                                onChange={(e) =>
                                  updateLine(coil.coilId, p.lineId, {
                                    unitText: e.target.value,
                                  })
                                }
                                placeholder="Unit"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={p.coilSheet ?? ""}
                                onChange={(e) =>
                                  updateLine(coil.coilId, p.lineId, {
                                    coilSheet: e.target.value,
                                  })
                                }
                                placeholder="Sheet / spec"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={p.coilNumber ?? ""}
                                onChange={(e) =>
                                  updateLine(coil.coilId, p.lineId, {
                                    coilNumber: e.target.value,
                                  })
                                }
                                placeholder="Coil no."
                              />
                            </td>
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
                onClick={handleSave}
              >
                Save changes
              </button>
              <button
                type="button"
                className="cancelbtn"
                onClick={() => navigate("/coils/view")}
              >
                Cancel
              </button>
            </div>
          </div>
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

export default EditCoilBatch;
