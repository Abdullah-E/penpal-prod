from faker import Faker
import random
import math
import requests
fake = Faker()

class Customer_Test:
    def __init__(self, num_customers, user_credentials):
        self.admin_credentials = {
            "email":"penpaldev@gmail.com",
            "password":"admin123"
        }
        self.admin_token = None
        
        self.num_customers = num_customers
        self.customers = []
        self.customer_enums = {}
        self.user_credentials = user_credentials
        self.user_tokens = []
        self.base_url = "http://localhost:8000/api/v1"
        
        self.post_responses = []
        self.checkout_sessions = []
        
    def populate_tokens(self):
        end_point = "/user/login"
        for user in self.user_credentials:
            login_resp = requests.post(f"{self.base_url}{end_point}", json=user).json()
            self.user_tokens.append(login_resp["data"]["token"])
            print("logged in", user)
    
    def populate_admin_token(self):
        end_point = "/user/login"
        login_resp = requests.post(f"{self.base_url}{end_point}", json=self.admin_credentials).json()
        self.admin_token = login_resp["data"]["token"]
        print("logged in admin")
    
    def get_all_customers(self):
        endpoint = "/admin/customer"
        ids = [resp["data"]["_id"] for resp in self.post_responses]
        print("fetching", ids, len(ids))
        if not self.admin_token:
            self.populate_admin_token()
        params_payload = [("id",id) for id in ids]
        print("fetching", params_payload)
        get_response = requests.get(f"{self.base_url}{endpoint}", headers={"Authorization":f"Bearer {self.admin_token}"}, params=params_payload)
        self.customers = get_response.json()["data"]
        print(f"Retrieved {len(self.customers)} customers")
        print("--------------Got all customers--------------")
        
    
    def post_random_customers(self):
        endpoint = "/customer"
        
        customer_objects = []
        for _ in range(self.num_customers):
            customer_objects.append(create_customer())
        
        
        for customer in customer_objects:
            token = random.choice(self.user_tokens)
            print("posting\n", customer["basicInfo"]["firstName"], customer["basicInfo"]["lastName"])
            post_response = requests.post(f"{self.base_url}{endpoint}", headers={"Authorization":f"Bearer {token}"}, json=customer)
            self.post_responses.append(post_response.json())
        
        # print(self.post_responses)
        
        print("--------------Posted all customers--------------")
    def pay_creation_customers(self):
        checkout_endpoint = "/payment/create-checkout-session"
        session_endpoint = "/payment/session-status"

        for customer in self.customers:
            token = random.choice(self.user_tokens)            
            print("paying for\n", customer["basicInfo"]["firstName"])
            body_payload = {
                "cid":customer["_id"],
                "creation":True
            }
            checkout_resp = requests.post(
                f"{self.base_url}{checkout_endpoint}", 
                headers={"Authorization":f"Bearer {token}"},
                json=body_payload,
                params={"sendId":"true"}
            ).json()
            session_id = checkout_resp["data"]["sessionId"]
            print(checkout_resp["data"]["sessionId"])
            print(checkout_resp["message"])
            
            param_payload = {
                "session_id":session_id,
                "test_status":"complete"
            }
            
            session_resp = requests.get(
                f"{self.base_url}{session_endpoint}",
                headers={"Authorization":f"Bearer {token}"},
                params=param_payload
            ).json()
            print(session_resp["message"])
            
        print("--------------Paid for all customers--------------")
    def approve_customers(self):
        approve_endpoint = "/admin/approve-customer"
        for customer in self.customers:
            # print(customer)
            if not self.admin_token:
                self.populate_admin_token()
            token = self.admin_token
            print("Approving\n", customer["basicInfo"]["firstName"])
            approve_resp = requests.put(f"{self.base_url}{approve_endpoint}", headers={"Authorization":f"Bearer {token}"}, params={"id":customer["_id"]})
            print(approve_resp.json()["message"])
        print("--------------Approved all customers--------------")

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
    
    "veteranStatus":[
        "Never served",
        "Army veteran",
        "Air force veteran",
        "Navy veteran",
        "Space force veteran",
        "Coast guard veteran",
        "Marine veteran",
        "National guard veteran"
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

def create_customer():
    
    cust_obj = {
        "basicInfo":{},
        "personalityInfo":{},
    }
    # for _ in range(num_customers):
        
    cust_obj["basicInfo"]["firstName"] = fake.first_name()
    cust_obj["basicInfo"]["lastName"] = fake.last_name()
    cust_obj["basicInfo"]["email"] = fake.email()
    cust_obj["basicInfo"]["age"] = str(fake.random_int(min=18, max=100))
    cust_obj["basicInfo"]["inmateNumber"] = str(fake.random_int(min=1000000, max=9999999))
    cust_obj["basicInfo"]["mailingAddress"] = fake.address()
    cust_obj["basicInfo"]["city"] = fake.city()
    cust_obj["basicInfo"]["state"] = fake.state()
    cust_obj["basicInfo"]["zipcode"] = fake.zipcode()
    cust_obj["basicInfo"]["bio"]  = fake.text()
    cust_obj["basicInfo"]["gender"] = random.choice(customer_enums["gender"])
    cust_obj["basicInfo"]["orientation"] = random.choice(customer_enums["orientation"])
    cust_obj["basicInfo"]["race"] = random.choice(customer_enums["race"])
    cust_obj["basicInfo"]["dateOfBirth"] = fake.date_of_birth().strftime("%Y-%m-%d")
    cust_obj["basicInfo"]["height"] = str(fake.random_int(min=48, max=84))
    cust_obj["basicInfo"]["weight"] = str(fake.random_int(min=100, max=300))
    cust_obj["basicInfo"]["hairColor"] = str(random.choice(customer_enums["hairColor"]))
    cust_obj["basicInfo"]["eyeColor"] = str(random.choice(customer_enums["eyeColor"]))
    cust_obj["basicInfo"]["spokenLanguages"] = random.sample(customer_enums["spokenLanguages"], 2)
    cust_obj["basicInfo"]["institutionalEmailProvider"] = random.choice(customer_enums["institutionalEmailProvider"])
    cust_obj["basicInfo"]["veteranStatus"] = random.choice(customer_enums["veteranStatus"])
    cust_obj["personalityInfo"] = {
        trait: random.sample(customer_enums["personality"][trait], 2) for trait in customer_enums["personality"]
    }
    
    # cust_obj["photos"]["imageUrl"]
    bio_word_count = len(cust_obj["basicInfo"]["bio"].split(" "))
    
    if math.ceil(bio_word_count/350) > 1:
        cust_obj["wordLimit"] = math.ceil((bio_word_count-350)/100) -1 
    else :
        cust_obj["wordLimit"] = 0
    cust_obj["totalPaidPhotos"] = 0
    return cust_obj



if __name__ == "__main__":
    
    user_credentials = [
        {
            "email":"abdullahehsan4242@gmail.com",
            "password":"alakazam"
        },
        {
            "email":"bully.ae@gmail.com",
            "password":"alakazam"
        }
    ]
    
    test_suite = Customer_Test(50, user_credentials)
    test_suite.populate_tokens()
    test_suite.post_random_customers()
    test_suite.get_all_customers()
    test_suite.pay_creation_customers()
    test_suite.approve_customers()
    


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