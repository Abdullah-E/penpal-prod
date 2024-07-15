import requests
import pytest
import random
from faker import Faker
import datetime
import json

BASE_URL = 'http://localhost:8000/api/v1'  # Replace with your server's URL
fake = Faker()

with open('customer/test_data/personality_data.json', 'r') as file:
    personality_data = json.load(file)

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
    def get_random_traits(traits, max_count=3):
        return random.sample(traits, random.randint(1, max_count))
    
    personality = {category: get_random_traits(traits) for category, traits in personality_data.items()}
    
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
        "personality": personality
    }

def test_create_customer(customer_data):
    response = requests.post(f"{BASE_URL}/customer/test", json=customer_data)
    
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
    assert 'personality' in response.json()['data']