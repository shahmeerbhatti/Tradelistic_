import requests
import json

# Test cart API functionality
base_url = "http://localhost:8000"

# You'll need to replace these with actual login credentials
def test_cart_api():
    # First, login to get a token
    login_data = {
        "username": "your_username",  # Replace with actual username
        "password": "your_password"   # Replace with actual password
    }
    
    login_response = requests.post(f"{base_url}/users/login/", data=login_data)
    
    if login_response.status_code == 200:
        token = login_response.json().get('token')
        headers = {'Authorization': f'Token {token}'}
        
        # Test get cart (should be empty initially)
        cart_response = requests.get(f"{base_url}/products/get_cart/", headers=headers)
        print("GET Cart Response:")
        print(json.dumps(cart_response.json(), indent=2))
        
        # Test add to cart (replace 1 with actual product ID)
        add_response = requests.post(
            f"{base_url}/products/1/add_to_cart/", 
            data={"quantity": 1},
            headers=headers
        )
        print("\nADD to Cart Response:")
        print(json.dumps(add_response.json(), indent=2))
        
        # Test get cart again (should have items now)
        cart_response_after = requests.get(f"{base_url}/products/get_cart/", headers=headers)
        print("\nGET Cart After Adding:")
        print(json.dumps(cart_response_after.json(), indent=2))
        
    else:
        print(f"Login failed: {login_response.status_code}")
        print(login_response.text)

if __name__ == "__main__":
    test_cart_api()