# NutriPlan — JavaScript Exam

A vanilla HTML/CSS/JS single-page app with 4 views: **Meals & Recipes** (home), **Meal Details**,
**Product Scanner**, and **Food Log** — plus client-side routing so the URL bar updates per tab
(`/`, `/productscanner`, `/foodlog`, `/meal/:id`) without full page reloads.

## Run it

ES modules need a real server (won't work with `file://`). From the project folder use the
SPA server so routes like `/foodlog` and `/meal/:id` still work after refresh:

```bash
python serve.py
# or: python serve.py -p 5500
```

Then open http://127.0.0.1:5500

(`python -m http.server` also works for `/`, but refreshing deep links will 404.)

## USDA API key (required for nutrition facts on the meal details page)

1. Get a free key: https://fdc.nal.usda.gov/api-key-signup.html
2. Paste it into `js/api.js`:
   ```js
   const USDA_API_KEY = "YOUR_USDA_API_KEY";
   ```

## Project structure

```
index.html              shell: sidebar nav + #app mount point
css/styles.css           all styling (matches the provided design screenshots)
js/
  api.js                 every endpoint from the Swagger docs, one place, one function each
  adapters.js             ⚠️ SEE BELOW — normalizes raw API JSON into clean objects
  storage.js              Food Log + goals, 100% localStorage (per spec — no backend for this part)
  router.js                History API router (pushState/popstate) — the URL bonus
  utils.js                 small shared helpers (toast, formatting, category colors/icons)
  main.js                  wires routes to views, mobile sidebar toggle
  views/
    home.js                Meals & Recipes: search, category tiles, area chips, 25-meal grid
    mealDetails.js          ingredients, instructions, YouTube video, nutrition, "Log This Meal"
    productScanner.js       name/barcode search, Nutri-Score filter, category browse, "Log"
    foodLog.js               today's totals vs goals (progress bars), logged items, remove
```

## ⚠️ One thing to double-check: `js/adapters.js`

I built this against everything visible in your Swagger screenshots (base URL, every endpoint
path, the `Search Meals` params, and the `Analyze recipe nutrition` request body). I could not
render the full docs site to see every example **response** body, since it's a JS-rendered page
my tools couldn't script through.

So `adapters.js` is the single file that turns raw API JSON into the shapes the rest of the app
uses (`{id, name, category, area, thumbnail, instructions, video, ingredients}` for meals, etc.).
Every field is looked up defensively with a few likely spellings (e.g. `calories` → tries
`calories`, `kcal`, `energy`), so most things should just work — but if any field is blank in the
UI:

1. Run that request in Postman.
2. Compare the real JSON key to the fallback list in the matching `adapt...()` function.
3. Add/reorder the real key — nothing else in the app needs to change, because views never touch
   raw API JSON directly.

## Notes on a few design decisions

- **Home page** calls `GET /meals/filter` with no params for the default "All Cuisines" 25-meal
  grid (its docs description says it returns full meal details, which matches the card previews
  reusing the `instructions` text). Search box calls `GET /meals/search?q=`.
- **Nutrition on meal details** is computed live via `POST /nutrition/analyze`, sending
  `"{measure} {name}"` strings per ingredient (matches the exact example in your Nutrition docs
  screenshot), then rendered as calories/protein/carbs/fat.
- **Food Log** goals default to `2000 kcal / 50g protein / 250g carbs / 65g fat` — the exact
  numbers shown in your Food Log screenshot — stored in `localStorage` and editable by calling
  `Goals.set({...})` from `js/storage.js` if you want a settings UI later.
- **Routing bonus**: implemented with `history.pushState`/`popstate`, not `location.hash`, so URLs
  look like `/foodlog` rather than `/#foodlog`.
