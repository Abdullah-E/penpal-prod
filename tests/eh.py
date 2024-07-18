from faker import Faker
import random
import requests

if __name__ == "__main__":
    race_options = [
        "American Indian/Alaskan Native",
        "Asian American",
        "Black/African American",
        "Hispanic/Latino American",
        "Native Hawaiian/Pacific Islander",
        "White",
        "Multiracial",
        "Other",
    ]
    
    edu_options = [
        "Less than HS Diploma or GED",
        "HS Diploma or GED",
        "Trade Certification",
        "Associates degree",
        "Bachelors degree",
        "Masters degree",
        "Doctorate",
        "Other"
    ]
    
    gender_options = [
        "Male",
        "Female",
        "Other"
    ]
    
    orientation_options = [
        "Other",
        "Bi-Sexual",
        "Gay",
        "Lesbian",
        "Straight",
        "Transgender",
        "LGBTQ+"
    ]
    
    BASE_URL = "https://penpal-prod.vercel.app/api/v1"
    all_customers = requests.get(f"{BASE_URL}/customer/test").json()
    customersList = all_customers["data"]
    
    for cust in customersList:
        print(f'updating: {cust["firstName"]} {cust["lastName"]}')
        
        req_body = {
            "gender": random.choice(gender_options),
            "orientation": random.choice(orientation_options),
        }
        
        put_response = requests.put(f"{BASE_URL}/customer/test?id={cust['_id']}", json=req_body)
        print(put_response.json())
    
    