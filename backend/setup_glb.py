import os
from database import SessionLocal
import models
from sqlalchemy import text
from database import engine

# Ensure directory exists
os.makedirs("static/uploads", exist_ok=True)
print("Verified static/uploads directory exists.")

# Ensure schema has glb_url just in case the app hasn't restarted yet
with engine.connect() as conn:
    try:
        conn.execute(text("SELECT glb_url FROM plots LIMIT 1"))
    except Exception:
        print("[SCHEMA] Adding glb_url column to plots table...")
        conn.execute(text("ALTER TABLE plots ADD COLUMN glb_url TEXT"))
        conn.commit()

db = SessionLocal()

plot = db.query(models.Plot).filter(models.Plot.id == 1).first()
if plot:
    plot.glb_url = "http://localhost:8000/static/uploads/plot_1.glb"
    db.commit()
    print(f"Updated plot #{plot.id} — {plot.name} with GLB URL")
else:
    print("Plot #1 not found. Make sure you have at least one plot uploaded.")

db.close()

# Verification check
db2 = SessionLocal()
check = db2.query(models.Plot).filter(models.Plot.id == 1).first()
if check:
    print(f"Verified glb_url = {check.glb_url}")
db2.close()
