import httpx
import random
import string
from datetime import date, datetime

BASE_URL = "http://localhost:8000/api/v1"

def generate_random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def run_tests():
    print("🚀 Starting API Tests to verify Database Saving...\n")
    
    with httpx.Client(base_url=BASE_URL) as client:
        # 1. Register User
        email = f"testuser_{generate_random_string()}@example.com"
        print(f"🔹 1. Registering user: {email}")
        res = client.post("/auth/register", json={
            "email": email,
            "name": "Test User",
            "password": "password123"
        })
        if res.status_code != 201:
            print(f"❌ Failed to register: {res.text}")
            return
        token = res.json()["access_token"]
        user_id = res.json()["user"]["id"]
        print(f"✅ Success! User ID: {user_id}\n")
        
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Add Dog
        print("🔹 2. Adding a dog")
        res = client.post("/dogs", headers=headers, json={
            "name": "Buddy",
            "breed": "Golden Retriever",
            "birthday": "2020-05-10",
            "sex": "Male",
            "weight_kg": 30.5
        })
        if res.status_code != 201:
            print(f"❌ Failed to add dog: {res.text}")
            return
        dog_id = res.json()["id"]
        print(f"✅ Success! Dog ID: {dog_id}\n")

        # 3. Add Medication
        print("🔹 3. Adding Medication")
        res = client.post(f"/dogs/{dog_id}/medications", headers=headers, json={
            "name": "Nexgard",
            "type": "Flea tick prevention",
            "frequency": "Monthly"
        })
        if res.status_code == 201:
            print(f"✅ Success! Medication ID: {res.json()['id']}\n")
        else:
            print(f"❌ Failed to add medication: {res.text}")

        # 4. Add Health Record
        print("🔹 4. Adding Health Record")
        res = client.post(f"/dogs/{dog_id}/health", headers=headers, json={
            "condition": "Minor scratch on paw",
            "severity": "low",
            "status": "ongoing"
        })
        if res.status_code == 201:
            print(f"✅ Success! Health Record ID: {res.json()['id']}\n")
        else:
            print(f"❌ Failed to add health record: {res.text}")

        # 5. Add Vaccine
        print("🔹 5. Adding Vaccine")
        res = client.post(f"/dogs/{dog_id}/vaccines", headers=headers, json={
            "name": "Rabies",
            "status": "current"
        })
        if res.status_code == 201:
            print(f"✅ Success! Vaccine ID: {res.json()['id']}\n")
        else:
            print(f"❌ Failed to add vaccine: {res.text}")

        # 6. Add Weight Log
        print("🔹 6. Adding Weight Log")
        res = client.post(f"/dogs/{dog_id}/weights", headers=headers, json={
            "weight_kg": 31.0,
            "recorded_at": str(date.today())
        })
        if res.status_code == 201:
            print(f"✅ Success! Weight Log ID: {res.json()['id']}\n")
        else:
            print(f"❌ Failed to add weight log: {res.text}")

        # 7. Add Activity Log
        print("🔹 7. Adding Activity Log")
        res = client.post(f"/dogs/{dog_id}/activities", headers=headers, json={
            "logged_date": str(date.today()),
            "walk_min": 45,
            "play_min": 20
        })
        if res.status_code == 201:
            print(f"✅ Success! Activity Log ID: {res.json()['id']}\n")
        else:
            print(f"❌ Failed to add activity log: {res.text}")

        # 8. Fetch Dashboard to verify data is combined
        print("🔹 8. Fetching Dashboard to verify aggregated data")
        res = client.get(f"/dogs/{dog_id}/dashboard", headers=headers)
        if res.status_code == 200:
            dash = res.json()
            print("✅ Success! Dashboard Data retrieved:")
            print(f"   Dog Name: {dash['dog_name']}")
            print(f"   Active Meds Count: {dash['active_meds_count']}")
            print(f"   Ongoing Health Count: {dash['ongoing_health_count']}")
        else:
            print(f"❌ Failed to fetch dashboard: {res.text}")

if __name__ == "__main__":
    run_tests()
