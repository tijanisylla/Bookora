# WordPress — what to add next (Bookora)

You already have CPT **`properties`**, ACF **Property details**, REST on, and at least one published property. Use this as a checklist.

## 1. Fix ACF “gotchas” (recommended)

| Item | Action |
|------|--------|
| **Listing status** | Choices `Label : value` on two lines; **Return format: Value** so REST sends `for_rent` / `for_sale`. (Bookora also normalizes labels like `For rent` in code.) |
| **Images** | Either **Return format: Image URL** on Image 1–3, **or** keep attachment IDs — the app resolves IDs via `/wp/v2/media/{id}`. |
| **Location rules** | Field group applies to post type **`properties`** (singular menu label may still say “Property”). |
| **Group settings** | **Show in REST API** = on. |

## 2. Add more listings

1. **Properties → Add New**  
2. Title, slug, featured image, fill ACF fields.  
3. **Publish**  
4. Confirm: `GET /wp-json/wp/v2/properties?per_page=20&_embed=1` lists each post with a non-empty `acf` object.

## 3. Extra ACF fields (detail page: features + property details table)

Bookora reads these **field names** (add to your Property details group):

| Field name | Type | Notes |
|------------|------|--------|
| `lease_term` | Text | e.g. `12 months` — shows under **Property details** |
| `features` (or `amenities`, `property_features`) | Repeater / array / string | **Features & amenities** |
| `features_text` (or `amenities_list`) | Textarea | One feature per line |
| `details` (or `property_details`, `details_table`) | Repeater (label + value) / object | Extra rows; merged with auto rows |
| `lease_term` (or `lease_length`, `rental_term`) | Text | **Lease Term** row |
| `garage` | Number | **Garage** stat; leave empty if N/A |

Auto-filled in the app (no duplicate needed in `details` unless you want overrides):

- **Property Type** ← `property_type`  
- **Status** ← `listing_status` (value or label)  
- **Lease Term** ← `lease_term`  

**Agent (optional):** `agent_name`, `agent_title`, `agent_photo` (URL), `agent_rating`, `agent_phone`.

## 4. Connect the React app

1. Copy `.env.example` → `.env`  
2. Set `VITE_USE_MOCK_DATA=false`  
3. Set `VITE_WP_API_BASE` to your REST base, e.g. `http://bookora.local/wp-json/wp/v2`  
4. Run `npm run dev` — listings should load from WordPress.

## 5. CORS (only if the browser blocks fetch)

If the Vite origin (e.g. `http://localhost:5173`) is different from `bookora.local`, allow that origin in WordPress (plugin or small MU-plugin). Same-origin avoids this.

## 6. Production

- HTTPS, real domain, and ideally **Image URL** or CDN-backed media so galleries stay fast.
