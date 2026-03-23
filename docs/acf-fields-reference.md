# Bookora — ACF field names & labels (copy/paste)

Use **Field Name** exactly as shown (snake_case). **Field Label** is what editors see—you can tweak wording.

**Post type:** `properties`  
**Field group location:** Post type → **Property** (singular label for your CPT)

---

## WordPress core (not ACF)

| What | Where you set it |
|------|------------------|
| Title | Post title |
| Slug | Permalink |
| Content | Editor (optional if you use ACF Description) |
| Featured image | Sidebar (fallback if no gallery URLs / IDs resolve) |

---

## Main property fields

| Suggested label (Field Label) | Field Name | Field type | Notes |
|-------------------------------|------------|------------|--------|
| Price | `price` | Number | Sale price **or** monthly rent |
| Location | `location` | Text | Full address |
| Bedrooms | `bedrooms` | Number | Integer |
| Bathrooms | `bathrooms` | Number | Integer |
| Area (sq ft) | `area` | Number | Square feet |
| Garage | `garage` | Number | Optional; leave empty if none |
| Year built | `year_built` | Number | Optional |
| Property type | `property_type` | Text | e.g. `House`, `Condo` |
| Listing status | `listing_status` | Select | See **Choices** below |
| Description | `description` | Textarea | Long description |

### Listing status — Choices (two lines, Return format: **Value**)

```text
For sale : for_sale
For rent : for_rent
```

---

## Images (ACF Free — three Image fields)

| Suggested label | Field Name | Field type | Return format |
|-----------------|------------|------------|---------------|
| Image 1 | `image_1` | Image | Image URL **or** attachment ID (app resolves IDs) |
| Image 2 | `image_2` | Image | Same |
| Image 3 | `image_3` | Image | Same |

*(Optional: single Gallery field named `images` with URLs also works.)*

---

## Features & amenities

Pick **one** approach:

| Suggested label | Field Name | Field type | Notes |
|-----------------|------------|------------|--------|
| Features | `features` | Repeater | One subfield, e.g. text field named `feature` |
| — *or* | `amenities` | Repeater | Same idea (alternate name) |
| — *or* | `property_features` | Repeater | Alternate name |
| Features (text) | `features_text` | Textarea | **One feature per line** |
| — *or* | `amenities_list` | Textarea | Same, alternate name |

---

## Lease / rental

| Suggested label | Field Name | Field type | Example value |
|-----------------|------------|------------|-----------------|
| Lease term | `lease_term` | Text | `12 months` |
| — *or* | `lease_length` | Text | Same |
| — *or* | `rental_term` | Text | Same |

The app also **auto-fills** from `property_type` and `listing_status` into the **Property details** table (Property Type, Status).

---

## Extra detail rows (optional)

| Suggested label | Field Name | Field type | Notes |
|-----------------|------------|------------|--------|
| Property details | `details` | Repeater | Subfields e.g. `label` + `value`) **or** |
| — | `property_details` | Repeater / object | Alternate name |
| — | `details_table` | Repeater / object | Alternate name |

Merged with auto rows: Property Type, Status, Lease Term (when not already in the repeater).

---

## Agent (optional)

| Suggested label | Field Name | Field type | Notes |
|-----------------|------------|------------|--------|
| Agent name | `agent_name` | Text | Required for agent card |
| Agent title | `agent_title` | Text | |
| Agent photo | `agent_photo` | Image / URL | Return: Image URL |
| Agent rating | `agent_rating` | Number | e.g. `4.9` |
| Agent phone | `agent_phone` | Text | |

---

## Group settings (ACF)

- **Show in REST API:** On  
- **Location:** Post type = your Properties CPT  

---

## REST check

`GET /wp-json/wp/v2/properties/{id}?_embed=1` — `acf` should be an object with these keys (only fields you created will appear).
