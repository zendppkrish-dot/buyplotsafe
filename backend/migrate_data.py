import firebase_admin
from firebase_admin import credentials, firestore
import models
from database import SessionLocal, engine
from sqlalchemy.orm import Session
import os
import json
from datetime import datetime

# Initialize database
models.Base.metadata.create_all(bind=engine)

def migrate():
    # 1. Initialize Firebase (This assumes credentials.json exists)
    if not os.path.exists("credentials.json"):
        print("Error: credentials.json not found. Place it in the backend folder to migrate from Firestore.")
        return

    try:
        cred = credentials.Certificate("credentials.json")
        firebase_admin.initialize_app(cred)
        db_firestore = firestore.client()
        print("Connected to Firestore successfully.")
    except Exception as e:
        print(f"Failed to connect to Firestore: {e}")
        print("Skipping Firestore migration. Checking for local backup...")
        db_firestore = None

    db_sqlite = SessionLocal()

    try:
        if db_firestore:
            print("Fetching plots from Firestore...")
            plots_ref = db_firestore.collection('plots')
            docs = plots_ref.stream()

            count = 0
            for doc in docs:
                data = doc.to_dict()
                
                # Basic mapping (adjust fields as needed)
                new_plot = models.Plot(
                    name=data.get('name', 'Untitled Plot'),
                    location=data.get('location', 'Unknown'),
                    price=data.get('price', 'N/A'),
                    area=data.get('area', 'N/A'),
                    image_url=data.get('image', ''),
                    risk_score=data.get('risk_score', 'Unknown'),
                    description=data.get('description', ''),
                    # Default to seller_id 1 or handle appropriately
                    seller_id=1 
                )
                db_sqlite.add(new_plot)
                count += 1
            
            db_sqlite.commit()
            print(f"Successfully migrated {count} plots from Firestore.")
        else:
            # Check for dummy data or backup
            print("No active Firestore connection found.")
            print("If you have a JSON export of your plots, name it 'plots_backup.json' in this folder.")
            if os.path.exists("plots_backup.json"):
                with open("plots_backup.json", "r") as f:
                    backup_data = json.load(f)
                    count = 0
                    for item in backup_data:
                        new_plot = models.Plot(
                            name=item.get('name'),
                            location=item.get('location'),
                            price=item.get('price'),
                            area=item.get('area'),
                            image_url=item.get('image'),
                            risk_score=item.get('risk_score'),
                            description=item.get('description'),
                            seller_id=1
                        )
                        db_sqlite.add(new_plot)
                        count += 1
                    db_sqlite.commit()
                    print(f"Imported {count} plots from plots_backup.json.")

    except Exception as e:
        print(f"Migration error: {e}")
        db_sqlite.rollback()
    finally:
        db_sqlite.close()

if __name__ == "__main__":
    migrate()
