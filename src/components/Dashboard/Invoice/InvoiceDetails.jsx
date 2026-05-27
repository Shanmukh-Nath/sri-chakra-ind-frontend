import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import PDFPreviewModal from "@/utils/PDFPreviewModal";

const pageStyles = {
  page: {
    minHeight: "100vh",
    padding: "28px",
    background:
      "linear-gradient(180deg, #f7fbff 0%, #eef4ff 34%, #f8fafc 100%)",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  titleWrap: { display: "flex", flexDirection: "column", gap: "6px" },
  title: { margin: 0, fontSize: "28px", fontWeight: 800, color: "#102542" },
  subtitle: { margin: 0, color: "#4b5d79", fontSize: "14px", lineHeight: 1.6 },
  actions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  button: {
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #0f4c81, #12b5cb)",
    color: "#fff",
  },
  secondaryButton: {
    background: "#fff",
    color: "#102542",
    border: "1px solid #c9d8ee",
  },
  accentButton: {
    background: "linear-gradient(135deg, #f97316, #f59e0b)",
    color: "#fff",
  },
  verificationButton: {
    background: "linear-gradient(135deg, #0f4c81, #0ea5a5)",
    color: "#fff",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },
  card: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "24px",
    border: "1px solid #d9e7f7",
    boxShadow: "0 18px 40px rgba(15, 76, 129, 0.08)",
    padding: "20px",
  },
  badgeRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "8px 12px",
    background: "#e8f3ff",
    color: "#0f4c81",
    fontSize: "12px",
    fontWeight: 800,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginTop: "16px",
  },
  statCard: {
    borderRadius: "18px",
    padding: "14px",
    background: "linear-gradient(135deg, #f0f9ff, #fff7ed)",
    border: "1px solid #d9e7f7",
  },
  statLabel: { fontSize: "12px", color: "#60708c", marginBottom: "6px" },
  statValue: { fontSize: "18px", fontWeight: 800, color: "#102542" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" },
  sectionTitle: { margin: "0 0 14px", fontSize: "18px", fontWeight: 800, color: "#102542" },
  label: { fontSize: "12px", fontWeight: 700, color: "#60708c", textTransform: "uppercase", letterSpacing: "0.04em" },
  value: { fontSize: "14px", color: "#102542", marginTop: "4px", lineHeight: 1.5 },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  input: {
    border: "1px solid #c9d8ee",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },
  textarea: {
    border: "1px solid #c9d8ee",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    minHeight: "92px",
    outline: "none",
    resize: "vertical",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#edf6ff",
    color: "#365175",
    fontWeight: 800,
    borderBottom: "1px solid #d9e7f7",
  },
  td: { padding: "12px", borderBottom: "1px solid #edf2f7", color: "#102542", verticalAlign: "top" },
  historyItem: {
    padding: "12px 14px",
    borderRadius: "14px",
    background: "#f8fbff",
    border: "1px solid #d9e7f7",
    marginBottom: "10px",
  },
  documentShelf: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  documentTile: {
    borderRadius: "18px",
    border: "1px solid #d9e7f7",
    background: "linear-gradient(135deg, #ffffff, #f5faff)",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  qrPreview: {
    width: "160px",
    height: "160px",
    borderRadius: "18px",
    border: "1px solid #d9e7f7",
    background: "#fff",
    objectFit: "contain",
    padding: "10px",
  },
  codeBox: {
    marginTop: "10px",
    borderRadius: "16px",
    border: "1px solid #d9e7f7",
    background: "#f8fbff",
    padding: "14px",
    color: "#102542",
    fontSize: "12px",
    lineHeight: 1.6,
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
};

const emptyEditForm = {
  invoiceDate: "",
  placeOfSupply: "",
  buyer: { name: "", mobile: "", gstin: "", state: "" },
  consignee: { name: "", mobile: "", gstin: "", state: "" },
  dispatch: {
    dispatchFrom: "",
    dispatchTo: "",
    gatePassNo: "",
    contractNo: "",
    removalTime: "",
    dispatchReference: "",
  },
  transportDetails: {
    vehicleNumber: "",
    lrNumber: "",
    lrDate: "",
    transporterName: "",
    transporterId: "",
    eWayBillNumber: "",
    eWayBillDate: "",
  },
  complianceDetails: {
    irnNumber: "",
    ackNumber: "",
    ackDate: "",
    signedQrPayload: "",
  },
  chargesSummary: {
    freightAmount: 0,
    loadingAmount: 0,
    otherAmount: 0,
    discountAmount: 0,
    rebateAmount: 0,
    grossWeight: 0,
    tareWeight: 0,
    netWeight: 0,
  },
  notesFooter: "",
  internalRemarks: "",
  editReason: "",
};

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const formatDocumentType = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
const formatDateTime = (value) =>
  value ? String(value).replace("T", " ").slice(0, 19) : "-";
const formatStatus = (value) =>
  String(value || "not_configured")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

function InvoiceDetails({ navigate }) {
  const { axiosAPI } = useAuth();
  const { invoiceId } = useParams();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [eInvoiceSaving, setEInvoiceSaving] = useState(false);
  const [governmentAction, setGovernmentAction] = useState("");
  const [gstLookupLoading, setGstLookupLoading] = useState(false);
  const [gstLookupResult, setGstLookupResult] = useState(null);
  const [governmentStatus, setGovernmentStatus] = useState(null);
  const [cancelForm, setCancelForm] = useState({
    cancelReason: "1",
    cancelRemarks: "",
  });
  const [editing, setEditing] = useState(location.search.includes("mode=edit"));
  const [form, setForm] = useState(emptyEditForm);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      let res;
      try {
        res = await axiosAPI.get(`/invoice/billing/${invoiceId}`);
      } catch {
        res = await axiosAPI.get(`/invoice/${invoiceId}`);
      }
      const nextInvoice = res.data?.invoice;
      setInvoice(nextInvoice);

      const detail = nextInvoice?.documentDetail || {};
      setForm({
        invoiceDate: nextInvoice?.invoiceDate?.slice(0, 10) || "",
        placeOfSupply: detail.dispatchSnapshot?.placeOfSupply || "",
        buyer: {
          name: detail.buyerSnapshot?.name || "",
          mobile: detail.buyerSnapshot?.mobile || "",
          gstin: detail.buyerSnapshot?.gstin || "",
          state: detail.buyerSnapshot?.address?.state || "",
        },
        consignee: {
          name: detail.consigneeSnapshot?.name || "",
          mobile: detail.consigneeSnapshot?.mobile || "",
          gstin: detail.consigneeSnapshot?.gstin || "",
          state: detail.consigneeSnapshot?.address?.state || "",
        },
        dispatch: {
          dispatchFrom: detail.dispatchSnapshot?.dispatchFrom || "",
          dispatchTo: detail.dispatchSnapshot?.dispatchTo || "",
          gatePassNo: detail.dispatchSnapshot?.gatePassNo || "",
          contractNo: detail.dispatchSnapshot?.contractNo || "",
          removalTime: detail.dispatchSnapshot?.removalTime || "",
          dispatchReference: detail.dispatchSnapshot?.dispatchReference || "",
        },
        transportDetails: {
          vehicleNumber: detail.transportDetails?.vehicleNumber || "",
          lrNumber: detail.transportDetails?.lrNumber || "",
          lrDate: detail.transportDetails?.lrDate || "",
          transporterName: detail.transportDetails?.transporterName || "",
          transporterId: detail.transportDetails?.transporterId || "",
          eWayBillNumber: detail.transportDetails?.eWayBillNumber || "",
          eWayBillDate: detail.transportDetails?.eWayBillDate || "",
        },
        complianceDetails: {
          irnNumber: detail.complianceDetails?.irnNumber || "",
          ackNumber: detail.complianceDetails?.ackNumber || "",
          ackDate: detail.complianceDetails?.ackDate || "",
          signedQrPayload:
            detail.complianceDetails?.eInvoiceLifecycle?.signedQrPayload ||
            detail.complianceDetails?.signedQrPayload ||
            "",
        },
        chargesSummary: {
          freightAmount: Number(detail.chargesSummary?.freightAmount || 0),
          loadingAmount: Number(detail.chargesSummary?.loadingAmount || 0),
          otherAmount: Number(detail.chargesSummary?.otherAmount || 0),
          discountAmount: Number(detail.chargesSummary?.discountAmount || 0),
          rebateAmount: Number(detail.chargesSummary?.rebateAmount || 0),
          grossWeight: Number(detail.chargesSummary?.grossWeight || 0),
          tareWeight: Number(detail.chargesSummary?.tareWeight || 0),
          netWeight: Number(detail.chargesSummary?.netWeight || 0),
        },
        notesFooter: detail.notesFooter || "",
        internalRemarks: detail.internalRemarks || "",
        editReason: "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const detail = invoice?.documentDetail || {};
  const requestedDocumentType =
    new URLSearchParams(location.search).get("documentType") || "";
  const baseDocumentType = detail.documentType || invoice?.type || "tax_invoice";
  const selectedDocumentType = requestedDocumentType || baseDocumentType;
  const eInvoiceLifecycle =
    detail.eInvoiceLifecycle || detail.complianceDetails?.eInvoiceLifecycle || {};
  const itemSummary = detail.itemSummary || invoice?.salesOrder?.items || [];
  const taxRows = detail.taxSummary?.rows || [];
  const editHistory = detail.editHistory || [];
  const relatedDocuments =
    invoice?.salesOrder?.relatedDocuments ||
    invoice?.salesOrder?.invoices?.map((relatedInvoice) => ({
      id: relatedInvoice.id,
      invoiceNumber: relatedInvoice.invoiceNumber,
      invoiceDate: relatedInvoice.invoiceDate,
      paymentStatus: relatedInvoice.paymentStatus,
      grandTotal: relatedInvoice.grandTotal,
      type: relatedInvoice.type,
      documentType: relatedInvoice.documentDetail?.documentType || relatedInvoice.type,
      status:
        relatedInvoice.documentDetail?.status || relatedInvoice.paymentStatus,
      billingCompany:
        relatedInvoice.documentDetail?.billingProfile?.legalName || "",
      verificationUrl:
        relatedInvoice.documentDetail?.qrPayload?.verificationUrl || "",
    })) ||
    [];

  const verificationUrl = detail.qrPayload?.verificationUrl || "";
  const verificationQr = detail.qrCodeDataUrl || "";
  const governmentQr = detail.irnQrCodeDataUrl || "";
  const documentStatus = detail.status || "Finalized";
  const canPrepareEInvoice = Boolean(invoice?.availableDocumentActions?.canPrepareEInvoice);
  const isEInvoiceView = selectedDocumentType === "e_invoice";
  const complianceDetails = detail.complianceDetails || {};
  const gstProviderConfig = detail.billingProfile?.settings?.gstCompliance || {};
  const gstProviderName =
    complianceDetails.gstProvider || gstProviderConfig.provider || "not_configured";
  const eWayBillLifecycle = complianceDetails.eWayBillLifecycle || {};

  const previewTotal = useMemo(() => {
    const charges = form.chargesSummary;
    return (
      Number(invoice?.totalAmount || 0) +
      Number(invoice?.taxAmount || 0) +
      Number(charges.freightAmount || 0) +
      Number(charges.loadingAmount || 0) +
      Number(charges.otherAmount || 0) -
      Number(charges.discountAmount || 0) -
      Number(charges.rebateAmount || 0)
    ).toFixed(2);
  }, [form.chargesSummary, invoice?.taxAmount, invoice?.totalAmount]);

  const updateNested = (group, field, value) => {
    setForm((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!form.editReason.trim()) {
      alert("Please enter the reason for this edit.");
      return;
    }

    try {
      setSaving(true);
      const res = await axiosAPI.put(`/invoice/billing/${invoiceId}`, form);
      setInvoice(res.data?.invoice || invoice);
      setEditing(false);
      await loadInvoice();
      alert("Invoice updated successfully");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to update invoice");
    } finally {
      setSaving(false);
    }
  };

  const handleEInvoiceCompliance = async (complianceStatus) => {
    try {
      setEInvoiceSaving(true);
      const res = await axiosAPI.post(`/invoice/billing/${invoiceId}/e-invoice`, {
        complianceStatus,
        irnNumber: form.complianceDetails.irnNumber,
        ackNumber: form.complianceDetails.ackNumber,
        ackDate: form.complianceDetails.ackDate,
        signedQrPayload: form.complianceDetails.signedQrPayload,
        internalRemarks: form.internalRemarks,
        editReason:
          complianceStatus === "generated"
            ? "Issued e-invoice compliance on the same tax invoice number"
            : "Prepared e-invoice compliance details",
      });
      setInvoice(res.data?.invoice || invoice);
      await loadInvoice();
      alert(
        complianceStatus === "generated"
          ? "E-invoice compliance issued on this tax invoice"
          : "E-invoice compliance prepared",
      );
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to save e-invoice compliance");
    } finally {
      setEInvoiceSaving(false);
    }
  };

  const handleGstinLookup = async () => {
    const gstin = String(form.buyer.gstin || detail.buyerSnapshot?.gstin || "").trim();
    if (gstin.length !== 15) {
      alert("Buyer GSTIN must be a valid 15-character value.");
      return;
    }

    try {
      setGstLookupLoading(true);
      const res = await axiosAPI.post("/invoice/billing/gstin/lookup", {
        gstin,
        billingProfileId: detail.billingProfile?.id,
      });
      setGstLookupResult(res.data);
      alert("GSTIN details fetched successfully");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to fetch GSTIN details");
    } finally {
      setGstLookupLoading(false);
    }
  };

  const handleGovernmentEInvoice = async () => {
    try {
      setGovernmentAction("einvoice");
      const res = await axiosAPI.post(
        `/invoice/billing/${invoiceId}/e-invoice/generate`,
        {
          options: {
            buyerGstinVerified: Boolean(gstLookupResult?.data),
          },
        },
      );
      setInvoice(res.data?.invoice || invoice);
      await loadInvoice();
      alert("Government e-invoice generated successfully");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to generate e-invoice");
    } finally {
      setGovernmentAction("");
    }
  };

  const handleCancelGovernmentEInvoice = async () => {
    if (!String(form.complianceDetails.irnNumber || complianceDetails.irnNumber || "").trim()) {
      alert("IRN number is required before cancellation.");
      return;
    }

    try {
      setGovernmentAction("cancel-einvoice");
      const res = await axiosAPI.post(
        `/invoice/billing/${invoiceId}/e-invoice/cancel`,
        {
          irnNumber: form.complianceDetails.irnNumber || complianceDetails.irnNumber,
          cancelReason: cancelForm.cancelReason,
          cancelRemarks: cancelForm.cancelRemarks,
        },
      );
      setInvoice(res.data?.invoice || invoice);
      await loadInvoice();
      alert("Government e-invoice cancelled successfully");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to cancel e-invoice");
    } finally {
      setGovernmentAction("");
    }
  };

  const handleGenerateEWayBill = async () => {
    try {
      setGovernmentAction("ewaybill");
      const res = await axiosAPI.post(
        `/invoice/billing/${invoiceId}/e-way-bill/generate`,
        {
          eWayBill: {
            vehicleNumber: form.transportDetails.vehicleNumber,
            lrNumber: form.transportDetails.lrNumber,
            transporterName: form.transportDetails.transporterName,
            transporterId: form.transportDetails.transporterId,
          },
        },
      );
      setInvoice(res.data?.invoice || invoice);
      await loadInvoice();
      alert("Government e-way bill generated successfully");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to generate e-way bill");
    } finally {
      setGovernmentAction("");
    }
  };

  const handleSyncGovernmentStatus = async () => {
    try {
      setGovernmentAction("status");
      const res = await axiosAPI.get(
        `/invoice/billing/${invoiceId}/gst-compliance/status`,
      );
      setGovernmentStatus(res.data);
      alert("Compliance status fetched successfully");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to fetch compliance status");
    } finally {
      setGovernmentAction("");
    }
  };

  return (
    <div style={pageStyles.page}>
      <div style={pageStyles.topBar}>
        <div style={pageStyles.titleWrap}>
          <h1 style={pageStyles.title}>Invoice Details</h1>
          <p style={pageStyles.subtitle}>
            Review the full billing document, authenticity link, and edit history in one place.
          </p>
        </div>
        <div style={pageStyles.actions}>
          <button
            style={{ ...pageStyles.button, ...pageStyles.secondaryButton }}
            onClick={() => navigate("/invoices")}
          >
            Back
          </button>
          {invoice?.invoiceNumber && (
            <PDFPreviewModal
              pdfUrl={`/invoice/number/${invoice.invoiceNumber}/pdf?type=${selectedDocumentType}`}
              filename={`${invoice.invoiceNumber}.pdf`}
              triggerText={
                <button style={{ ...pageStyles.button, ...pageStyles.secondaryButton }}>
                  {documentStatus === "Draft"
                    ? "Download Draft Copy"
                    : isEInvoiceView
                      ? "Download E-Invoice PDF"
                      : "Download Original PDF"}
                </button>
              }
            />
          )}
          {baseDocumentType === "tax_invoice" && (
            <button
              style={{ ...pageStyles.button, ...pageStyles.accentButton }}
              onClick={() =>
                navigate(
                  isEInvoiceView
                    ? `/invoices/details/${invoiceId}`
                    : `/invoices/details/${invoiceId}?documentType=e_invoice`,
                )
              }
            >
              {isEInvoiceView
                ? "Open Tax Invoice View"
                : eInvoiceLifecycle.status && eInvoiceLifecycle.status !== "not_started"
                  ? "Open E-Invoice View"
                  : "Prepare E-Invoice"}
            </button>
          )}
          {detail?.id && (
            <button
              style={{ ...pageStyles.button, ...pageStyles.primaryButton }}
              onClick={() => setEditing((prev) => !prev)}
            >
              {editing ? "Close Edit" : "Edit Particulars"}
            </button>
          )}
        </div>
      </div>

      {invoice && (
        <>
          <div style={{ ...pageStyles.card, marginBottom: "16px" }}>
            <h3 style={pageStyles.sectionTitle}>All Documents For This Order</h3>
            <div style={pageStyles.documentShelf}>
              {relatedDocuments.map((document) => (
                <div style={pageStyles.documentTile} key={document.id || document.invoiceNumber}>
                  <div>
                    <div style={pageStyles.label}>{formatDocumentType(document.documentType)}</div>
                    <div style={{ ...pageStyles.value, fontSize: "18px", fontWeight: 800 }}>
                      {document.invoiceNumber}
                    </div>
                    <div style={{ ...pageStyles.value, color: "#60708c" }}>
                      {document.invoiceDate?.slice(0, 10) || "-"} • {money(document.grandTotal)}
                    </div>
                  </div>
                  <div style={pageStyles.badgeRow}>
                    <span style={pageStyles.badge}>{document.status || "Finalized"}</span>
                    {document.billingCompany && (
                      <span style={pageStyles.badge}>{document.billingCompany}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      style={{ ...pageStyles.button, ...pageStyles.secondaryButton }}
                      onClick={() =>
                        navigate(
                          `/invoices/details/${document.id}${
                            document.documentType && document.documentType !== baseDocumentType
                              ? `?documentType=${document.documentType}`
                              : ""
                          }`,
                        )
                      }
                    >
                      Open
                    </button>
                    <PDFPreviewModal
                      pdfUrl={`/invoice/number/${document.invoiceNumber}/pdf?type=${document.documentType || document.type}`}
                      filename={`${document.invoiceNumber}.pdf`}
                      triggerText={
                        <button style={{ ...pageStyles.button, ...pageStyles.primaryButton }}>
                          Download
                        </button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={pageStyles.hero}>
            <div style={pageStyles.card}>
              <div style={pageStyles.label}>Document Summary</div>
              <div style={{ ...pageStyles.value, fontSize: "24px", fontWeight: 800 }}>
                {invoice.invoiceNumber}
              </div>
              <div style={pageStyles.badgeRow}>
                <span style={pageStyles.badge}>{selectedDocumentType.replaceAll("_", " ")}</span>
                <span style={pageStyles.badge}>{documentStatus}</span>
                {isEInvoiceView && (
                  <span style={pageStyles.badge}>
                    {String(eInvoiceLifecycle.status || "not_started").replaceAll("_", " ")}
                  </span>
                )}
                {detail.qrPayload?.verificationUrl && <span style={pageStyles.badge}>Public Authenticity QR Enabled</span>}
              </div>
              <div style={pageStyles.statGrid}>
                <div style={pageStyles.statCard}>
                  <div style={pageStyles.statLabel}>Taxable Value</div>
                  <div style={pageStyles.statValue}>{money(invoice.totalAmount)}</div>
                </div>
                <div style={pageStyles.statCard}>
                  <div style={pageStyles.statLabel}>Tax</div>
                  <div style={pageStyles.statValue}>{money(invoice.taxAmount)}</div>
                </div>
                <div style={pageStyles.statCard}>
                  <div style={pageStyles.statLabel}>Grand Total</div>
                  <div style={pageStyles.statValue}>{money(invoice.grandTotal)}</div>
                </div>
                <div style={pageStyles.statCard}>
                  <div style={pageStyles.statLabel}>Invoice Date</div>
                  <div style={pageStyles.statValue}>{invoice.invoiceDate?.slice(0, 10) || "-"}</div>
                </div>
              </div>
            </div>

            <div style={pageStyles.card}>
              <h3 style={pageStyles.sectionTitle}>
                {isEInvoiceView ? "QR And Authenticity" : "Authenticity"}
              </h3>
              {isEInvoiceView && governmentQr && (
                <img
                  src={governmentQr}
                  alt="IRN signed QR"
                  style={{ ...pageStyles.qrPreview, marginBottom: "14px" }}
                />
              )}
              {verificationQr && (
                <img
                  src={verificationQr}
                  alt={isEInvoiceView ? "Kernn authenticity QR" : "Kernn authenticity QR"}
                  style={{ ...pageStyles.qrPreview, marginBottom: "14px" }}
                />
              )}
              <div style={pageStyles.field}>
                <div style={pageStyles.label}>Verification</div>
                {verificationUrl ? (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "6px" }}>
                    <a
                      href={verificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        ...pageStyles.button,
                        ...pageStyles.verificationButton,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      Open Verification Page
                    </a>
                    <button
                      style={{ ...pageStyles.button, ...pageStyles.secondaryButton }}
                      onClick={() => navigator.clipboard?.writeText(verificationUrl)}
                    >
                      Copy Link
                    </button>
                  </div>
                ) : (
                  <div style={{ ...pageStyles.value, wordBreak: "break-all" }}>
                    Will be generated on the billing document
                  </div>
                )}
              </div>
              <div style={{ ...pageStyles.value, marginTop: "12px" }}>
                {isEInvoiceView
                  ? "Use the IRN QR for statutory e-invoice reference. The Kernn QR separately proves the document came from this software and matches server records."
                  : "Scan the QR on the document to open the public Kernn verifier. That page is read-only and only confirms whether the document matches server records."}
              </div>
              {editHistory.length > 0 && (
                <div style={{ ...pageStyles.value, marginTop: "12px" }}>
                  Last edited on {editHistory[editHistory.length - 1]?.editedAt?.slice(0, 19)?.replace("T", " ")}
                </div>
              )}
            </div>
          </div>

          <div style={{ ...pageStyles.card, marginBottom: "16px" }}>
            <h3 style={pageStyles.sectionTitle}>Parties And Dispatch</h3>
            <div style={pageStyles.grid}>
              <div>
                <div style={pageStyles.label}>Billing Company</div>
                <div style={pageStyles.value}>{detail.billingProfile?.legalName || detail.sellerSnapshot?.legalName || "-"}</div>
                <div style={pageStyles.label}>Buyer</div>
                <div style={pageStyles.value}>{detail.buyerSnapshot?.name || invoice.customer?.name || "-"}</div>
                <div style={pageStyles.label}>Consignee</div>
                <div style={pageStyles.value}>{detail.consigneeSnapshot?.name || "-"}</div>
              </div>
              <div>
                <div style={pageStyles.label}>Dispatch From</div>
                <div style={pageStyles.value}>{detail.dispatchSnapshot?.dispatchFrom || "-"}</div>
                <div style={pageStyles.label}>Dispatch To</div>
                <div style={pageStyles.value}>{detail.dispatchSnapshot?.dispatchTo || "-"}</div>
                <div style={pageStyles.label}>Place Of Supply</div>
                <div style={pageStyles.value}>{detail.dispatchSnapshot?.placeOfSupply || "-"}</div>
              </div>
              <div>
                <div style={pageStyles.label}>Truck / LR</div>
                <div style={pageStyles.value}>
                  {(detail.transportDetails?.vehicleNumber || "-")} / {(detail.transportDetails?.lrNumber || "-")}
                </div>
                <div style={pageStyles.label}>Transporter</div>
                <div style={pageStyles.value}>{detail.transportDetails?.transporterName || "-"}</div>
                <div style={pageStyles.label}>E-Way / IRN</div>
                <div style={pageStyles.value}>
                  {(detail.transportDetails?.eWayBillNumber || "-")} / {(detail.complianceDetails?.irnNumber || "-")}
                </div>
              </div>
            </div>
          </div>

          {baseDocumentType === "tax_invoice" && (
            <div style={{ ...pageStyles.card, marginBottom: "16px" }}>
              <h3 style={pageStyles.sectionTitle}>E-Invoice Compliance</h3>
              <div style={pageStyles.grid}>
                <div>
                  <div style={pageStyles.label}>Eligibility</div>
                  <div style={pageStyles.value}>
                    {canPrepareEInvoice
                      ? "This finalized tax invoice can carry e-invoice compliance on the same invoice number."
                      : "Finalize the tax invoice and keep a valid buyer GSTIN before preparing e-invoice compliance."}
                  </div>
                </div>
                <div>
                  <div style={pageStyles.label}>Current Status</div>
                  <div style={pageStyles.value}>
                    {String(eInvoiceLifecycle.status || "not_started").replaceAll("_", " ")}
                  </div>
                </div>
                <div>
                  <div style={pageStyles.label}>IRN Number</div>
                  <div style={pageStyles.value}>{eInvoiceLifecycle.irnNumber || "-"}</div>
                </div>
                <div>
                  <div style={pageStyles.label}>Ack Number</div>
                  <div style={pageStyles.value}>{eInvoiceLifecycle.ackNumber || "-"}</div>
                </div>
              </div>
              <div style={{ ...pageStyles.grid, marginTop: "16px" }}>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>IRN Number</label>
                  <input
                    style={pageStyles.input}
                    value={form.complianceDetails.irnNumber}
                    onChange={(e) => updateNested("complianceDetails", "irnNumber", e.target.value)}
                  />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Acknowledgement Number</label>
                  <input
                    style={pageStyles.input}
                    value={form.complianceDetails.ackNumber}
                    onChange={(e) => updateNested("complianceDetails", "ackNumber", e.target.value)}
                  />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Acknowledgement Date</label>
                  <input
                    style={pageStyles.input}
                    type="date"
                    value={form.complianceDetails.ackDate}
                    onChange={(e) => updateNested("complianceDetails", "ackDate", e.target.value)}
                  />
                </div>
              </div>
              <div style={{ ...pageStyles.field, marginTop: "16px" }}>
                <label style={pageStyles.label}>Signed QR Payload From IRP</label>
                <textarea
                  style={pageStyles.textarea}
                  value={form.complianceDetails.signedQrPayload}
                  onChange={(e) =>
                    updateNested("complianceDetails", "signedQrPayload", e.target.value)
                  }
                />
              </div>
              <div style={{ ...pageStyles.actions, marginTop: "16px" }}>
                <button
                  style={{ ...pageStyles.button, ...pageStyles.secondaryButton }}
                  disabled={!canPrepareEInvoice || eInvoiceSaving}
                  onClick={() => handleEInvoiceCompliance("prepared")}
                >
                  {eInvoiceSaving ? "Saving..." : "Save E-Invoice Draft"}
                </button>
                <button
                  style={{ ...pageStyles.button, ...pageStyles.accentButton }}
                  disabled={!canPrepareEInvoice || eInvoiceSaving}
                  onClick={() => handleEInvoiceCompliance("generated")}
                >
                  {eInvoiceSaving ? "Saving..." : "Issue E-Invoice"}
                </button>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "20px",
                  borderTop: "1px solid #d9e7f7",
                }}
              >
                <h4 style={{ ...pageStyles.sectionTitle, fontSize: "16px" }}>
                  Government / GSP Actions
                </h4>
                <div style={pageStyles.grid}>
                  <div>
                    <div style={pageStyles.label}>Configured Provider</div>
                    <div style={pageStyles.value}>{formatStatus(gstProviderName)}</div>
                  </div>
                  <div>
                    <div style={pageStyles.label}>Configured Base URL</div>
                    <div style={pageStyles.value}>{gstProviderConfig.baseUrl || "-"}</div>
                  </div>
                  <div>
                    <div style={pageStyles.label}>Government E-Invoice Status</div>
                    <div style={pageStyles.value}>
                      {formatStatus(
                        complianceDetails.eInvoiceLifecycle?.status ||
                          eInvoiceLifecycle.status,
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={pageStyles.label}>Government E-Way Bill Status</div>
                    <div style={pageStyles.value}>
                      {formatStatus(eWayBillLifecycle.status)}
                    </div>
                  </div>
                </div>

                <div style={{ ...pageStyles.grid, marginTop: "16px" }}>
                  <div style={pageStyles.field}>
                    <label style={pageStyles.label}>Buyer GSTIN Validation</label>
                    <input
                      style={pageStyles.input}
                      value={form.buyer.gstin}
                      onChange={(e) => updateNested("buyer", "gstin", e.target.value)}
                    />
                  </div>
                  <div style={pageStyles.field}>
                    <label style={pageStyles.label}>IRN Cancellation Reason Code</label>
                    <select
                      style={pageStyles.input}
                      value={cancelForm.cancelReason}
                      onChange={(e) =>
                        setCancelForm((prev) => ({
                          ...prev,
                          cancelReason: e.target.value,
                        }))
                      }
                    >
                      <option value="1">Duplicate</option>
                      <option value="2">Data Entry Mistake</option>
                      <option value="3">Order Cancelled</option>
                      <option value="4">Other</option>
                    </select>
                  </div>
                  <div style={pageStyles.field}>
                    <label style={pageStyles.label}>IRN Cancellation Remarks</label>
                    <input
                      style={pageStyles.input}
                      value={cancelForm.cancelRemarks}
                      onChange={(e) =>
                        setCancelForm((prev) => ({
                          ...prev,
                          cancelRemarks: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div style={{ ...pageStyles.actions, marginTop: "16px" }}>
                  <button
                    style={{ ...pageStyles.button, ...pageStyles.secondaryButton }}
                    disabled={gstLookupLoading || gstProviderName === "not_configured"}
                    onClick={handleGstinLookup}
                  >
                    {gstLookupLoading ? "Fetching GSTIN..." : "Fetch GSTIN Details"}
                  </button>
                  <button
                    style={{ ...pageStyles.button, ...pageStyles.primaryButton }}
                    disabled={governmentAction !== "" || gstProviderName === "not_configured"}
                    onClick={handleGovernmentEInvoice}
                  >
                    {governmentAction === "einvoice"
                      ? "Generating IRN..."
                      : "Generate IRN From Govt"}
                  </button>
                  <button
                    style={{ ...pageStyles.button, ...pageStyles.accentButton }}
                    disabled={governmentAction !== "" || gstProviderName === "not_configured"}
                    onClick={handleGenerateEWayBill}
                  >
                    {governmentAction === "ewaybill"
                      ? "Generating E-Way Bill..."
                      : "Generate E-Way Bill"}
                  </button>
                  <button
                    style={{ ...pageStyles.button, ...pageStyles.secondaryButton }}
                    disabled={governmentAction !== "" || gstProviderName === "not_configured"}
                    onClick={handleSyncGovernmentStatus}
                  >
                    {governmentAction === "status"
                      ? "Checking Status..."
                      : "Sync Govt Status"}
                  </button>
                  <button
                    style={{ ...pageStyles.button, ...pageStyles.secondaryButton }}
                    disabled={governmentAction !== "" || gstProviderName === "not_configured"}
                    onClick={handleCancelGovernmentEInvoice}
                  >
                    {governmentAction === "cancel-einvoice"
                      ? "Cancelling IRN..."
                      : "Cancel IRN"}
                  </button>
                </div>

                {gstLookupResult && (
                  <div style={{ marginTop: "16px" }}>
                    <div style={pageStyles.label}>GSTIN Lookup Result</div>
                    <div style={pageStyles.codeBox}>
                      {JSON.stringify(gstLookupResult.data || gstLookupResult, null, 2)}
                    </div>
                  </div>
                )}

                {governmentStatus && (
                  <div style={{ marginTop: "16px" }}>
                    <div style={pageStyles.label}>
                      Latest Compliance Status From {formatStatus(governmentStatus.provider)}
                    </div>
                    <div style={pageStyles.value}>
                      Synced at {formatDateTime(new Date().toISOString())}
                    </div>
                    <div style={pageStyles.codeBox}>
                      {JSON.stringify(governmentStatus.status || governmentStatus, null, 2)}
                    </div>
                  </div>
                )}

                <div style={{ ...pageStyles.grid, marginTop: "16px" }}>
                  <div>
                    <div style={pageStyles.label}>IRN</div>
                    <div style={pageStyles.value}>{complianceDetails.irnNumber || "-"}</div>
                  </div>
                  <div>
                    <div style={pageStyles.label}>Ack Number</div>
                    <div style={pageStyles.value}>{complianceDetails.ackNumber || "-"}</div>
                  </div>
                  <div>
                    <div style={pageStyles.label}>Ack Date</div>
                    <div style={pageStyles.value}>
                      {formatDateTime(complianceDetails.ackDate)}
                    </div>
                  </div>
                  <div>
                    <div style={pageStyles.label}>E-Way Bill Number</div>
                    <div style={pageStyles.value}>
                      {complianceDetails.eWayBillNumber || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {editing && detail?.id && (
            <div style={{ ...pageStyles.card, marginBottom: "16px" }}>
              <h3 style={pageStyles.sectionTitle}>Edit Particulars</h3>
              <div style={pageStyles.grid}>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Invoice Date</label>
                  <input style={pageStyles.input} type="date" value={form.invoiceDate} onChange={(e) => setForm((prev) => ({ ...prev, invoiceDate: e.target.value }))} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Place Of Supply</label>
                  <input style={pageStyles.input} value={form.placeOfSupply} onChange={(e) => setForm((prev) => ({ ...prev, placeOfSupply: e.target.value }))} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Buyer Name</label>
                  <input style={pageStyles.input} value={form.buyer.name} onChange={(e) => updateNested("buyer", "name", e.target.value)} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Buyer GSTIN</label>
                  <input style={pageStyles.input} value={form.buyer.gstin} onChange={(e) => updateNested("buyer", "gstin", e.target.value)} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Consignee Name</label>
                  <input style={pageStyles.input} value={form.consignee.name} onChange={(e) => updateNested("consignee", "name", e.target.value)} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Dispatch From</label>
                  <input style={pageStyles.input} value={form.dispatch.dispatchFrom} onChange={(e) => updateNested("dispatch", "dispatchFrom", e.target.value)} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Dispatch To</label>
                  <input style={pageStyles.input} value={form.dispatch.dispatchTo} onChange={(e) => updateNested("dispatch", "dispatchTo", e.target.value)} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Gate Pass</label>
                  <input style={pageStyles.input} value={form.dispatch.gatePassNo} onChange={(e) => updateNested("dispatch", "gatePassNo", e.target.value)} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Removal Time</label>
                  <input style={pageStyles.input} type="time" value={form.dispatch.removalTime} onChange={(e) => updateNested("dispatch", "removalTime", e.target.value)} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Truck Number</label>
                  <input style={pageStyles.input} value={form.transportDetails.vehicleNumber} onChange={(e) => updateNested("transportDetails", "vehicleNumber", e.target.value)} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>LR Number</label>
                  <input style={pageStyles.input} value={form.transportDetails.lrNumber} onChange={(e) => updateNested("transportDetails", "lrNumber", e.target.value)} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>E-Way Bill</label>
                  <input style={pageStyles.input} value={form.transportDetails.eWayBillNumber} onChange={(e) => updateNested("transportDetails", "eWayBillNumber", e.target.value)} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>IRN Number</label>
                  <input style={pageStyles.input} value={form.complianceDetails.irnNumber} onChange={(e) => updateNested("complianceDetails", "irnNumber", e.target.value)} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Freight</label>
                  <input style={pageStyles.input} type="number" value={form.chargesSummary.freightAmount} onChange={(e) => updateNested("chargesSummary", "freightAmount", Number(e.target.value))} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Discount</label>
                  <input style={pageStyles.input} type="number" value={form.chargesSummary.discountAmount} onChange={(e) => updateNested("chargesSummary", "discountAmount", Number(e.target.value))} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Preview Total</label>
                  <input style={{ ...pageStyles.input, fontWeight: 800 }} value={money(previewTotal)} readOnly />
                </div>
              </div>
              <div style={{ ...pageStyles.grid, marginTop: "16px" }}>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Footer Notes</label>
                  <textarea style={pageStyles.textarea} value={form.notesFooter} onChange={(e) => setForm((prev) => ({ ...prev, notesFooter: e.target.value }))} />
                </div>
                <div style={pageStyles.field}>
                  <label style={pageStyles.label}>Internal Remarks</label>
                  <textarea style={pageStyles.textarea} value={form.internalRemarks} onChange={(e) => setForm((prev) => ({ ...prev, internalRemarks: e.target.value }))} />
                </div>
              </div>
              <div style={{ ...pageStyles.field, marginTop: "16px" }}>
                <label style={pageStyles.label}>Reason For Edit</label>
                <textarea style={pageStyles.textarea} value={form.editReason} onChange={(e) => setForm((prev) => ({ ...prev, editReason: e.target.value }))} />
              </div>
              <div style={{ ...pageStyles.actions, marginTop: "16px" }}>
                <button style={{ ...pageStyles.button, ...pageStyles.secondaryButton }} onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button style={{ ...pageStyles.button, ...pageStyles.primaryButton }} onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          <div style={{ ...pageStyles.card, marginBottom: "16px" }}>
            <h3 style={pageStyles.sectionTitle}>Items</h3>
            <div style={pageStyles.tableWrap}>
              <table style={pageStyles.table}>
                <thead>
                  <tr>
                    <th style={pageStyles.th}>Product</th>
                    <th style={pageStyles.th}>Batch</th>
                    <th style={pageStyles.th}>HSN</th>
                    <th style={pageStyles.th}>UOM</th>
                    <th style={pageStyles.th}>Gross Wt</th>
                    <th style={pageStyles.th}>Basic Value</th>
                    <th style={pageStyles.th}>Freight</th>
                    <th style={pageStyles.th}>Taxable</th>
                  </tr>
                </thead>
                <tbody>
                  {itemSummary.map((item, index) => (
                    <tr key={`${item.productId || item.id || index}-${index}`}>
                      <td style={pageStyles.td}>{item.materialDescription || item.productName || item.product?.name || "-"}</td>
                      <td style={pageStyles.td}>{item.batchCode || item.sku || item.product?.SKU || "-"}</td>
                      <td style={pageStyles.td}>{item.hsnCode || item.product?.hsnCode || "-"}</td>
                      <td style={pageStyles.td}>{item.commercialUom || item.unit || "-"}</td>
                      <td style={pageStyles.td}>{Number(item.netWeightMt || item.calculatedWeight || 0).toFixed(3)} MT</td>
                      <td style={pageStyles.td}>{money(item.basicValue || item.totalUnitPrice || item.total || 0)}</td>
                      <td style={pageStyles.td}>{money(item.addFreightAmount || 0)}</td>
                      <td style={pageStyles.td}>{money(item.taxableValue || item.totalUnitPrice || item.total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {taxRows.length > 0 && (
            <div style={{ ...pageStyles.card, marginBottom: "16px" }}>
              <h3 style={pageStyles.sectionTitle}>Tax Summary</h3>
              <div style={pageStyles.tableWrap}>
                <table style={pageStyles.table}>
                  <thead>
                    <tr>
                      <th style={pageStyles.th}>HSN</th>
                      <th style={pageStyles.th}>Taxable</th>
                      <th style={pageStyles.th}>CGST</th>
                      <th style={pageStyles.th}>SGST</th>
                      <th style={pageStyles.th}>IGST</th>
                      <th style={pageStyles.th}>Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxRows.map((row, index) => (
                      <tr key={`${row.hsnCode}-${index}`}>
                        <td style={pageStyles.td}>{row.hsnCode}</td>
                        <td style={pageStyles.td}>{money(row.taxableAmount)}</td>
                        <td style={pageStyles.td}>{money(row.cgst)}</td>
                        <td style={pageStyles.td}>{money(row.sgst)}</td>
                        <td style={pageStyles.td}>{money(row.igst)}</td>
                        <td style={pageStyles.td}>{money(row.totalTax)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={pageStyles.card}>
            <h3 style={pageStyles.sectionTitle}>Edit History</h3>
            {editHistory.length === 0 ? (
              <div style={pageStyles.value}>No edits have been recorded on this document yet.</div>
            ) : (
              editHistory
                .slice()
                .reverse()
                .map((entry, index) => (
                  <div style={pageStyles.historyItem} key={`${entry.editedAt || index}-${index}`}>
                    <div style={{ fontWeight: 800, color: "#102542" }}>
                      {entry.editedBy?.name || "Unknown User"}
                    </div>
                    <div style={{ color: "#60708c", fontSize: "13px", marginTop: "4px" }}>
                      {entry.editedAt?.replace("T", " ").slice(0, 19) || "-"}
                    </div>
                    <div style={{ marginTop: "8px", color: "#102542" }}>
                      {entry.reason || "Document particulars updated"}
                    </div>
                  </div>
                ))
            )}
          </div>
        </>
      )}

      {loading && <Loading />}
    </div>
  );
}

export default InvoiceDetails;
