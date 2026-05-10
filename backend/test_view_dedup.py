"""
Test the deduplication logic for ProductViews
"""

import requests
import time

# Test endpoint (make sure Django server is running)
BASE_URL = "http://localhost:8000/api"

# Get a product ID (assuming product with ID 1 exists)
product_id = 1

print("Testing ProductView deduplication...")

# Make multiple rapid requests to the same product
print(f"\n1. Making first request to product {product_id}...")
response1 = requests.get(f"{BASE_URL}/products/{product_id}/")
print(f"Response 1: {response1.status_code}")

print(f"\n2. Making second request immediately (should be deduplicated)...")
response2 = requests.get(f"{BASE_URL}/products/{product_id}/")
print(f"Response 2: {response2.status_code}")

print(f"\n3. Making third request immediately (should be deduplicated)...")
response3 = requests.get(f"{BASE_URL}/products/{product_id}/")
print(f"Response 3: {response3.status_code}")

print("\n✅ Check server logs to see if deduplication messages appear")
print("Expected: First request creates view, subsequent requests are skipped")
print("\nNote: Make sure Django development server is running on localhost:8000")