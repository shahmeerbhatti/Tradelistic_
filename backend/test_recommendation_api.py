"""
Test the recommendation API endpoint
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import RequestFactory
from rest_framework.test import force_authenticate
from products.views import ProductViewSet
from users.models import User

print("=" * 80)
print("RECOMMENDATION API ENDPOINT TEST")
print("=" * 80)

# Get or create a test customer
customer = User.objects.filter(user_type='customer').first()

if not customer:
    print("\n❌ No customer found. Creating test customer...")
    customer = User.objects.create_user(
        username='test_customer',
        email='test@customer.com',
        password='testpass123',
        user_type='customer',
        first_name='Test',
        last_name='Customer'
    )
    print(f"✅ Created customer: {customer.username}")

print(f"\n1. Testing with user: {customer.username}")
print("-" * 80)

# Create a request
factory = RequestFactory()
request = factory.get('/api/products/recommendations/')
force_authenticate(request, user=customer)

# Get the viewset
view = ProductViewSet.as_view({'get': 'recommendations'})

# Call the recommendations endpoint
print("\n2. Calling recommendations() method...")
print("-" * 80)

try:
    response = view(request)
    
    print(f"✅ API Response Status: {response.status_code}")
    
    if response.status_code == 200:
        response_data = response.data
        
        # Check if response has nested structure
        if isinstance(response_data, dict) and 'recommendations' in response_data:
            recommendations = response_data['recommendations']
            algorithm_info = response_data.get('algorithm_info', {})
            
            print(f"\n✅ API returned {response_data.get('total_count', 0)} recommendations")
            print(f"✅ Recommendation method: {algorithm_info.get('recommendation_method', 'N/A')}")
            print(f"✅ User interactions: {algorithm_info.get('total_interactions', 0)}")
            
            if algorithm_info.get('category_preferences'):
                print(f"✅ Category preferences: {algorithm_info['category_preferences']}")
            if algorithm_info.get('subcategory_preferences'):
                print(f"✅ Subcategory preferences: {algorithm_info['subcategory_preferences']}")
        else:
            recommendations = response_data if isinstance(response_data, list) else [response_data]
        
        if recommendations and len(recommendations) > 0:
            print("\n3. RECOMMENDATION RESULTS")
            print("-" * 80)
            print(f"Top 5 recommended products:")
            
            for i in range(min(5, len(recommendations))):
                product = recommendations[i]
                print(f"\n{i+1}. {product.get('name', 'N/A')}")
                print(f"   Category: {product.get('category', 'N/A')}")
                print(f"   Subcategory: {product.get('subcategory') or '(None)'}")
                print(f"   Price: ${product.get('price', 'N/A')}")
                print(f"   Owner: {product.get('owner', 'N/A')}")
            
            print(f"\n✅ Recommendation system is working correctly!")
        else:
            print("⚠️ No recommendations returned (this is OK if no products available)")
    else:
        print(f"❌ API returned error status: {response.status_code}")
        
except Exception as e:
    print(f"❌ Error calling recommendations: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("API TEST COMPLETE")
print("=" * 80)
