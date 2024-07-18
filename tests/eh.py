from faker import Faker
import random
import requests


if __name__ == "__main__":
    auth_token = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImMxNTQwYWM3MWJiOTJhYTA2OTNjODI3MTkwYWNhYmU1YjA1NWNiZWMiLCJ0eXAiOiJKV1QifQ.eyJyb2xlIjoidXNlciIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9hd2F5b3V0LTU1ZmUyIiwiYXVkIjoiYXdheW91dC01NWZlMiIsImF1dGhfdGltZSI6MTcyMTMzMzM5MywidXNlcl9pZCI6InkzTzlLcEJyenpNVFZDeXpsVXFlNVFFTkZUOTIiLCJzdWIiOiJ5M085S3BCcnp6TVRWQ3l6bFVxZTVRRU5GVDkyIiwiaWF0IjoxNzIxMzMzMzkzLCJleHAiOjE3MjEzMzY5OTMsImVtYWlsIjoiaG1tbUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiaG1tbUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.ITRLMc5j4p9PnO3IPWDLx8MvYmZY4uMHKzzaq4ZtuvzEpSQ8g15VLiegbAn2EFJrj-xcFmYT0IeMTmLIWJ3hgrtauXGCCeBoCIYPxt1qsrVPVcs1Wzhi6IFsTxvo82daNxwBd9domEQgP1ILm7nmkETzkh-JcarfVMr-tGAC3KdPLcSrtaRoQ1W7wFiedOw1RuytW0WKc55x1GsPLZSEvegBbmfODs5tezIuX2LyQkhGUI-oR8npfNRvBi2yrOYDUivrasSgMhSThZGvf16uWjx-EbJsjTLd-oRROFvKTeJ-wHXgf9MlqqZMCIimqsyHHFMqusms0XbWU7IESV7pcA"
    
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
    
    # BASE_URL = "https://penpal-prod.vercel.app/api/v1"
    BASE_URL = "http://localhost:8000/api/v1"
    all_customers = requests.get(f"{BASE_URL}/customer/test", headers={"Authorization":f"Bearer {auth_token}"}).json()
    # print(f"Bearer {auth_token}")
    customersList = all_customers["data"]
    
    for cust in customersList:
        print(f'updating: {cust["firstName"]} {cust["lastName"]}')
        
        req_body = {
            # "gender": random.choice(gender_options),
            # "orientation": random.choice(orientation_options),
            "race": random.choice(race_options),
            "education": random.choice(edu_options),
            "age":str(random.randint(18, 60)),
        }
        
        put_response = requests.put(f"{BASE_URL}/customer/test?id={cust['_id']}", headers={"Authorization":f"Bearer {auth_token}"},json=req_body)
        print(put_response.json())
    
    