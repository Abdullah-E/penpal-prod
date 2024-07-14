import requests
import pytest
import random
from faker import Faker
import datetime


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


HAIR_TYPES = ["Bald", "Black", "Blonde", "Brown", "Gray", "Red", "Salt and Pepper", "Other"]
EYE_TYPES = [
    "Black" ,
    "Blue" ,
    "Brown" ,
    "Green",
    "Hazel",
    "Other" ,
    ]
@pytest.fixture
def customer_data():
    return {
        "firstName": fake.first_name(),
        "lastName": fake.last_name(),
        "inmateNumber": str(fake.random_int(min=1000, max=9999)),
        "mailingAddress": fake.address(),
        "city": fake.city(),
        "state": fake.state(),
        "zipcode": fake.zipcode(),
        "dateOfBirth": fake.date_of_birth().isoformat(),
        "height": fake.random_int(min=50, max=100),
        "weight": fake.random_int(min=50, max=100),
        "hairColor": random.choice(HAIR_TYPES),
        "eyeColor": random.choice(EYE_TYPES),
        
    }

def test_create_customer(customer_data):
    response = requests.post(f"{BASE_URL}/customer", json=customer_data)
    
    assert response.status_code == 201, f"Expected status code 201, got {response.status_code} , response: {response.json()}"
    
    assert response.json()['status_code'] == 201
    assert response.json()['message'] == "Customer created successfully"
    assert 'data' in response.json()
    assert 'firstName' in response.json()['data']
    assert 'lastName' in response.json()['data']
    assert 'inmateNumber' in response.json()['data']
    assert 'mailingAddress' in response.json()['data']
    assert 'city' in response.json()['data']
    assert 'state' in response.json()['data']
    assert 'zipcode' in response.json()['data']
    assert 'dateOfBirth' in response.json()['data']
    assert 'height' in response.json()['data']
    assert 'weight' in response.json()['data']
    assert 'hairColor' in response.json()['data']
    assert 'eyeColor' in response.json()['data']