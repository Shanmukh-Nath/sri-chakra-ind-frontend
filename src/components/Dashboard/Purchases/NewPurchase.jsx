import React, { useEffect, useState } from "react";
import styles from "./Purchases.module.css";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import LoadingAnimation from "@/components/LoadingAnimation";
import success from "../../../images/animations/SuccessAnimation.gif";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";

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

const COIL_KEY_SEP = "\x1f";

function coilEntryKey(e) {
  return `${e.productId}${COIL_KEY_SEP}${e.coilNumber}${COIL_KEY_SEP}${e.coilSheet || ""}`;
}

/** Flatten coil line items from GET /coils list response for dropdowns keyed by productId */
function flattenCoilItemsFromCoilsResponse(resData) {
  const batches = Array.isArray(resData?.data) ? resData.data : [];
  const entries = [];
  for (const batch of batches) {
    const coils = Array.isArray(batch?.coils) ? batch.coils : [];
    for (const coil of coils) {
      const items = Array.isArray(coil?.items) ? coil.items : [];
      for (const it of items) {
        const pid = it.productId;
        if (pid == null) continue;
        const cn = String(it.coilNumber ?? "").trim();
        if (!cn) continue;
        entries.push({
          productId: pid,
          coilNumber: cn,
          coilSheet: it.coilSheet != null ? String(it.coilSheet) : "",
        });
      }
    }
    const flat = Array.isArray(batch?.items) ? batch.items : [];
    for (const it of flat) {
      const pid = it.productId;
      if (pid == null) continue;
      const cn = String(it.coilNumber ?? "").trim();
      if (!cn) continue;
      entries.push({
        productId: pid,
        coilNumber: cn,
        coilSheet: it.coilSheet != null ? String(it.coilSheet) : "",
      });
    }
  }
  const seen = new Set();
  const unique = [];
  for (const e of entries) {
    const k = `${e.productId}::${e.coilNumber}::${e.coilSheet}`;
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(e);
  }
  unique.sort((a, b) =>
    String(a.coilNumber).localeCompare(String(b.coilNumber), undefined, {
      numeric: true,
    }),
  );
  return unique;
}

function NewPurchase({ navigate }) {
  const [products, setProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [apiproducts, setApiproducts] = useState([]);
  const [selectedSKU, setSelectedSKU] = useState("");
  const [qty, setQty] = useState("");
  const [errors, setErrors] = useState({});
  const [taxSummary, setTaxSummary] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);

  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouse, setWarehouse] = useState();
  const [supplier, setSupplier] = useState();

  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCoilPickKey, setSelectedCoilPickKey] = useState("");
  const [coilCatalog, setCoilCatalog] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successmsg, setSuccessmsg] = useState("");

  const { axiosAPI } = useAuth();
  const user = JSON.parse(localStorage.getItem("user"));
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const now = new Date();
    const indianTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    setCurrentDate(indianTime.toISOString().slice(0, 10));
    setCurrentTime(indianTime.toTimeString().slice(0, 5));
  }, []);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        const currentDivisionName = localStorage.getItem('currentDivisionName');
        
        // ✅ Add division parameters to endpoints
        let warehousesEndpoint = "/warehouse";
        let suppliersEndpoint = "/suppliers";
        let productsEndpoint = "/products/list";
        
        if (currentDivisionId && currentDivisionId !== "1") {
          warehousesEndpoint += `?divisionId=${currentDivisionId}`;
          suppliersEndpoint += `?divisionId=${currentDivisionId}`;
          productsEndpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          warehousesEndpoint += `?showAllDivisions=true`;
          suppliersEndpoint += `?showAllDivisions=true`;
          productsEndpoint += `?showAllDivisions=true`;
        }

        const coilsParams = {
          limit: 200,
          offset: 0,
          ...divisionQueryParams(),
        };

        const [w, s, p, cRes] = await Promise.all([
          axiosAPI.get(warehousesEndpoint),
          axiosAPI.get(suppliersEndpoint),
          axiosAPI.get(productsEndpoint),
          axiosAPI.get("/coils", coilsParams).catch(() => ({ data: {} })),
        ]);
        setWarehouses(w.data.warehouses);
        setSuppliers(s.data.suppliers);
        setApiproducts(p.data.products);
        setAvailableProducts(p.data.products);
        setCoilCatalog(flattenCoilItemsFromCoilsResponse(cRes.data || {}));
      } catch (e) {
        setError(e.response?.data?.message || "Error loading data");
        setIsModalOpen(true);
      }
    };
    fetchInitial();
  }, []);

  const calculateTaxBreakdown = (price, taxes) => {
    let breakdown = {};
    let totalTax = 0;

    if (!Array.isArray(taxes) || taxes.length === 0) {
      return { breakdown, totalTax };
    }

    taxes.forEach((tax) => {
      const percent = parseFloat(tax.percentage || 0);
      const taxAmt = (price * percent) / 100;
      breakdown[tax.name] = (breakdown[tax.name] || 0) + taxAmt;
      totalTax += taxAmt;
    });

    return { breakdown, totalTax };
  };

  const coilOptionsForProductId = (productId) =>
    coilCatalog.filter(
      (e) => String(e.productId) === String(productId),
    );

  const handleAddProduct = () => {
    const errs = {};
    if (!selectedSKU) errs.sku = true;
    if (!qty || qty <= 0) errs.qty = true;
    const prod = apiproducts.find((p) => p.SKU === selectedSKU);
    const coilOpts = prod ? coilOptionsForProductId(prod.id) : [];
    if (coilOpts.length > 0 && !String(selectedCoilPickKey).trim()) {
      errs.coil = true;
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    if (!prod) return;
    const purchasePrice = parseFloat(prod.purchasePrice);
    const quantity = parseInt(qty);

    const { breakdown, totalTax } = calculateTaxBreakdown(
      purchasePrice,
      prod.taxes
    );
    const finalPrice = purchasePrice + totalTax;
    const total = finalPrice * quantity;

    const coilEntry =
      coilOpts.length > 0
        ? coilOpts.find((e) => coilEntryKey(e) === selectedCoilPickKey)
        : null;

    const newItem = {
      ...prod,
      quantity,
      taxBreakdown: breakdown,
      totalTax,
      amount: total,
      coilPickKey: coilEntry ? coilEntryKey(coilEntry) : "",
      coilNumber: coilEntry ? coilEntry.coilNumber : null,
      coilSheet: coilEntry ? coilEntry.coilSheet : "",
    };

    setProducts((prev) => [...prev, newItem]);
    setAvailableProducts((prev) => prev.filter((p) => p.SKU !== prod.SKU));
    setSelectedSKU("");
    setQty("");
    setSelectedProduct(null);
    setSelectedCoilPickKey("");
    setErrors({});
  };

  useEffect(() => {
    const summary = {};
    let netTotal = 0;

    products.forEach((prod) => {
      netTotal += prod.amount;
      Object.entries(prod.taxBreakdown).forEach(([name, amt]) => {
        summary[name] = (summary[name] || 0) + amt;
      });
    });

    setTotalAmount(netTotal);
    setTaxSummary(summary);
  }, [products]);

  const handleDeleteProduct = (sku) => {
    const product = products.find((p) => p.SKU === sku);
    setProducts((prev) => prev.filter((p) => p.SKU !== sku));
    setAvailableProducts((prev) => [...prev, product]);
  };

  const onSubmit = async () => {
    if (!warehouse || !supplier || !products.length) {
      setError("Please select all fields and add at least one product.");
      setIsModalOpen(true);
      return;
    }

    const missingCoil = products.some((p) => {
      const opts = coilOptionsForProductId(p.id);
      return (
        opts.length > 0 &&
        (!String(p.coilPickKey || "").trim() ||
          !String(p.coilNumber || "").trim())
      );
    });
    if (missingCoil) {
      setError("Select a coil number for every product that has coils.");
      setIsModalOpen(true);
      return;
    }

    const items = products.map((p) => {
      const row = {
        productId: p.id,
        quantity: p.quantity,
        purchasePrice: p.purchasePrice,
      };
      if (p.coilNumber != null && String(p.coilNumber).trim() !== "") {
        row.coilNumber = String(p.coilNumber).trim();
      }
      if (p.coilSheet != null && String(p.coilSheet).trim() !== "") {
        row.coilSheet = String(p.coilSheet).trim();
      }
      return row;
    });

    try {
      setLoading(true);
      const res = await axiosAPI.post("/purchases", {
        warehouseId: warehouse,
        supplierId: supplier,
        items,
      });
      setSuccessmsg(res.data.message);
      setShowSuccess(true);
      setTimeout(() => navigate("/purchases"), 2100);
    } catch (e) {
      setError(e.response?.data?.message || "Submission failed");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const onProductSelect = (e) => {
    const sku = e.target.value;
    setSelectedSKU(sku);
    setSelectedCoilPickKey("");
    const prod = apiproducts.find((p) => p.SKU === sku);
    setSelectedProduct(prod);
  };

  const updateLineCoilPick = (sku, pickKey) => {
    const prod = products.find((p) => p.SKU === sku);
    if (!prod) return;
    const opts = coilOptionsForProductId(prod.id);
    const entry = opts.find((e) => coilEntryKey(e) === pickKey) || null;
    setProducts((prev) =>
      prev.map((p) =>
        p.SKU === sku
          ? {
              ...p,
              coilPickKey: pickKey || "",
              coilNumber: entry ? entry.coilNumber : null,
              coilSheet: entry ? entry.coilSheet : "",
            }
          : p,
      ),
    );
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/purchases")}>Purchase</span>{" "}
        <i className="bi bi-chevron-right"></i> + New Purchase Order
      </p>

      {!loading && !showSuccess && (
        <>
          {/* Header Info */}
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
              <input type="text" value={user?.employeeId} readOnly />
            </div>
          </div>

          {/* Warehouse and Supplier */}
          <div className="row m-0 p-3">
          <h5 className={styles.head}>TO</h5>
            <CustomSearchDropdown
              label="Warehouse"
              onSelect={setWarehouse}
              options={warehouses?.map((w) => ({ value: w.id, label: w.name }))}
              showSelectAll={false}
            />
            <CustomSearchDropdown
              label="Vendor"
              onSelect={setSupplier}
              options={suppliers?.map((s) => ({ value: s.id, label: s.name }))}
              showSelectAll={false}
            />
          </div>

          {/* Product Table */}
          <div className="row m-0 p-3 justify-content-center">
            <h5 className={styles.head}>Products</h5>
            <div className="col-lg-9">
              <table className="table table-bordered borderedtable">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Unit</th>
                    <th>Coil no.</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Taxes</th>
                    <th>Net</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => {
                    const lineCoils = coilOptionsForProductId(p.id);
                    return (
                      <tr key={p.SKU}>
                        <td>{i + 1}</td>
                        <td>{p.SKU}</td>
                        <td>{p.name}</td>
                        <td>
                          {p.productType === "packed"
                            ? `packets (${p.packageWeight} ${p.packageWeightUnit})`
                            : p.unit}
                        </td>
                        <td>
                          {lineCoils.length > 0 ? (
                            <select
                              className="w-100"
                              value={p.coilPickKey ?? ""}
                              onChange={(e) =>
                                updateLineCoilPick(p.SKU, e.target.value)
                              }
                            >
                              <option value="">-- select coil --</option>
                              {lineCoils.map((c) => (
                                <option key={coilEntryKey(c)} value={coilEntryKey(c)}>
                                  {c.coilNumber}
                                  {c.coilSheet
                                    ? ` (${c.coilSheet})`
                                    : ""}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-muted small">
                              {p.coilNumber || "—"}
                            </span>
                          )}
                        </td>
                        <td>{p.quantity}</td>
                        <td>₹{parseFloat(p.purchasePrice).toFixed(2)}</td>
                        <td>
                          {Object.entries(p.taxBreakdown).map(([name, amt]) => (
                            <div key={name}>
                              {name}: ₹{amt.toFixed(2)}
                            </div>
                          ))}
                        </td>
                        <td>₹{p.amount.toFixed(2)}</td>
                        <td>
                          <button
                            className={styles.removebtn}
                            onClick={() => handleDeleteProduct(p.SKU)}
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Add Product Row */}
                  <tr className={styles.tableform}>
                    <td>#</td>
                    <td colSpan={2}>
                      <select
                        value={selectedSKU}
                        onChange={onProductSelect}
                        className={errors.sku ? styles.errorinput : ""}
                      >
                        <option value="">--select product--</option>
                        {availableProducts.map((p) => (
                          <option key={p.SKU} value={p.SKU}>
                            {p.SKU} - {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{selectedProduct?.unit}</td>
                    <td>
                      {selectedProduct &&
                      coilOptionsForProductId(selectedProduct.id).length >
                        0 ? (
                        <select
                          value={selectedCoilPickKey}
                          onChange={(e) =>
                            setSelectedCoilPickKey(e.target.value)
                          }
                          className={
                            errors.coil ? styles.errorinput : ""
                          }
                        >
                          <option value="">-- select coil --</option>
                          {coilOptionsForProductId(selectedProduct.id).map(
                            (c) => (
                              <option
                                key={coilEntryKey(c)}
                                value={coilEntryKey(c)}
                              >
                                {c.coilNumber}
                                {c.coilSheet ? ` (${c.coilSheet})` : ""}
                              </option>
                            ),
                          )}
                        </select>
                      ) : (
                        <span className="text-muted small">
                          {selectedProduct
                            ? "No coils for product"
                            : "—"}
                        </span>
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        placeholder="Qty"
                        className={errors.qty ? styles.errorinput : ""}
                      />
                    </td>
                    <td>{selectedProduct?.purchasePrice}</td>
                    <td>
                      {selectedProduct?.taxes?.map((t) => (
                        <div key={t.name}>
                          {t.name} ({t.percentage}%)
                        </div>
                      ))}
                    </td>
                    <td>—</td>
                    <td>
                      <button
                        className={styles.addbtn}
                        onClick={handleAddProduct}
                      >
                        + Add Product
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Tax Summary */}
              <div className={`pt-3 ${styles.taxes}`}>
                <strong>Total Purchase Amount:</strong> ₹
                {totalAmount.toFixed(2)}
                <br />
                {Object.entries(taxSummary).map(([name, amount]) => (
                  <div key={name}>
                    <strong>{name}:</strong> ₹{amount.toFixed(2)}
                  </div>
                ))}
                <div className={`mt-2 ${styles.total}`}>
                  <strong>Grand Total:</strong> ₹
                  {(
                    totalAmount +
                    Object.values(taxSummary).reduce((a, b) => a + b, 0)
                  ).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Submit/Cancel */}
          <div className="row m-0 p-3 pt-4 justify-content-center">
            <div className="col-3">
              <button className="submitbtn" onClick={onSubmit}>
                Order
              </button>
              <button
                className="cancelbtn"
                onClick={() => navigate("/purchases")}
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

export default NewPurchase;
