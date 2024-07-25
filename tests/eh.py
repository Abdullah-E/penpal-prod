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
auth_token = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImMxNTQwYWM3MWJiOTJhYTA2OTNjODI3MTkwYWNhYmU1YjA1NWNiZWMiLCJ0eXAiOiJKV1QifQ.eyJyb2xlIjoidXNlciIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9hd2F5b3V0LTU1ZmUyIiwiYXVkIjoiYXdheW91dC01NWZlMiIsImF1dGhfdGltZSI6MTcyMTM0Nzk5OSwidXNlcl9pZCI6InkzTzlLcEJyenpNVFZDeXpsVXFlNVFFTkZUOTIiLCJzdWIiOiJ5M085S3BCcnp6TVRWQ3l6bFVxZTVRRU5GVDkyIiwiaWF0IjoxNzIxMzQ3OTk5LCJleHAiOjE3MjEzNTE1OTksImVtYWlsIjoiaG1tbUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiaG1tbUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.PX0a_LNrY55879lGP4nLI4C-LB2YgWkznk9frCuOPDOO6mrCoAtkMtuNjERgstXO5ZcvduHcD34nQXKg6-J0-K14hMAJXZQkNPy7v8aZsy8-XggfUNtr_KNw-5TJkfTPc-xxkx3phDTr1omzMOb8m7Z0slYft6bEo3-3LLth0SSLnxLLCOD6xzhPldE2Dy_eWNRrU_nx76v3qSW02bL8EawGFc_toL2_iNDthqr2EWpVxvD8R0wsccbXH-EOTWeU5ZN6Dy2KhlIomKHIqr35BQcJDdVNhmVw8wZ71VlKr2nDnStXwTq7hAWxfl-Et_Z6sAiYQLji9rIh_PU1tItfCA"
BASE_URL = "http://localhost:8000/api/v1"


def create_customers():
    
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


if __name__ == "__main__":
    
    print(create_customers())
    pass
    # BASE_URL = "https://penpal-prod.vercel.app/api/v1"
    
        # print(put_response.json())
    



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