# Annotation Guide for Sofa Return Condition Dataset

Quick reference for labeling sofa images.

## Labels: Pick ONE per image

| Label | When to Use | Refund | Examples |
|-------|------------|--------|----------|
| **CLEAN** | Zero visible defects; looks new | 100% | Shopify product photos, new user photos |
| **LIGHT_DAMAGE** | Minor localized issues; still usable | 65% | Small stain, light scratches, minor dent |
| **HEAVY_DAMAGE** | Multiple/severe damage; unusable | 0% | Large rips, heavy staining, broken frame |

## Decision Tree

```
Does it have ANY visible damage?
├─ NO  → CLEAN ✓
└─ YES → How bad is it?
    ├─ Single small issue (1-2 inch tear, fist-sized stain, minor indent)
    │  → LIGHT_DAMAGE ✓
    └─ Multiple issues OR large damage (tear > 2 inches, missing parts, broken frame)
       → HEAVY_DAMAGE ✓
```

## Damage Types: Check ALL that apply

Use these to explain the condition:
    
- **tears**: Rips or holes (any size)
- **stains**: Discoloration, marks, dirt
- **scratches**: Surface marks on frame/legs
- **sagging**: Cushion not springing back
- **frame**: Crack/warp in wooden frame
- **missing**: Leg, pillow, or part gone
- **seams**: Visible seam separation
- **pet**: Claw marks, bites
- **water**: Watermarks, mold, moisture
- **wear**: General pilling, fading

## Severity Scale (for each damage type)

- **LIGHT**: Cosmetic, easily cleaned/repaired
- **MODERATE**: Noticeable, professional cleaning might help
- **SEVERE**: Permanent, requires replacement

## Quick Examples

### ✅ CLEAN
- Professional Shopify product photos
- New sofas from furniture store listings
- User photos: "selling my sofa, never sat on"
- No visible marks, stains, or defects

### ⚠️ LIGHT_DAMAGE
- Small wine stain on removable cushion
- 1-inch tear in fabric (not exposing foam)
- Light pet scratches on armrest
- Loose thread in seam
- Minor cushion dent (bounces back when pressed)
- Slight water mark or dust
- Fading on one section only

### ❌ HEAVY_DAMAGE
- Tear >2 inches OR multiple tears
- Rip exposing foam/stuffing
- Large stain covering >1 cushion
- Crushed cushion (doesn't bounce back)
- Broken wooden leg or frame
- Multiple claw scratches with damage
- Visible mold or water damage
- Seam split in multiple places
- Missing crucial parts (armrest, leg)

## Borders Between Categories

| Ambiguous Case | How to Decide |
|---|---|
| Small stain that might clean vs permanent stain | If it lifts with light wiping → LIGHT; if permanent → HEAVY |
| Loose seam (1 area) vs split seam (multiple places) | 1 area = LIGHT; 2+ areas = HEAVY |
| Slight sagging vs deep crushing | Press hard: bounces back = LIGHT; stays crushed = HEAVY |
| One cushion damaged vs multiple | 1 = LIGHT; 2+ = HEAVY |
| Pet scratches (surface) vs pet gouges (deep) | Surface marks = LIGHT; chunks missing = HEAVY |

### When Unsure: Ask Yourself
> "Would I accept this return as a furniture store?"

- Yes, definitely → CLEAN or LIGHT_DAMAGE
- No way → HEAVY_DAMAGE
- Maybe... → Mark `ambiguous_flag = TRUE` for review

## Annotation Speed Goals

- **CLEAN**: 15-20 seconds (quick check)
- **LIGHT_DAMAGE**: 45-60 seconds (list damage types)
- **HEAVY_DAMAGE**: 60-90 seconds (multiple damage types)

**Total for 300 images: 4-6 hours**

## File Naming Convention

Must follow this exactly:

```
[CONDITION]_[SOURCE]_[DATE]_[DAMAGE_TYPE]_[INDEX].jpg
```

### Examples

```
CLEAN_shopify_20250307_none_001.jpg
LIGHT_DAMAGE_craigslist_20250306_stains_042.jpg
HEAVY_DAMAGE_marketplace_20250306_tears_015.jpg
LIGHT_DAMAGE_manual_20250307_pet_003.jpg
HEAVY_DAMAGE_synthetic_20250307_water_001.jpg
```

### Rules
- `[CONDITION]` must be: CLEAN, LIGHT_DAMAGE, or HEAVY_DAMAGE
- `[SOURCE]`: shopify, marketplace, manual, synthetic
- `[DATE]`: YYYYMMDD (e.g., 20250307 for March 7, 2025)
- `[DAMAGE_TYPE]`: primary damage or "none" if CLEAN
- `[INDEX]`: 3-digit counter (001, 002, ..., 200)

## CSV Columns to Fill

When annotating, record:

| Column | Value | Notes |
|--------|-------|-------|
| image_filename | CLEAN_shopify_20250307_none_001.jpg | Must match file name |
| condition_class | CLEAN | From labels above |
| damage_types | none | Semicolon-separated if multiple (e.g., "stains;wear") |
| severity_of_primary_damage | NONE | LIGHT / MODERATE / SEVERE (or NONE if clean) |
| affected_region | N/A | E.g., "front_cushion", "armrest", "multiple" |
| confidence_of_label | 0.98 | 0.0–1.0 (your certainty) |
| source | shopify | Type of source |
| date_labeled | 20250307 | When you labeled it |
| ambiguous_flag | FALSE | TRUE if unsure |
| notes | Professional product photo | Free-form notes |

## QA Checklist

Before finalizing dataset:

- [ ] All 300 images have filenames following convention
- [ ] All images in `data/raw/CLEAN/`, `LIGHT_DAMAGE/`, `HEAVY_DAMAGE/`
- [ ] CSV has 300 rows (one per image)
- [ ] No contradictions (e.g., labeled CLEAN but has damage types)
- [ ] Spot-check 20% (60 images) for consistency
- [ ] No duplicate images across classes
- [ ] All images are valid (load without errors)
- [ ] Confidence scores filled in (scale 0-1)
- [ ] Ambiguous images marked
- [ ] Source type recorded for each image

## Red Flags During Annotation

⚠️ If you see...

- Image too dark → Skip (request better lighting)
- Extreme close-up → Skip (request full sofa view)
- Computer-generated/fake → Mark synthetic, else skip
- Sofa cut off in frame → Skip (need full view)
- Duplicate of another image → Mark and skip one
- Unrelated (not a sofa) → Skip

## Tools

**Label Studio** (Recommended)
```bash
pip install label-studio
label-studio start
```
Then import images and create CSV export.

**Python Script** (If manually creating CSV)
```python
import pandas as pd

data = {
    'image_filename': ['CLEAN_shopify_20250307_none_001.jpg', ...],
    'condition_class': ['CLEAN', ...],
    'damage_types': ['', ...],
    # ... other columns
}

df = pd.DataFrame(data)
df.to_csv('data/sofa_returns_dataset.csv', index=False)
```

## Tricky Cases & Examples

### Case 1: Fabric Pattern vs Stain
**Photo:** Sofa with striped pattern; one stripe is darker.
- **Wrong:** Mark as stain → LIGHT_DAMAGE
- **Right:** Is it repeating pattern or actual discoloration? Check consistency. If pattern is uniform elsewhere, it's a stain. If pattern, it's CLEAN.

### Case 2: Shadow vs Damage
**Photo:** Sofa with obvious shadow from lighting.
- **Wrong:** Mark as stain
- **Right:** Look at edge sharpness. Shadows have soft edges; stains have varied edges. Mark as CLEAN.

### Case 3: Used vs Damaged
**Photo:** Sofa with fading from sun exposure.
- **Classification:** LIGHT_DAMAGE (worn/faded)
- **Damage type:** wear
- **Note:** Sun fading is wear, not structural damage. Still returnable with partial refund.

### Case 4: Sofa with Multiple Minor Issues
**Photo:** Small stain (fist-sized) + light scratches on leg + one loose thread.
- **Classification:** LIGHT_DAMAGE (all minor, localized)
- **Damage types:** stains, scratches, seams
- **Note:** Multiple LIGHT issues = still LIGHT_DAMAGE

### Case 5: One Large Issue
**Photo:** 4-inch tear exposing foam.
- **Classification:** HEAVY_DAMAGE (single severe issue)
- **Damage type:** tears
- **Note:** Single SEVERE issue = HEAVY_DAMAGE

---

**Questions?** Check the decision tree or ask an expert before labeling.
