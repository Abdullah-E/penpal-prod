import requests
import pytest
import random
from faker import Faker

BASE_URL = 'http://localhost:8000/api/v1'  # Replace with your server's URL
fake = Faker()
user_roles = ["admin", "user", ""]
user_post_obj_examp = {
    "email": "",
    "password": "",
    "fullname": "",
}



@pytest.fixture
def user_data():
    return {
        "email": fake.email(),
        "password": fake.password(),
        "fullname": fake.name()
    }

def test_create_user(user_data):
    
    # response = requests.post(f"{BASE_URL}/user", json=user_data)
    # add role query to request:
    
    response = requests.post(f"{BASE_URL}/user?role={random.choice(user_roles)}", json=user_data)
    
    # Check that the request was successful
    assert response.status_code == 201, f"Expected status code 201, got {response.status_code} , response: {response.json()}"
    
    # Check the response structure
    response_data = response.json()
    assert response_data['status_code'] == 201
    assert response_data['message'] == "User created successfully"
    assert 'data' in response_data
    assert 'email' in response_data['data']
    assert 'fullname' in response_data['data']
    assert 'firebase_uid' in response_data['data']
    
    # Check that the password is not in the response data
    assert 'password' not in response_data['data']
