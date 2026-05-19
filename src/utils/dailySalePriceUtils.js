import { getIstDateString } from "@/utils/dailySaleUtils";
import { STEEL_MEASUREMENT_UNITS } from "@/constants/productMeasurement";

export { getIstDateString };

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
    "rmt",
  ].map((u) => u.toLowerCase()),
);

export function buildDailySalePricesQuery(divisionId, showAllDivisions, date) {
  const recordedDate = date || getIstDateString();
  const params = new URLSearchParams({ date: recordedDate });
  if (showAllDivisions || divisionId === "all") {
    params.set("showAllDivisions", "true");
  } else if (divisionId) {
    params.set("divisionId", String(divisionId));
  }
  return `/dashboard/daily-sale-prices?${params.toString()}`;
}

function firstNumeric(...values) {
  for (const v of values) {
    if (v == null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function pick(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of keys) {
    if (obj[key] != null && obj[key] !== "") return obj[key];
  }
  return undefined;
}

export function classifyUnitBucket(unit) {
  const u = String(unit ?? "")
    .toLowerCase()
    .trim();
  if (FEET_UNITS.has(u)) return "feet";
  if (METRE_UNITS.has(u)) return "metre";
  if (WEIGHT_UNITS.has(u)) return "kg";
  return null;
}

/** Query string for product list endpoints (includes unitPrices on /products). */
export function buildProductsListQuery(divisionId, showAllDivisions) {
  const params = new URLSearchParams();
  if (showAllDivisions || divisionId === "all") {
    params.set("showAllDivisions", "true");
  } else if (divisionId) {
    params.set("divisionId", String(divisionId));
  }
  const q = params.toString();
  return q ? `?${q}` : "";
}

function parseUnitPricesField(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Read unitPrices from product object (several API shapes). */
export function extractUnitPricesFromProduct(product) {
  if (!product || typeof product !== "object") return [];

  const sources = [
    product.unitPrices,
    product.UnitPrices,
    product.productUnitPrices,
    product.ProductUnitPrices,
    product.sellingUnitPrices,
  ];

  const merged = [];
  const seen = new Set();

  for (const source of sources) {
    for (const entry of parseUnitPricesField(source)) {
      const unit = String(
        pick(entry, ["unit", "unitName", "uom", "measurementUnit"]) ?? "",
      ).trim();
      if (!unit || seen.has(unit)) continue;
      seen.add(unit);
      merged.push(entry);
    }
  }

  return merged;
}

function mapCatalogUnitEntry(raw) {
  const unit = String(
    pick(raw, ["unit", "unitName", "uom", "measurementUnit"]) ?? "",
  ).trim();
  if (!unit) return null;

  return {
    unit,
    catalogPrice:
      pick(raw, [
        "price",
        "unitPrice",
        "sellingPrice",
        "catalogPrice",
        "catalog_price",
        "amount",
        "rate",
      ]) ?? "",
    isDefault: Boolean(raw?.isDefault ?? raw?.is_default),
  };
}

/** Catalog unit prices from product master. */
export function getCatalogUnitPrices(product) {
  const list = extractUnitPricesFromProduct(product);
  if (list.length > 0) {
    return list.map(mapCatalogUnitEntry).filter(Boolean);
  }

  const fallbackUnit =
    pick(product, ["defaultUnit", "default_unit"]) ??
    product?.unit ??
    product?.inventoryPolicy?.stockKeepingUnit ??
    product?.inventoryUnit ??
    "kg";
  const fallbackPrice = pick(product, [
    "basePrice",
    "base_price",
    "customPrice",
    "custom_price",
    "currentSellingPrice",
    "current_selling_price",
    "currentPrice",
    "current_price",
    "sellingPrice",
  ]);

  if (fallbackPrice != null && fallbackPrice !== "") {
    return [
      {
        unit: String(fallbackUnit),
        catalogPrice: fallbackPrice,
        isDefault: true,
      },
    ];
  }

  return [{ unit: String(fallbackUnit), catalogPrice: "", isDefault: true }];
}

function normalizeUnitPriceEntry(raw) {
  const unit = String(
    pick(raw, ["unit", "unitName", "uom", "measurementUnit"]) ?? "",
  ).trim();

  return {
    unit,
    catalogPrice: pick(raw, [
      "catalogPrice",
      "catalog_price",
      "masterPrice",
      "master_price",
      "price",
      "unitPrice",
      "sellingPrice",
    ]),
    dailyPrice: pick(raw, [
      "dailyPrice",
      "daily_price",
      "todayPrice",
      "today_price",
    ]),
    previousPrice: pick(raw, ["previousPrice", "previous_price", "lastPrice"]),
    isDefault: Boolean(raw?.isDefault ?? raw?.is_default),
  };
}

function catalogUnitsFromDailyOnly(dailyProduct) {
  return extractUnitPricesFromProduct(dailyProduct)
    .map(mapCatalogUnitEntry)
    .filter(Boolean);
}

/** Merge catalog unitPrices with saved daily unitPrices for one product. */
export function mergeUnitPricesForProduct(catalogProduct, dailyProduct = {}) {
  const mergedCatalog = {
    ...catalogProduct,
    unitPrices:
      extractUnitPricesFromProduct(catalogProduct).length > 0
        ? extractUnitPricesFromProduct(catalogProduct)
        : extractUnitPricesFromProduct(dailyProduct),
  };

  let catalogUnits = getCatalogUnitPrices(mergedCatalog);
  const dailyUnitsRaw = extractUnitPricesFromProduct(dailyProduct);

  const hasCatalogPrices = catalogUnits.some(
    (u) => u.catalogPrice !== "" && u.catalogPrice != null,
  );

  if ((!hasCatalogPrices || catalogUnits.length <= 1) && dailyUnitsRaw.length > 0) {
    const fromDaily = catalogUnitsFromDailyOnly(dailyProduct);
    if (fromDaily.length > catalogUnits.length || !hasCatalogPrices) {
      catalogUnits = fromDaily;
    }
  }

  const catalogByUnit = new Map(catalogUnits.map((u) => [u.unit, u]));
  for (const du of dailyUnitsRaw) {
    const normalized = normalizeUnitPriceEntry(du);
    if (!normalized.unit) continue;
    if (!catalogByUnit.has(normalized.unit)) {
      catalogByUnit.set(normalized.unit, {
        unit: normalized.unit,
        catalogPrice: normalized.catalogPrice ?? "",
        isDefault: normalized.isDefault,
      });
    } else if (
      !catalogByUnit.get(normalized.unit).catalogPrice &&
      normalized.catalogPrice
    ) {
      catalogByUnit.set(normalized.unit, {
        ...catalogByUnit.get(normalized.unit),
        catalogPrice: normalized.catalogPrice,
      });
    }
  }
  catalogUnits = [...catalogByUnit.values()];

  const dailyByUnit = new Map();
  for (const du of dailyUnitsRaw) {
    const normalized = normalizeUnitPriceEntry(du);
    if (normalized.unit) dailyByUnit.set(normalized.unit, normalized);
  }

  const legacyDaily = pick(dailyProduct, ["dailyPrice", "daily_price"]);
  const defaultUnit =
    catalogUnits.find((u) => u.isDefault)?.unit ?? catalogUnits[0]?.unit;

  return catalogUnits.map((cu) => {
    const saved = dailyByUnit.get(cu.unit);
    let dailyPrice = saved?.dailyPrice ?? "";
    if (
      (dailyPrice === "" || dailyPrice == null) &&
      legacyDaily != null &&
      legacyDaily !== "" &&
      cu.unit === defaultUnit
    ) {
      dailyPrice = legacyDaily;
    }
    let catalogPrice = cu.catalogPrice;
    if (
      (catalogPrice === "" || catalogPrice == null) &&
      saved?.catalogPrice != null &&
      saved.catalogPrice !== ""
    ) {
      catalogPrice = saved.catalogPrice;
    }
    return {
      unit: cu.unit,
      catalogPrice,
      dailyPrice:
        dailyPrice != null && dailyPrice !== "" ? String(dailyPrice) : "",
      previousPrice: saved?.previousPrice ?? "",
      isDefault: cu.isDefault,
    };
  });
}

/** One table row per product; units live in `units[]`. */
export function buildDailyPriceTableRows(productsList, dailyPriceProducts) {
  const dailyById = new Map(
    (dailyPriceProducts || []).map((p) => [
      String(p.productId ?? p.id),
      p,
    ]),
  );

  const catalogById = new Map(
    (productsList || []).map((p) => [String(p.id ?? p.productId), p]),
  );

  const allIds = new Set([...catalogById.keys(), ...dailyById.keys()]);
  const productRows = [];

  for (const id of allIds) {
    if (!id || id === "undefined") continue;

    const catalogProduct = catalogById.get(id) ?? {};
    const dailyProduct = dailyById.get(id) ?? {};
    const units = mergeUnitPricesForProduct(catalogProduct, dailyProduct);

    productRows.push({
      rowKey: id,
      productId: Number(catalogProduct.id ?? dailyProduct.productId ?? id) || id,
      name:
        catalogProduct.name ??
        dailyProduct.name ??
        dailyProduct.productName ??
        "—",
      SKU:
        catalogProduct.SKU ??
        catalogProduct.sku ??
        dailyProduct.SKU ??
        dailyProduct.sku ??
        "—",
      units,
    });
  }

  productRows.sort((a, b) =>
    String(a.name).localeCompare(String(b.name), undefined, {
      sensitivity: "base",
    }),
  );

  return productRows;
}

export function groupTableRowsForSave(productRows) {
  const grouped = [];

  for (const row of productRows || []) {
    const unitPrices = [];
    for (const u of row.units || []) {
      if (u.dailyPrice !== "" && u.dailyPrice != null) {
        const price = Number(u.dailyPrice);
        if (Number.isFinite(price) && price >= 0) {
          unitPrices.push({
            unit: u.unit,
            price,
            dailyPrice: price,
          });
        }
      }
    }
    if (unitPrices.length > 0) {
      grouped.push({
        productId: Number(row.productId),
        unitPrices,
      });
    }
  }

  return grouped;
}

export function extractDailySalePricesResponse(data) {
  const payload =
    data?.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? data.data
      : data;

  const rawProducts = Array.isArray(payload?.products)
    ? payload.products
    : Array.isArray(payload?.items)
      ? payload.items
      : [];

  const summaryRaw = payload?.summary ?? payload?.rates ?? {};

  const lastUpdatedAt =
    pick(payload, [
      "lastUpdatedAt",
      "last_updated_at",
      "updatedAt",
      "updated_at",
    ]) ?? null;

  const lastUpdatedDate =
    pick(payload, [
      "lastUpdatedDate",
      "last_updated_date",
      "lastUpdatedOn",
    ]) ?? (lastUpdatedAt ? String(lastUpdatedAt).slice(0, 10) : null);

  const recordedDate =
    pick(payload, ["recordedDate", "recorded_date", "date"]) ??
    getIstDateString();

  const istToday = getIstDateString();
  const hasUnitPricesToday = rawProducts.some(
    (p) =>
      Array.isArray(p.unitPrices) &&
      p.unitPrices.some(
        (u) => pick(u, ["dailyPrice", "daily_price", "price"]) != null,
      ),
  );

  const updatedToday =
    payload?.updatedToday === true ||
    payload?.isUpdatedToday === true ||
    payload?.pricesUpdatedToday === true ||
    payload?.hasPricesForDate === true ||
    (recordedDate === istToday &&
      (hasUnitPricesToday || rawProducts.length > 0)) ||
    (lastUpdatedDate != null && lastUpdatedDate === istToday);

  const products = rawProducts.map((p) => ({
    productId: p.productId ?? p.id,
    name: p.name ?? p.productName,
    SKU: p.SKU ?? p.sku,
    unitPrices: Array.isArray(p.unitPrices)
      ? p.unitPrices.map(normalizeUnitPriceEntry)
      : [],
    dailyPrice: pick(p, ["dailyPrice", "daily_price"]),
  }));

  const result = {
    updatedToday: Boolean(updatedToday),
    lastUpdatedAt,
    lastUpdatedDate,
    recordedDate,
    summary: {
      perMetre: firstNumeric(
        summaryRaw.perMetre,
        summaryRaw.per_metre,
        summaryRaw.pricePerMetre,
        summaryRaw.price_per_metre,
        payload?.perMetre,
        payload?.pricePerMetre,
      ),
      perKg: firstNumeric(
        summaryRaw.perKg,
        summaryRaw.per_kg,
        summaryRaw.pricePerKg,
        summaryRaw.price_per_kg,
        payload?.perKg,
        payload?.pricePerKg,
      ),
      perFeet: firstNumeric(
        summaryRaw.perFeet,
        summaryRaw.per_feet,
        summaryRaw.pricePerFeet,
        summaryRaw.price_per_feet,
        payload?.perFeet,
        payload?.pricePerFeet,
      ),
    },
    products,
  };

  if (
    !result.summary.perMetre &&
    !result.summary.perKg &&
    !result.summary.perFeet &&
    products.length
  ) {
    result.summary = computeSummaryFromSavePayload(products);
  }

  return result;
}

/** Average today's unit prices by metre / kg / feet bucket. */
export function computeSummaryFromSavePayload(products) {
  const summary = { perMetre: 0, perKg: 0, perFeet: 0 };
  let metreCount = 0;
  let kgCount = 0;
  let feetCount = 0;

  for (const p of products || []) {
    const units = Array.isArray(p.unitPrices) ? p.unitPrices : [];
    for (const u of units) {
      const price = firstNumeric(u.dailyPrice, u.price, u.daily_price);
      if (price <= 0) continue;
      const bucket = classifyUnitBucket(u.unit);
      if (bucket === "metre") {
        summary.perMetre += price;
        metreCount += 1;
      } else if (bucket === "kg") {
        summary.perKg += price;
        kgCount += 1;
      } else if (bucket === "feet") {
        summary.perFeet += price;
        feetCount += 1;
      }
    }
  }

  return {
    perMetre: metreCount ? summary.perMetre / metreCount : 0,
    perKg: kgCount ? summary.perKg / kgCount : 0,
    perFeet: feetCount ? summary.perFeet / feetCount : 0,
  };
}

export function computeSummaryFromTableRows(tableRows) {
  return computeSummaryFromSavePayload(
    groupTableRowsForSave(tableRows),
  );
}

export function formatDisplayDate(isoDate) {
  if (!isoDate || String(isoDate).length < 10) return "—";
  const s = String(isoDate).slice(0, 10);
  const [y, m, d] = s.split("-");
  return `${d}-${m}-${y}`;
}

export function buildSaveDailyPricesBody(
  tableRows,
  divisionId,
  showAllDivisions,
  recordedDate,
) {
  const grouped = groupTableRowsForSave(tableRows);

  const body = {
    recordedDate: recordedDate || getIstDateString(),
    prices: grouped.map((p) => ({
      productId: p.productId,
      unitPrices: p.unitPrices.map((u) => ({
        unit: u.unit,
        price: u.price,
        dailyPrice: u.dailyPrice,
      })),
    })),
  };

  if (showAllDivisions || divisionId === "all") {
    body.showAllDivisions = true;
  } else if (divisionId) {
    body.divisionId = Number(divisionId);
  }

  return body;
}

export async function fetchDailySalePricesStatus(
  axiosAPI,
  divisionId,
  showAllDivisions,
) {
  try {
    const res = await axiosAPI.get(
      buildDailySalePricesQuery(divisionId, showAllDivisions),
    );
    return extractDailySalePricesResponse(res.data);
  } catch (e) {
    if (e.response?.status === 404) {
      return {
        updatedToday: false,
        lastUpdatedAt: null,
        lastUpdatedDate: null,
        recordedDate: getIstDateString(),
        summary: { perMetre: 0, perKg: 0, perFeet: 0 },
        products: [],
      };
    }
    throw e;
  }
}

/** @deprecated use buildDailyPriceTableRows */
export function mergeProductsWithDailyPrices(productsList, dailyPriceProducts) {
  return buildDailyPriceTableRows(productsList, dailyPriceProducts);
}

/** @deprecated */
export function computeSummaryFromProducts(products) {
  return computeSummaryFromSavePayload(products);
}
