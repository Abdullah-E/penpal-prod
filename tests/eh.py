from faker import Faker
import random
import requests
fake = Faker()

customer_enums = {
    "race" : [
        "American Indian/Alaskan Native",
        "Asian American",
        "Black/African American",
        "Hispanic/Latino American",
        "Native Hawaiian/Pacific Islander",
        "White",
        "Multiracial",
        "Other",
    ],
    
    "education": [
        "Less than HS Diploma or GED",
        "HS Diploma or GED",
        "Trade Certification",
        "Associates degree",
        "Bachelors degree",
        "Masters degree",
        "Doctorate",
        "Other"
    ],
    
    "gender" : [
        "Male",
        "Female",
        "Other"
    ],
    
    "orientation" : [
        "Other",
        "Bi-Sexual",
        "Gay",
        "Lesbian",
        "Straight",
        "Transgender",
        "LGBTQ+"
    ],
    
    "hairColor":[ "Bald", "Black", "Blonde", "Brown", "Gray", "Red", "Salt and Pepper", "Other"],
    "eyeColor":
    [
        "Black" ,
        "Blue" ,
        "Brown" ,
        "Green",
        "Hazel",
        "Other" ,
    ],
    
    "spokenLanguages": [
        "English",
        "Spanish",
        "French",
        "German",
        "Italian",
        "Russian",
        "Mandarin",
        "Japanese",
        "Korean",
        "Arabic",
        "Hindi",
        "Portuguese",
        "Other"
    ],
    
    "institutionalEmailProvider":[
        "Jpay",
        "Corrlinks",
        "Securus Technologies",
        "Getting Out",
        "GTL"
    ],
    
    "personality":{
        "hobbies" : [
            "Crocheting",
            "Sewing",
            "Drawing",
            "Painting",
            "Model Building",
            "Hiking",
            "Biking",
            "Travelling",
            "Sightseeing",
            "Photography",
            "Videogaming",
            "Quilting",
            "Writing",
            "Card Games",
            "Others",
        ],
        "sports" : [
            "Football",
            "Basketball",
            "Soccer",
            "Swimming",
            "Tennis",
            "Baseball",
            "Lacrosse",
            "Hockey",
            "Racing",
            "Wrestling",
            "Golf",
            "Others",
        ],
        "likes" : [
            "Fast Food",
            "Politics",
            "Tattoos",
            "Concerts",
            "Night Clubs",
            "Movie theaters",
            "Exercise",
            "Dance",
            "Sing",
            "Post on Social Media",
            "Puzzles",
            "Reading Books",
            "Hanging with friends",
            "Staying home",
            "Dogs",
            "Cats",
            "Music",
            "Others",
        ],
        "personality" : [
            "Shy",
            "Outgoing",
            "Funny",
            "Good listener",
            "Work well with others",
            "Organized",
            "Messy",
            "Like routines",
            "Serious",
            "Humble",
            "Arrogant",
            "Quiet",
            "Loud",
            "Smart",
            "Others",
        ],
        "bookGenres" : [
            "Educational",
            "Biography",
            "Autobiography",
            "Thrillers",
            "Mystery",
            "Romance",
            "Western",
            "Horror",
            "Adventure",
            "True Crime",
            "Crime",
            "Fictional",
            "Non fictional",
            "Science Fiction",
            "Romance",
            "Drama",
            "Faith",
            "Others",
        ],
        "musicGenres" : [
            "Classic Rock",
            "Soft Rock",
            "Pop",
            "Rap",
            "Hip Hop",
            "Country",
            "Classical",
            "Jazz",
            "Blues",
            "Alternative",
            "Soul/R and B",
            "Rock",
            "Reggae",
            "Latin",
            "Christian/Gospel",
            "Others",
        ],
        "movieGenres" : [
            "Action",
            "Comedy",
            "Drama",
            "Romance",
            "Mystery",
            "Thriller",
            "Horror",
            "Animation",
            "Adventure",
            "Crime",
            "Documentary",
            "Fantasy",
            "History",
            "Sports",
            "Science Fiction",
            "Western",
            "Faith",
            "Family",
            "Romantic Comedy",
            "Others",
        ]
    }
}
auth_token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjBjYjQyNzQyYWU1OGY0ZGE0NjdiY2RhZWE0Yjk1YTI5ZmJhMGM1ZjkiLCJ0eXAiOiJKV1QifQ.eyJyb2xlIjoidXNlciIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9hd2F5b3V0LTU1ZmUyIiwiYXVkIjoiYXdheW91dC01NWZlMiIsImF1dGhfdGltZSI6MTcyMjEwODk0NiwidXNlcl9pZCI6Ik12dGhQSjk3MzJWdjVIU1NsZnZJdVlWQ1lPQTIiLCJzdWIiOiJNdnRoUEo5NzMyVnY1SFNTbGZ2SXVZVkNZT0EyIiwiaWF0IjoxNzIyMTA4OTQ2LCJleHAiOjE3MjIxMTI1NDYsImVtYWlsIjoiY29obGVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImNvaGxlQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.q1AsC6v10xC7xNRxDfbcTdT33fuxA9nEkllgWO01fCeu_Fm5eMsrpEl_GJiyFWt4lEfjmxy-hL6-tyyAT31OBMrSACjsd8XXwQa4Ff7-reiMXPSayVV-mxKjWrl4Meb4Tzk2iHxYPM5JmcH5xq_WCUbr-E3Z_PuZ1qH3wEFZhL7ifpwljrOC1Gj9PAoOTqQYh9bHS9lbHaC7nPGHdwI03BDAUSpz_85dUr5S60B4Wy69bwoFrhSj-PTr9ib2IVbSMdeIePlfYkM1HVEeZbJ0nzQ6fJawCGSqXl3I8kMeEYRKfgWVUT2xU61hF_uuUf2TzSE6Vd1Av0tHAdPMX0sv4Q"
BASE_URL = "http://localhost:8000/api/v1"
# BASE_URL = "https://penpal-prod.vercel.app/api/v1"


def create_customer():
    
    cust_obj = {}
    # for _ in range(num_customers):
        
    cust_obj["firstName"] = fake.first_name()
    cust_obj["lastName"] = fake.last_name()
    cust_obj["email"] = fake.email()
    cust_obj["age"] = str(fake.random_int(min=18, max=100))
    cust_obj["inmateNumber"] = str(fake.random_int(min=1000000, max=9999999))
    cust_obj["mailingAddress"] = fake.address()
    cust_obj["city"] = fake.city()
    cust_obj["state"] = fake.state()
    cust_obj["zipCode"] = fake.zipcode()
    cust_obj["gender"] = random.choice(customer_enums["gender"])
    cust_obj["orientation"] = random.choice(customer_enums["orientation"])
    cust_obj["race"] = random.choice(customer_enums["race"])
    cust_obj["dateOfBirth"] = fake.date_of_birth()
    cust_obj["height"] = str(fake.random_int(min=48, max=84))
    cust_obj["weight"] = str(fake.random_int(min=100, max=300))
    cust_obj["hairColor"] = str(random.choice(customer_enums["hairColor"]))
    cust_obj["eyeColor"] = str(random.choice(customer_enums["eyeColor"]))
    # 2 random languages in a list:
    cust_obj["spokenLanguages"] = random.sample(customer_enums["spokenLanguages"], 2)
    cust_obj["institutionalEmailProvider"] = random.choice(customer_enums["institutionalEmailProvider"])
    cust_obj["personality"] = {
        trait: random.sample(customer_enums["personality"][trait], 2) for trait in customer_enums["personality"]
    }
    return cust_obj

def get_customers():
    all_customers = requests.get(f"{BASE_URL}/customer", headers={"Authorization":f"Bearer {auth_token}"}).json()
    # print(f"Bearer {auth_token}")
    customersList = all_customers["data"]
    return customersList

def update_customer(new_body, c_id):
    update_resp = requests.put(f"{BASE_URL}/customer/direct?id={c_id}", 
                                headers= {"Authorization": f"Bearer {auth_token}"},
                                json=new_body).json()
    print(update_resp)

if __name__ == "__main__":
    
        # print(put_response.json())
    # update = {
    #     "status": "active",
    # }
    customers = get_customers()
    # print(customers)
    # if key status isnt present in customer update the customer
    update = {
        "pendingPayments":{
            "creation":True,
            "update":False,
            "renewal":False,
            "totalAmount":1,
        }
    }
    for cust in customers:
        print(f"Updating {cust['firstName']}")
        update_customer(update, cust["_id"])
        break



    


def ratings_fix():
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