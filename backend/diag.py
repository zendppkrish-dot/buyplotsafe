import firebase_admin
from firebase_admin import credentials, firestore
import json
import os
import sys

def diag():
    print("--- DIAGNOSTIC START ---")
    print(f"Python: {sys.version}")
    print(f"CWD: {os.getcwd()}")
    
    # Check credentials.json
    if not os.path.exists("credentials.json"):
        print("ERROR: credentials.json NOT FOUND")
        return
    
    try:
        with open("credentials.json") as f:
            data = json.load(f)
            pid = data.get("project_id")
            print(f"Found project_id: {pid}")
    except Exception as e:
        print(f"ERROR reading credentials.json: {e}")
        return

    # Try standard init
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate("credentials.json")
            firebase_admin.initialize_app(cred)
        print("Firebase App initialized.")
        
        print("Testing firestore.client()...")
        db = firestore.client()
        docs = list(db.collection('plots').limit(1).get())
        print(f"Standard client success! Found {len(docs)} plots.")
    except Exception as e:
        print(f"Standard client FAILED: {e}")

    # Try (default) database init
    try:
        print("\nTesting firestore.client(database_id='(default)')...")
        db2 = firestore.client(database_id='(default)')
        docs2 = list(db2.collection('plots').limit(1).get())
        print(f"(default) client success! Found {len(docs2)} plots.")
    except Exception as e:
        print(f"(default) client FAILED: {e}")

    print("--- DIAGNOSTIC END ---")

if __name__ == "__main__":
    diag()
