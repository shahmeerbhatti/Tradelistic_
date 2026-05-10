"""
Test API endpoints for sale creation and review submission
"""

import requests
import json

# API base URL
BASE_URL = "http://localhost:8000"

# Test data
test_data = {
    "product_id": 1,  # Assuming product with ID 1 exists
    "quantity": 1,
    "customer_name": "Test Customer",
    "customer_email": "test@example.com",
    "shipping_address_line1": "123 Test St",
    "shipping_city": "Test City",
    "shipping_state": "Test State",
    "shipping_country": "Test Country",
    "shipping_postal_code": "12345"
}

print("Testing Sale Creation API...")

try:
    # Test sale creation
    response = requests.post(f"{BASE_URL}/api/create-sale/", json=test_data)
    
    if response.status_code == 201:
        sale_data = response.json()
        print("✅ Sale created successfully!")
        print(f"   - Sale ID: {sale_data.get('sale_id')}")
        print(f"   - Sales ID: {sale_data.get('sales_id')}")
        print(f"   - Order ID: {sale_data.get('order_id')}")
        
        # Test review submission
        review_data = {
            "product_id": test_data["product_id"],
            "sales_id": sale_data.get('sales_id'),  # Use the sales_id from sale creation
            "rating": 5,
            "title": "API Test Review",
            "comment": "This is a test review from API"
        }
        
        print("\nTesting Review Submission API...")
        review_response = requests.post(f"{BASE_URL}/api/submit-review/", json=review_data)
        
        if review_response.status_code == 201:
            review_result = review_response.json()
            print("✅ Review submitted successfully!")
            print(f"   - Review ID: {review_result.get('review_id')}")
            print(f"   - Sales ID: {review_result.get('sales_id')}")
            print(f"   - Rating: {review_result.get('rating')}")
            
            # Verify sales_id matching
            if review_result.get('sales_id') == sale_data.get('sales_id'):
                print("🎉 SUCCESS: Sales IDs match between sale and review!")
            else:
                print("❌ ERROR: Sales IDs do not match!")
        else:
            print(f"❌ Review submission failed: {review_response.status_code}")
            print(f"   Response: {review_response.text}")
    else:
        print(f"❌ Sale creation failed: {response.status_code}")
        print(f"   Response: {response.text}")

except requests.exceptions.ConnectionError:
    print("❌ ERROR: Could not connect to the server.")
    print("Make sure the Django server is running with: python manage.py runserver")
except Exception as e:
    print(f"❌ ERROR: {str(e)}")