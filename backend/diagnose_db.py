import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import firestore_v1
from google.api_core import exceptions
import os

try:
    cred_path = "buyplot-safe-firebase-adminsdk-fbsvc-5b15c45b27.json"
    cred = credentials.Certificate(cred_path)
    # Don't initialize app if already done, but in scratch script it's fine
    firebase_admin.initialize_app(cred, {'projectId': 'buyplot-safe'})
    
    # Use the underlying google-cloud-firestore to list databases
    from google.cloud.firestore_admin_v1 import FirestoreAdminClient
    client = FirestoreAdminClient(credentials=cred.get_credential())
    
    project_path = f"projects/buyplot-safe"
    print(f"Listing databases for {project_path}...")
    
    # Note: listing databases might require extra permissions
    databases = client.list_databases(parent=project_path)
    for db in databases:
        print(f"Database found: {db.name}")
        print(f"  Type: {db.type_}")
        print(f"  Location: {db.location_id}")
        print(f"  State: {db.state}")

except Exception as e:
    print(f"ERROR during diagnostics: {str(e)}")
    import traceback
    traceback.print_exc()
