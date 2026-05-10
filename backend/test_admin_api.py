import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

print("Testing Admin Dashboard API...")

# Login to get token
login_data = {
    'username': 'superadmin',
    'password': 'admin123'
}

try:
    # Login
    login_response = requests.post('http://127.0.0.1:8000/api/users/login/', json=login_data)
    print(f"Login status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        token = login_response.json().get('access')
        print(f"Token received: {token[:20]}...")
        
        # Test dashboard endpoint
        headers = {'Authorization': f'Bearer {token}'}
        dashboard_response = requests.get('http://127.0.0.1:8000/api/users/admin/dashboard/', headers=headers)
        
        print(f"\nDashboard API status: {dashboard_response.status_code}")
        print(f"Dashboard data:")
        
        if dashboard_response.status_code == 200:
            data = dashboard_response.json()
            for key, value in data.items():
                print(f"  {key}: {value}")
        else:
            print(f"Error: {dashboard_response.text}")
    else:
        print(f"Login failed: {login_response.text}")

except Exception as e:
    print(f"Connection error: {e}")
    print("Make sure backend server is running on http://127.0.0.1:8000/")