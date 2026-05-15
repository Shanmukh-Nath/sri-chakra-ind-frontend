import { STEEL_MEASUREMENT_UNITS } from "@/constants/productMeasurement";

const FEET_UNITS = new Set(
  ["ft", "sq_ft", "feet", "foot"].map((u) => u.toLowerCase()),
);
const WEIGHT_UNITS = new Set(
  STEEL_MEASUREMENT_UNITS.weight.map((u) => u.toLowerCase()),
);
const METRE_UNITS = new Set(
  [
    ...STEEL_MEASUREMENT_UNITS.length,
    ...STEEL_MEASUREMENT_UNITS.area,
    "metre",
    "meter",
    "mtr",
  ].map((u) => u.toLowerCase()),
);

/** Calendar date YYYY-MM-DD in Asia/Kolkata (matches backend IST "today"). */
export function getIstDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function getOrderLineItems(order) {
  if (!order) return [];
  const items =
    order.items ?? order.salesOrderItems ?? order.orderItems ?? [];
  return Array.isArray(items) ? items : [];
}

function firstNumeric(...values) {
  for (const v of values) {
    if (v == null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function pickFromObject(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of keys) {
    if (obj[key] != null && obj[key] !== "") return obj[key];
  }
  return undefined;
}

export function getLineGrandTotal(item) {
  const direct = firstNumeric(
    item?.grandTotal,
    item?.grand_total,
    item?.totalPrice,
    item?.total_price,
    item?.netAmount,
    item?.net_amount,
    item?.lineTotal,
    item?.amount,
  );
  if (direct > 0) return direct;

  const qty = Number(item?.quantity ?? item?.qty);
  const price = Number(
    item?.unitPrice ?? item?.price ?? item?.pricePerUnit ?? item?.basePrice,
  );
  if (Number.isFinite(qty) && Number.isFinite(price) && qty > 0 && price > 0) {
    return qty * price;
  }
  return 0;
}

/** Classify a line into metre / kg / feet buckets (selling unit first). */
export function classifyDailySaleLine(item) {
  const unit = String(item?.unit ?? item?.product?.unit ?? "")
    .toLowerCase()
    .trim();

  if (FEET_UNITS.has(unit)) return "feet";
  if (METRE_UNITS.has(unit)) return "metre";
  if (WEIGHT_UNITS.has(unit)) return "kg";

  const measurementType = String(
    item?.measurementType ?? item?.product?.measurementType ?? "",
  )
    .toLowerCase()
    .trim();

  if (measurementType === "weight") return "kg";
  if (measurementType === "length" || measurementType === "area") return "metre";

  const packageWeightUnit = String(
    item?.packageWeightUnit ?? item?.product?.packageWeightUnit ?? "",
  )
    .toLowerCase()
    .trim();

  if (WEIGHT_UNITS.has(packageWeightUnit)) return "kg";

  return null;
}

export function computeDailySaleFromLineItems(items) {
  const result = { total: 0, perMetre: 0, perKg: 0, perFeet: 0 };
  if (!Array.isArray(items)) return result;

  for (const item of items) {
    const amount = getLineGrandTotal(item);
    if (amount <= 0) continue;

    result.total += amount;
    const bucket = classifyDailySaleLine(item);
    if (bucket === "metre") result.perMetre += amount;
    else if (bucket === "kg") result.perKg += amount;
    else if (bucket === "feet") result.perFeet += amount;
  }

  return result;
}

export function extractDailySale(data) {
  const payload =
    data?.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? data.data
      : data;

  const raw = payload?.dailySale ?? payload?.daily_sales ?? {};
  const breakdown =
    raw.breakdown ??
    raw.byUnit ??
    raw.byMeasurement ??
    raw.buckets ??
    raw.totals ??
    {};

  const metreFromBreakdown = pickFromObject(breakdown, [
    "perMetre",
    "per_metre",
    "per_meter",
    "perMeter",
    "metre",
    "meter",
    "length",
    "metric",
  ]);
  const kgFromBreakdown = pickFromObject(breakdown, [
    "perKg",
    "per_kg",
    "kg",
    "weight",
  ]);
  const feetFromBreakdown = pickFromObject(breakdown, [
    "perFeet",
    "per_feet",
    "per_foot",
    "per_ft",
    "perFt",
    "feet",
    "foot",
    "ft",
  ]);

  return {
    total: firstNumeric(
      raw.total,
      raw.totalAmount,
      raw.total_amount,
      payload?.dailySaleTotal,
      payload?.totalDailySale,
      payload?.daily_sale_total,
    ),
    perMetre: firstNumeric(
      raw.perMetre,
      raw.per_metre,
      raw.per_meter,
      raw.perMeter,
      raw.metre,
      raw.meter,
      payload?.dailySalePerMetre,
      payload?.daily_sale_per_metre,
      payload?.daily_sale_per_meter,
      metreFromBreakdown,
    ),
    perKg: firstNumeric(
      raw.perKg,
      raw.per_kg,
      raw.kg,
      payload?.dailySalePerKg,
      payload?.daily_sale_per_kg,
      kgFromBreakdown,
    ),
    perFeet: firstNumeric(
      raw.perFeet,
      raw.per_feet,
      raw.per_foot,
      raw.per_ft,
      raw.perFt,
      raw.feet,
      raw.ft,
      payload?.dailySalePerFeet,
      payload?.daily_sale_per_feet,
      feetFromBreakdown,
    ),
  };
}

/**
 * Prefer API totals when present; fill metre/feet/kg from line-item computation
 * when the API buckets are empty but today's orders have classified lines.
 */
export function mergeDailySale(apiSale, computedFromLines) {
  const api = apiSale ?? {
    total: 0,
    perMetre: 0,
    perKg: 0,
    perFeet: 0,
  };
  const computed = computedFromLines ?? {
    total: 0,
    perMetre: 0,
    perKg: 0,
    perFeet: 0,
  };

  const apiBucketSum = api.perMetre + api.perKg + api.perFeet;
  const computedBucketSum =
    computed.perMetre + computed.perKg + computed.perFeet;

  const apiOnlyKg =
    api.perKg > 0 && api.perMetre === 0 && api.perFeet === 0;
  const computedHasMetreOrFeet =
    computed.perMetre > 0 || computed.perFeet > 0;

  if (
    computedBucketSum > 0 &&
    (apiBucketSum === 0 || (apiOnlyKg && computedHasMetreOrFeet))
  ) {
    return {
      total: api.total > 0 ? api.total : computed.total,
      perMetre: computed.perMetre,
      perKg: computed.perKg,
      perFeet: computed.perFeet,
    };
  }

  return {
    total: api.total > 0 ? api.total : computed.total,
    perMetre: api.perMetre > 0 ? api.perMetre : computed.perMetre,
    perKg: api.perKg > 0 ? api.perKg : computed.perKg,
    perFeet: api.perFeet > 0 ? api.perFeet : computed.perFeet,
  };
}

export function collectTodaySaleLineItems(orders) {
  if (!Array.isArray(orders)) return [];
  return orders
    .filter((order) => {
      const status = String(order?.orderStatus ?? "").toLowerCase();
      return status !== "cancelled";
    })
    .flatMap((order) => getOrderLineItems(order));
}

export function buildTodaySalesOrdersQuery(divisionId, showAllDivisions) {
  const istToday = getIstDateString();
  let query = `/sales-orders?fromDate=${istToday}&toDate=${istToday}&page=1&limit=500`;
  if (showAllDivisions || divisionId === "all") {
    query += "&showAllDivisions=true";
  } else if (divisionId) {
    query += `&divisionId=${divisionId}`;
  }
  return query;
}
