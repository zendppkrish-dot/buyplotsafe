import sys
import os

# Add backend to path to import main
sys.path.append(os.path.abspath("backend"))

from main import calculate_risk_score

def test_risk():
    print("Testing Risk Calculation Logic...")
    
    # High Risk Zone: Meppadi (11.5833, 76.1333)
    score, level, details = calculate_risk_score(11.5833, 76.1333)
    print(f"Meppadi (High Risk): Score={score}, Level={level}, Details={details}")
    assert level == "High Risk"
    
    # Safe Zone: Kochi (9.9312, 76.2673)
    score, level, details = calculate_risk_score(9.9312, 76.2673)
    print(f"Kochi (Safe): Score={score}, Level={level}, Details={details}")
    assert level == "Safe"
    
    # Moderate Risk (deterministic heuristic)
    # (lat + lng) % 0.1 < 0.02
    # e.g., lat=10.0, lng=76.01 -> 86.01 % 0.1 = 0.01
    score, level, details = calculate_risk_score(10.0, 76.01)
    print(f"Moderate Risk Test: Score={score}, Level={level}, Details={details}")
    assert level == "Moderate Risk"

    print("\nAll risk tests passed!")

if __name__ == "__main__":
    try:
        test_risk()
    except Exception as e:
        print(f"Test failed: {e}")
