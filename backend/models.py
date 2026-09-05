from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    
    plots = relationship("Plot", back_populates="seller")

class Plot(Base):
    __tablename__ = "plots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    location = Column(String)
    price = Column(String)
    area = Column(String)
    image_url = Column(String)
    risk_score = Column(String)
    description = Column(Text)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    seller_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    house_x = Column(Float, nullable=True)
    house_z = Column(Float, nullable=True)
    house_layout = Column(Text, nullable=True) # JSON array of active components
    glb_url = Column(String, nullable=True)
    risk_override_score = Column(Float, nullable=True)
    risk_override_level = Column(String, nullable=True)

    seller = relationship("User", back_populates="plots")
