#!/bin/bash
# Test Cloudinary API — ReturnClip
# Cloud name: dyrit94wr | Upload preset: returnclip_uploads

echo "=== Cloudinary API Test ==="
echo "Downloading sample image..."
curl -s -o /tmp/test_chair.jpg "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=200"

echo "Uploading to Cloudinary..."
curl -s -X POST "https://api.cloudinary.com/v1_1/dyrit94wr/image/upload" \
  -F "file=@/tmp/test_chair.jpg" \
  -F "upload_preset=returnclip_uploads" \
  -F "context=return_verification=true|analysis_type=condition" \
  | python3 -m json.tool

echo ""
echo "=== Test Complete ==="
