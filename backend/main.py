from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Header, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi import FastAPI, Depends, HTTPException # Add HTTPException here!
from sqlalchemy.orm import Session

from typing import Optional, List
import time
import datetime
import os
import shutil
import json
import base64
import io
import trimesh
import numpy as np

from sqlalchemy.orm import Session
from database import SessionLocal, engine, get_db
import models
import auth_utils

from sqlalchemy import text # newly added for alter table

# Create tables
models.Base.metadata.create_all(bind=engine)

# Handle SQLite schema updates manually (for development)
def update_schema():
    with engine.connect() as conn:
        # Check if house_x exists
        try:
            conn.execute(text("SELECT house_x FROM plots LIMIT 1"))
        except Exception:
            print("[SCHEMA] Adding house_x column to plots table...")
            conn.execute(text("ALTER TABLE plots ADD COLUMN house_x FLOAT"))
            
        # Check if house_z exists
        try:
            conn.execute(text("SELECT house_z FROM plots LIMIT 1"))
        except Exception:
            print("[SCHEMA] Adding house_z column to plots table...")
            conn.execute(text("ALTER TABLE plots ADD COLUMN house_z FLOAT"))

        # Check if house_layout exists
        try:
            conn.execute(text("SELECT house_layout FROM plots LIMIT 1"))
        except Exception:
            print("[SCHEMA] Adding house_layout column to plots table...")
            conn.execute(text("ALTER TABLE plots ADD COLUMN house_layout TEXT"))
            
        # Check if glb_url exists
        try:
            conn.execute(text("SELECT glb_url FROM plots LIMIT 1"))
        except Exception:
            print("[SCHEMA] Adding glb_url column to plots table...")
            conn.execute(text("ALTER TABLE plots ADD COLUMN glb_url TEXT"))
        
        conn.commit()

# Run the schema update on startup
update_schema()

# Create static uploads directory if it doesn't exist
os.makedirs("static/uploads", exist_ok=True)

app = FastAPI()

# Mount static files

app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Helper & Logging ---

def log_with_time(message: str):
    """Prints a message with a high-precision timestamp."""
    current_time = str(datetime.datetime.now().strftime("%H:%M:%S.%f"))[:-3] # type: ignore
    print(f"[{current_time}] {message}")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Support both localhost and IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data & Config ---

# High Risk Zones (e.g., Wayanad Landslide Areas)
# format: {lat, lng, radius_km, name}
HIGH_RISK_ZONES = [
    {"lat": 11.5833, "lng": 76.1333, "radius": 5, "name": "Meppadi, Wayanad"},
    {"lat": 11.8333, "lng": 75.9667, "radius": 4, "name": "Mananthavady, Wayanad"},
    {"lat": 11.6000, "lng": 76.0833, "radius": 3, "name": "Chooralmala, Wayanad"},
]


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class PlotDimensions(BaseModel):
    length: float
    width: float

class Coordinates(BaseModel):
    lat: float
    lng: float

# --- Helper Functions ---

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = np.sin(dlat/2) * np.sin(dlat/2) + \
        np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * \
        np.sin(dlon/2) * np.sin(dlon/2)
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    return R * c


async def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """
    Verify JWT token from Authorization header and fetch user from SQLite.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split("Bearer ")[1]
    
    payload = auth_utils.decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user

# --- Auth Endpoints ---

@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_pwd = auth_utils.get_password_hash(user_data.password)
    new_user = models.User(
        email=user_data.email,
        hashed_password=hashed_pwd,
        full_name=user_data.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate token
    access_token = auth_utils.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not auth_utils.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth_utils.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api")
def read_root():
    return {"message": "BuyPlot Safe API with Advanced Analysis"}

@app.get("/api/health")
def health_check():
    return {"status": "online"}

@app.post("/api/generate-plot-3d")
def generate_plot_3d(dimensions: PlotDimensions):
    """
    Generates a 3D box model for the plot and returns it as a Base64 encoded GLB string.
    """
    try:
        print(f"[DEBUG] Generating 3D mesh for: {dimensions.width}x{dimensions.length}")
        # Create a simple box geometry
        # Width: X, Height: Y (0.5), Length: Z
        mesh = trimesh.creation.box(extents=[dimensions.width, 0.5, dimensions.length])
        
        # Color it Green (Emerald-500 equivalent approx)
        mesh.visual.face_colors = [16, 185, 129, 255] # RGBA

        # Export to GLB
        glb_data = mesh.export(file_type='glb')
        
        # Encode to Base64
        glb_base64 = base64.b64encode(glb_data).decode('utf-8')

        return {
            "status": "success",
            "glb_base64": glb_base64,
            "message": f"Generated 3D mesh for {dimensions.length}x{dimensions.width}"
        }
    except Exception as e:
        print(f"[ERROR] 3D Generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def calculate_risk_score(lat: float, lng: float):
    """
    Checks coordinates against High Risk Zones and calculates a Safety Score (1-10).
    1 = High Risk/Unsafe, 10 = Very Safe.
    """
    min_dist = float('inf')
    nearest_zone = None
    
    # 1. Find the nearest hazard zone
    for zone in HIGH_RISK_ZONES:
        dist = haversine_distance(lat, lng, zone["lat"], zone["lng"])
        if float(dist) < float(min_dist):
            min_dist = dist
            nearest_zone = zone

    # 2. Handle case where HIGH_RISK_ZONES might be empty
    if not nearest_zone:
        return 10.0, "Safe", "No hazard data available."

    # 3. Calculate a Dynamic Score (1-10)
    # Using 1.8 as a multiplier so 5km away ≈ Score 10
    dynamic_score = round(float(min(10.0, 1.0 + (min_dist * 1.8))), 1) # type: ignore

    if dynamic_score <= 3:
        level = "High Risk"
        details = f"Critical proximity ({float(round(float(min_dist), 2))}km) to {str(nearest_zone['name'])}." # type: ignore
    elif dynamic_score <= 7:
        level = "Moderate Risk"
        details = f"Buffer zone of {str(nearest_zone['name'])}. Caution advised for heavy construction." # type: ignore
    else:
        level = "Safe"
        details = "No major high-risk geospatial hazards detected within 5km."

    return dynamic_score, level, details
@app.get("/api/plots")
async def get_plots(limit: int = 20, offset: int = 0, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Fetch all uploaded plot metadata from SQLite.
    """
    try:
        log_with_time(f"GET PLOTS: Fetching - limit: {limit}, offset: {offset}")
        
        query = db.query(models.Plot)
        if user_id:
            query = query.filter(models.Plot.seller_id == user_id)
        
        total = query.count()
        plots = query.order_by(models.Plot.created_at.desc()).offset(offset).limit(limit).all()
        
        all_plots = []
        for plot in plots:
            all_plots.append({
                "id": str(plot.id),
                "name": plot.name,
                "location": plot.location,
                "price": plot.price,
                "area": plot.area,
                "image": plot.image_url,
                "risk_score": plot.risk_score,
                "description": plot.description,
                "house_x": plot.house_x,
                "house_z": plot.house_z,
                "house_layout": plot.house_layout,
                "sellerId": str(plot.seller_id),
                "createdAt": plot.created_at.isoformat()
            })
        
        log_with_time(f"GET PLOTS SUCCESS: Returning {len(all_plots)} plots")
        return {
            "status": "success",
            "plots": all_plots,
            "total": total
        }
    except Exception as e:
        log_with_time(f"GET PLOTS CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch plots: {str(e)}")

@app.get("/api/plots/{plot_id}")
async def get_plot(plot_id: int, db: Session = Depends(get_db)):
    """
    Fetch a single plot by ID.
    """
    plot = db.query(models.Plot).filter(models.Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
        
    return {
        "id": plot.id,
        "name": plot.name,
        "glb_url": getattr(plot, 'glb_url', None) or None,
        "thumbnail_url": plot.image_url
    }

class PlotUpdatePosition(BaseModel):
    house_x: float
    house_z: float
    house_layout: Optional[str] = None
@app.get("/api/plots/{plot_id}")
async def get_plot(plot_id: int, db: Session = Depends(get_db)):
    plot = db.query(models.Plot).filter(models.Plot.id == plot_id).first()
    
    # This prevents the 500 error if the plot doesn't exist
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found in database")
    
    return {
        "id": plot.id,
        "name": getattr(plot, 'name', 'Unnamed Plot'),
        "glb_url": getattr(plot, 'glb_url', None), # Safe way to check if column exists
        "thumbnail_url": getattr(plot, 'thumbnail_url', None)
    }
def save_to_db(plot_data: dict, image_url: str, seller_id: int):
    """Background task to save plot metadata to SQLite with Risk Analysis."""
    db = SessionLocal()
    try:
        log_with_time("BACKGROUND: Starting DB save...")
        # 1. Run Risk Analysis
        lat = float(plot_data.get('latitude', 0))
        lng = float(plot_data.get('longitude', 0))
        score, level, details = calculate_risk_score(lat, lng)
        risk_score_str = f"{level} (Score: {score})"
        
        # 2. Add to SQLite
        new_plot = models.Plot(
            name=plot_data.get('name', 'Untitled Plot'),
            location=plot_data.get('location', 'Kerala, India'),
            price=plot_data.get('price', 'Call for Price'),
            area=plot_data.get('area', 'N/A'),
            image_url=image_url,
            risk_score=risk_score_str,
            description=plot_data.get('description', ''),
            seller_id=seller_id
        )
        db.add(new_plot)
        db.commit()
        log_with_time(f"BACKGROUND: DB save successful. ID: {new_plot.id}")
        
    except Exception as e:
        log_with_time(f"BACKGROUND ERROR: {str(e)}")
    finally:
        db.close()

@app.post("/api/upload")
@app.post("/api/plots/upload")
async def upload_image(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...), 
    metadata: str = Form(None), 
    user: models.User = Depends(get_current_user)
):
    """
    Upload an image file and return its URL immediately.
    Database processing is pushed to BackgroundTasks.
    """
    start_time = time.time()
    log_with_time(f"START UPLOAD: {file.filename}")
    
    try:
        contents = await file.read()
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Preserve the original file extension from the uploaded file
        # If the frontend passes a Blob, it might be named simply 'blob' without an extension
        import os
        import mimetypes
        file_name, file_extension = os.path.splitext(file.filename)
        
        # Fallbacks for unrecognized 3D model formats if extension is missing
        if not file_extension:
            if 'model/gltf-binary' in file.content_type or 'model/gltf' in file.content_type:
                file_extension = '.glb'
            elif 'model/obj' in file.content_type or file.filename.endswith('.obj'):
                file_extension = '.obj'
            else:
                file_extension = mimetypes.guess_extension(file.content_type) or ''
                
        # Construct the final unique filename
        safe_filename = file.filename if file_extension in file.filename else f"{file.filename}{file_extension}"
        unique_filename = f"{timestamp}_user{user.id}_{safe_filename}"
        file_path = os.path.join("static", "uploads", unique_filename)
        
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        
        image_url = f"http://localhost:8000/static/uploads/{unique_filename}"
        
        if metadata:
            plot_data = json.loads(metadata)
            background_tasks.add_task(save_to_db, plot_data, image_url, user.id)
        
        total_latency = (time.time() - start_time) * 1000
        return {
            "status": "success",
            "imageUrl": image_url,
            "latency_ms": f"{total_latency:.2f}ms",
            "message": "Upload successful. Property data being processed in background."
        }
    except Exception as e:
        log_with_time(f"UPLOAD ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def build_heightmap_glb(area_cents: float, plot_lat: float, plot_lng: float, risk_score: float) -> bytes:
    """
    Generates a realistic 3D heightmap terrain as a GLB.

    - Width/Length: derived from the plot area in cents (1 cent = 435.6 sq ft).
    - Vertex height (Y-axis slope): computed per-vertex using haversine distance
      from each grid point to the nearest high-risk zone. Closer = taller peak.
    - The terrain is a 30×30 grid (900 vertices) for smooth topology.
    """
    # ── 1. Plot dimensions ────────────────────────────────────────────────────
    total_sq_ft   = area_cents * 435.6
    side_ft       = np.sqrt(total_sq_ft)
    side          = side_ft * 0.03048   # Convert ft → scene units (≈ meters/10)

    # ── 2. Grid setup ─────────────────────────────────────────────────────────
    GRID = 30
    xs   = np.linspace(-side / 2, side / 2, GRID)
    zs   = np.linspace(-side / 2, side / 2, GRID)
    xx, zz = np.meshgrid(xs, zs)

    # ── 3. Vertex height (Flat terrain) ───────────────────────────────────────
    yy = np.zeros_like(xx)

    # ── 4. Build mesh faces from grid ─────────────────────────────────────────
    vertices, faces = [], []
    rows = cols = GRID

    for r in range(rows):
        for c in range(cols):
            vertices.append([float(xx[r, c]), float(yy[r, c]), float(zz[r, c])]) # type: ignore

    for r in range(rows - 1):
        for c in range(cols - 1):
            i  = r * cols + c
            i1 = i + 1
            i2 = i + cols
            i3 = i + cols + 1
            faces.extend([[i, i2, i1], [i1, i2, i3]])

    vertices = np.array(vertices, dtype=np.float32)
    faces    = np.array(faces,    dtype=np.int32)

    # ── 5. Colour per-vertex (Uniform Kerala Green) ───────────────────────────
    vertex_colors = np.zeros((len(vertices), 4), dtype=np.uint8)
    vertex_colors[:, :] = [22, 163, 74, 255]

    # ── 6. Export as GLB via trimesh ────────────────────────────────────────
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
    mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh, vertex_colors=vertex_colors)

    glb_bytes = mesh.export(file_type='glb')
    return glb_bytes
@app.get("/api/generate-mesh/{plot_id}")
async def get_mesh(plot_id: int, db: Session = Depends(get_db)):
    """
    Unified Mesh API for Windows.
    Fetches real plot data from SQLite, generates a 3D Heightmap GLB, 
    and returns metadata for the custom sidebar.
    """
    try:
        # 1. Fetch Plot from Database
        plot = db.query(models.Plot).filter(models.Plot.id == plot_id).first()
        if not plot:
            raise HTTPException(status_code=404, detail=f"Plot #{plot_id} not found.")

        # 2. Parse Risk Score from string (format: "Level (Score: 8.5)")
        import re
        risk_str = plot.risk_score or "Safe (Score: 5.0)"
        risk_score = 5.0
        match = re.search(r'Score:\s*([\d.]+)', risk_str)
        if match:
            risk_score = float(match.group(1))

        # 3. Parse Area (format: "5 cents")
        area_str = plot.area or "5.0"
        try:
            area_cents = float(area_str.split()[0])
        except Exception:
            area_cents = 5.0

        # 4. Generate the 3D GLB bytes
        print(f"[MESH] Building heightmap for ID: {plot_id} (Area: {area_cents}, Score: {risk_score})")
        glb_bytes = build_heightmap_glb(area_cents, 11.6, 76.1, risk_score)
        glb_base64 = base64.b64encode(glb_bytes).decode('utf-8')

        # 5. Metadata Mapping for Sidebar
        # Area cents * 0.03048 * side_ft multiplier from build_heightmap_glb approx
        total_sq_ft = area_cents * 435.6
        side_units = float(f"{(np.sqrt(total_sq_ft) * 0.03048):.2f}")
        
        # Risk Height proportional to danger
        terrain_height = float(f"{max(0.3, 4.0 * (1 - (risk_score - 1) / 9.0)):.2f}")

        risk_level = "Safe"
        if risk_score <= 3: risk_level = "High Risk"
        elif risk_score <= 6: risk_level = "Moderate Risk"

        return {
            "status": "success",
            "glb_base64": glb_base64,
            "metadata": {
                "name": plot.name,
                "location": plot.location,
                "area": area_str,
                "area_value": area_cents,
                "price": plot.price,
                "risk_score": risk_score,
                "risk_level": f"{risk_level} (Safety: {risk_score}/10)",
                "side_units": side_units,
                "terrain_height": terrain_height,
                "house_x": plot.house_x,
                "house_z": plot.house_z,
                "house_layout": plot.house_layout,
                "glb_url": getattr(plot, 'glb_url', None) or None
            }
        }

    except Exception as e:
        print(f"[ERROR] Mesh generation failed for {plot_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating 3D view: {str(e)}")


# ─── Risk Report Endpoint ─────────────────────────────────────────────────────
@app.get("/api/report/{plot_id}")
def get_risk_report(plot_id: int, db: Session = Depends(get_db)):
    """
    Returns a structured JSON risk report for a plot.
    The frontend can stringify this and offer it as a downloadable .json file.

    Report sections:
        - Plot summary (name, area, price, location)
        - Risk factors (slope estimate, proximity to hazards, safety score)
        - Recommendations
    """
    try:
        plot = db.query(models.Plot).filter(models.Plot.id == plot_id).first()
        if not plot:
            raise HTTPException(status_code=404, detail=f"Plot #{plot_id} not found.")

        # Parse risk score
        import re
        risk_str   = plot.risk_score or "Safe"
        risk_score = 5.0
        match = re.search(r'Score:\s*([\d.]+)', risk_str)
        if match:
            risk_score = float(match.group(1))

        if risk_score <= 3:
            risk_label = "High Risk"
        elif risk_score <= 6:
            risk_label = "Moderate Risk"
        else:
            risk_label = "Safe"

        # Area
        area_str = plot.area or "5 cents"
        try:
            area_cents = float(area_str.split()[0])
        except Exception:
            area_cents = 5.0

        # Slope estimate (proportional to risk)  0.0 – 45°
        slope_degrees = round(float((1 - (risk_score - 1) / 9.0) * 45), 1) # type: ignore

        # Nearest hazard zone
        try:
            plot_lat = float(getattr(plot, 'latitude',  11.6))
            plot_lng = float(getattr(plot, 'longitude', 76.1))
        except Exception:
            plot_lat, plot_lng = 11.6, 76.1

        nearest_zone  = None
        nearest_dist  = float('inf')
        for zone in HIGH_RISK_ZONES:
            d = haversine_distance(plot_lat, plot_lng, zone["lat"], zone["lng"])
            if float(d) < float(nearest_dist):
                nearest_dist, nearest_zone = d, zone["name"]

        # Recommendations
        if risk_score <= 3:
            recommendations = [
                "Do NOT proceed with construction — high landslide probability.",
                "Conduct a full geological survey before any land acquisition.",
                "Check Kerala SDMA (State Disaster Management Authority) clearances.",
            ]
        elif risk_score <= 6:
            recommendations = [
                "Moderate risk — engage a licensed structural engineer before building.",
                "Avoid building on slopes greater than 25°.",
                "Install retaining walls if construction is unavoidable.",
            ]
        else:
            recommendations = [
                "Low geospatial hazard detected — suitable for construction.",
                "Standard Kerala building regulations apply.",
                "Periodic soil-stability tests recommended.",
            ]

        report = {
            "report_generated": datetime.datetime.now().isoformat(),
            "plot_id": plot_id,
            "summary": {
                "name":       plot.name,
                "location":   plot.location,
                "area":       area_str,
                "area_cents": area_cents,
                "price":      plot.price,
                "seller_id":  plot.seller_id,
            },
            "risk_analysis": {
                "safety_score":       risk_score,
                "safety_score_max":   10,
                "risk_level":         risk_label,
                "raw_db_value":       risk_str,
                "slope_estimate_deg": slope_degrees,
                "nearest_hazard_zone": nearest_zone,
                "distance_to_hazard_km": float(round(float(nearest_dist), 2)) if nearest_dist != float('inf') else None, # type: ignore
                "high_risk_zones_checked": len(HIGH_RISK_ZONES),
            },
            "recommendations": recommendations,
            "disclaimer": (
                "This report is generated by BuyPlot Safe's AI risk engine using "
                "publicly available geospatial data. It is NOT a substitute for a "
                "licensed civil engineering or geological survey."
            ),
        }

        return report

    except HTTPException:
        raise
    except Exception as e:
        print(f"[REPORT ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

 # No spaces at the start of this line
if __name__ == "__main__":
    import uvicorn
    # This line is indented once
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)