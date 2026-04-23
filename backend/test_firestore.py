import firebase_admin
from firebase_admin import credentials, firestore
import os

try:
    # Use the same path as main.py
    cred_path = "buyplot-safe-firebase-adminsdk-fbsvc-5b15c45b27.json"
    if not os.path.exists(cred_path):
        print(f"ERROR: Service account file not found at {cred_path}")
        exit(1)

    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    print("Attempting to list collections...")
    collections = db.collections()
    col_names = [c.id for c in collections]
    print(f"Successfully connected! Existing collections: {col_names}")

    # Try a test write
    print("Attempting a test write to 'connection_test'...")
    doc_ref = db.collection('connection_test').document('status')
    doc_ref.set({'connected': True, 'timestamp': firestore.SERVER_TIMESTAMP})
    print("Test write successful!")

except Exception as e:
    print(f"CRITICAL ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
