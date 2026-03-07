#!/bin/bash
# Test Gemini API — ReturnClip
# Model: gemini-2.0-flash

API_KEY="AIzaSyB6oCBo_p8-w6wYbDt-UWz4oe4R-FpE3ok"

echo "=== Gemini API Test ==="
echo "Sending return policy reasoning prompt..."

curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
  "contents": [{"parts": [{"text": "You are a return policy enforcement AI. Analyze: Item=Velvet Accent Chair $299, condition score=95/100 (excellent), 5 days since purchase, 30-day return window, restocking fee threshold 85%. Respond with JSON: {\"decision\": string, \"refundAmount\": number, \"originalAmount\": number, \"restockingFee\": number|null, \"explanation\": string, \"policyViolations\": string[], \"alternativeOptions\": [{\"id\": string, \"type\": string, \"amount\": number, \"bonusAmount\": number|null, \"description\": string}]}"}]}],
  "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2}
}' | python3 -m json.tool

echo ""
echo "=== Test Complete ==="
