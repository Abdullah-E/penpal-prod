from faker import Faker
import random
import requests


if __name__ == "__main__":
    auth_token = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImMxNTQwYWM3MWJiOTJhYTA2OTNjODI3MTkwYWNhYmU1YjA1NWNiZWMiLCJ0eXAiOiJKV1QifQ.eyJyb2xlIjoidXNlciIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9hd2F5b3V0LTU1ZmUyIiwiYXVkIjoiYXdheW91dC01NWZlMiIsImF1dGhfdGltZSI6MTcyMTM0Nzk5OSwidXNlcl9pZCI6InkzTzlLcEJyenpNVFZDeXpsVXFlNVFFTkZUOTIiLCJzdWIiOiJ5M085S3BCcnp6TVRWQ3l6bFVxZTVRRU5GVDkyIiwiaWF0IjoxNzIxMzQ3OTk5LCJleHAiOjE3MjEzNTE1OTksImVtYWlsIjoiaG1tbUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiaG1tbUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.PX0a_LNrY55879lGP4nLI4C-LB2YgWkznk9frCuOPDOO6mrCoAtkMtuNjERgstXO5ZcvduHcD34nQXKg6-J0-K14hMAJXZQkNPy7v8aZsy8-XggfUNtr_KNw-5TJkfTPc-xxkx3phDTr1omzMOb8m7Z0slYft6bEo3-3LLth0SSLnxLLCOD6xzhPldE2Dy_eWNRrU_nx76v3qSW02bL8EawGFc_toL2_iNDthqr2EWpVxvD8R0wsccbXH-EOTWeU5ZN6Dy2KhlIomKHIqr35BQcJDdVNhmVw8wZ71VlKr2nDnStXwTq7hAWxfl-Et_Z6sAiYQLji9rIh_PU1tItfCA"
    
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
        print(f"Updating {cust['firstName']}")
        rating = 0
        ratingReal = 0
        numRatings = 0
        
        try:
            numRatings = cust["numRatings"]
        except KeyError:
            numRatings = 0
        try:
            ratingReal = cust["ratingReal"]
        except KeyError:
            try:
                ratingReal = cust["rating"]
                rating = cust["rating"]
            except KeyError:
                ratingReal = 0
                rating = 0
            
        
        req_body = {
            "profilePic":"",
            "ratingReal":ratingReal,
            "rating":rating,
            "numRatings":numRatings,
        }
        
        put_response = requests.put(f"{BASE_URL}/customer/test?id={cust['_id']}", headers={"Authorization":f"Bearer {auth_token}"},json=req_body)
        # print(put_response.json())
    
    