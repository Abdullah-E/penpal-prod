from faker import Faker
import random

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
        "Transgender Male to Female",
        "Transgender Females to Male",
        "Gender Non Conforming/Non binary",
        "Other",
    ]
    
    print(f'"race" : "{random.choice(race_options)}",')
    print(f'"education" : "{random.choice(edu_options)}",')
    print(f'"gender":"{random.choice(gender_options)}",')
    print(f'"age" : "{random.randint(18, 70)}",')
    
    