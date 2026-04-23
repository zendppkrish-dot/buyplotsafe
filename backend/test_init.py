import firebase_admin
from firebase_admin import credentials, firestore
import json
import logging

# Setup logging to file
logging.basicConfig(filename='test_init_results.log', level=logging.INFO, force=True)

def log(msg):
    print(msg)
    logging.info(msg)

with open("credentials.json") as f:
    service_account_info = json.load(f)

if not firebase_admin._apps:
    cred = credentials.Certificate("credentials.json")
    firebase_admin.initialize_app(cred)

log("Attempting firestore.client()...")
try:
    db = firestore.client()
    log("Success! Client created. Testing query...")
    docs = list(db.collection('plots').limit(1).get())
    log(f"Query success! Found {len(docs)} docs.")
except Exception as e:
    log(f"Failed with firestore.client(): {str(e)}")

log("\nAttempting firestore.client(database_id='(default)')...")
try:
    db2 = firestore.client(database_id='(default)')
    log("Success! Client created. Testing query...")
    docs2 = list(db2.collection('plots').limit(1).get())
    log(f"Query success! Found {len(docs2)} docs.")
except Exception as e:
    log(f"Failed with firestore.client(database_id='(default)'): {str(e)}")
