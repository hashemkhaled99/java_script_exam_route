// ============================================================
// api.js — thin wrapper around the NutriPlan API
//
// Base URL + every endpoint confirmed from the Swagger/Postman docs:
//   Meals     (TheMealDB proxy)      : /meals/search /meals/filter /meals/{id}
//                                      /meals/random /meals/categories /meals/areas
//   Nutrition (USDA proxy)           : POST /nutrition/analyze   (needs x-api-key)
//   Products  (OpenFoodFacts proxy)  : /products/search /products/barcode/{code}
//                                      /products/categories /products/category/{cat}
//
// NOTE: exact response field names weren't fully visible in the docs
// screenshots (the docs render as a JS app I couldn't scrape). The raw
// response is normalized in adapters.js — that is the ONE file to check
// against your own Postman run if a field ever shows up empty/undefined.
// ============================================================

const BASE_URL = "https://nutriplan-api.vercel.app/api";

// USDA nutrition endpoint requires a personal key. Get one free at
// https://fdc.nal.usda.gov/api-key-signup.html — paste below, or save via the
// meal-details UI (stored in localStorage as nutriplan_usda_key).
const USDA_API_KEY = "YOUR_USDA_API_KEY";
const USDA_KEY_STORAGE = "nutriplan_usda_key";

export function getUsdaApiKey() {
  try {
    const stored = localStorage.getItem(USDA_KEY_STORAGE);
    if (stored && stored.trim()) return stored.trim();
  } catch {
    /* ignore */
  }
  return USDA_API_KEY;
}

export function setUsdaApiKey(key) {
  const value = String(key || "").trim();
  if (!value) {
    localStorage.removeItem(USDA_KEY_STORAGE);
    return;
  }
  localStorage.setItem(USDA_KEY_STORAGE, value);
}

export function hasUsdaApiKey() {
  const key = getUsdaApiKey();
  return Boolean(key) && key !== "YOUR_USDA_API_KEY";
}

async function request(path, { method = "GET", params, body, headers } = {}) {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const usp = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    );
    const qs = usp.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = "";
    try { detail = JSON.stringify(await res.json()); } catch { /* ignore */ }
    throw new Error(`API ${res.status} on ${path} ${detail}`);
  }
  // Some endpoints could legitimately return 204 / empty body
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ---------------- Meals ----------------
export const MealsAPI = {
  search: (q, { page = 1, limit = 25 } = {}) =>
    request("/meals/search", { params: { q, page, limit } }),

  filter: ({ category, area, page = 1, limit = 25 } = {}) =>
    request("/meals/filter", { params: { category, area, page, limit } }),

  getById: (id) => request(`/meals/${id}`),

  // OpenAPI: `count` (default 1). Filter with no category/area returns 500 —
  // use random({ count: 25 }) for the unfiltered home grid.
  random: ({ count = 1 } = {}) => request("/meals/random", { params: { count } }),

  categories: () => request("/meals/categories"),

  areas: () => request("/meals/areas"),
};

// ---------------- Nutrition ----------------
export const NutritionAPI = {
  analyze: (recipeName, ingredients) =>
    request("/nutrition/analyze", {
      method: "POST",
      headers: { "x-api-key": getUsdaApiKey() },
      body: { recipeName, ingredients },
    }),
};

// ---------------- Products ----------------
export const ProductsAPI = {
  search: (q, { page = 1, limit = 20 } = {}) =>
    request("/products/search", { params: { q, page, limit } }),

  byBarcode: (code) => request(`/products/barcode/${encodeURIComponent(code)}`),

  categories: () => request("/products/categories"),

  byCategory: (category, { page = 1, limit = 20 } = {}) =>
    request(`/products/category/${encodeURIComponent(category)}`, { params: { page, limit } }),
};

export { BASE_URL };
