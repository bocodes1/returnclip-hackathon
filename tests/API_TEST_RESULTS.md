# API Test Results — ReturnClip

**Date:** March 7, 2026 02:35 EST

## Cloudinary API ✅ PASS

**Endpoint:** `POST https://api.cloudinary.com/v1_1/dyrit94wr/image/upload`
**Upload Preset:** `returnclip_uploads` (unsigned)

**Result:** Successful upload. Response includes:
- `public_id`: auto-generated
- `secure_url`: valid HTTPS CDN URL
- `format`: jpg
- `width/height`: correct dimensions
- `created_at`: valid timestamp

**Sample response:**
```json
{
    "public_id": "lsj4fwvkwyhqlpf8yck3",
    "secure_url": "https://res.cloudinary.com/dyrit94wr/image/upload/v1772868905/lsj4fwvkwyhqlpf8yck3.jpg",
    "format": "jpg",
    "width": 200,
    "height": 300,
    "bytes": 7448
}
```

**Notes:**
- Unsigned upload preset works correctly — no API secret needed on client side
- Context metadata (`return_verification=true`) accepted
- CDN URL immediately accessible

## Gemini API ⚠️ RATE LIMITED (Key Valid)

**Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
**API Key:** Configured and accepted by Google

**Result:** 429 RESOURCE_EXHAUSTED — free tier quota temporarily exceeded.

**Important findings:**
1. ~~`gemini-1.5-flash`~~ → **`gemini-2.0-flash`** — the old model name returns 404. **Fixed in code.**
2. API key is valid and recognized
3. Free tier has per-minute rate limits; exceeded during testing
4. The `responseMimeType: "application/json"` parameter is supported — Gemini will return structured JSON

**Action taken:**
- Updated `GeminiService.swift` to use `gemini-2.0-flash` model
- App includes graceful fallback to mock data when API is rate-limited or unavailable
- For hackathon demo, mock data ensures the flow always works end-to-end

## Summary

| API | Status | Notes |
|-----|--------|-------|
| Cloudinary Upload | ✅ Working | Unsigned preset, instant CDN |
| Cloudinary AI Vision | 🔧 Simulated | Production would use `/analyze` endpoint |
| Gemini 2.0 Flash | ✅ Key valid, ⚠️ Rate limited | Fixed model name, fallback to mock |
