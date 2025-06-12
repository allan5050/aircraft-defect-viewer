# seed_data.py
import json
import random
import string
from datetime import datetime, timedelta
from typing import List, Dict

def generate_aircraft_registration() -> str:
    """Generate realistic aircraft registration."""
    # Common country prefixes
    prefixes = ['N', 'G-', 'D-', 'F-', 'VH-', 'C-', 'JA', 'B-', 'OH-', 'SE-']
    prefix = random.choice(prefixes)
    
    # Generate suffix
    if prefix in ['N', 'JA']:  # US and Japan use numbers
        suffix = ''.join(random.choices(string.digits, k=4)) + random.choice(string.ascii_uppercase)
    else:  # Others use letters
        suffix = ''.join(random.choices(string.ascii_uppercase, k=3))
    
    return prefix + suffix

def generate_defects(count: int = 10000) -> List[Dict]:
    """Generate realistic defect data."""
    
    # Define defect types and their descriptions
    defect_types = {
        "Hydraulic leak": [
            "Leak in hydraulic system affecting actuator performance.",
            "Minor hydraulic fluid seepage detected near landing gear.",
            "Hydraulic line showing signs of wear and minor leakage.",
            "Seal failure in hydraulic pump causing fluid loss."
        ],
        "Fan blade damage": [
            "Fan blade chipped due to foreign object ingestion.",
            "Minor nick on fan blade edge detected during inspection.",
            "Fan blade showing stress cracks at root.",
            "Surface erosion on multiple fan blades."
        ],
        "Oil pressure anomaly": [
            "Oil pressure readings outside normal range.",
            "Intermittent oil pressure fluctuations during cruise.",
            "Low oil pressure warning during engine start.",
            "Oil pressure sensor giving erratic readings."
        ],
        "Vibration anomaly": [
            "Unusual vibration detected in engine nacelle.",
            "Excessive vibration during takeoff phase.",
            "Vibration levels exceeding normal parameters.",
            "Intermittent vibration in engine #2."
        ],
        "Fuel pump failure": [
            "Fuel pump malfunction causing inconsistent fuel delivery.",
            "Primary fuel pump showing signs of wear.",
            "Backup fuel pump failed during ground test.",
            "Fuel pump pressure below specifications."
        ],
        "Ignition system fault": [
            "Ignition system failed to initiate combustion.",
            "Intermittent ignition problems during cold start.",
            "Ignitor plug showing excessive wear.",
            "Ignition exciter box malfunction."
        ],
        "Compressor stall": [
            "Compressor stall detected during climb phase.",
            "Multiple compressor stalls during acceleration.",
            "Mild compressor surge at high altitude.",
            "Compressor instability during rapid throttle changes."
        ],
        "Exhaust gas temperature spike": [
            "Unexpected spike in exhaust gas temperature.",
            "EGT exceeding limits during takeoff.",
            "Abnormal EGT pattern during cruise.",
            "EGT margin deterioration noted."
        ],
        "Thrust reverser issue": [
            "Thrust reverser failed to deploy on landing.",
            "Thrust reverser actuator malfunction.",
            "Asymmetric thrust reverser deployment.",
            "Thrust reverser indication fault."
        ],
        "Bleed air leak": [
            "Bleed air leak detected in pneumatic system.",
            "Excessive bleed air temperature.",
            "Bleed valve stuck in open position.",
            "Bleed air duct showing signs of damage."
        ]
    }
    
    # Generate fleet of aircraft (more realistic than random for each defect)
    fleet_size = 150
    aircraft_fleet = [generate_aircraft_registration() for _ in range(fleet_size)]
    
    # Severity weights (High severity should be less common)
    severities = ["Low", "Medium", "High"]
    severity_weights = [0.5, 0.35, 0.15]
    
    defects = []
    
    # Generate defects over the past 2 years
    end_date = datetime.now()
    start_date = end_date - timedelta(days=730)
    
    for i in range(count):
        # Random timestamp within date range
        time_between_dates = end_date - start_date
        days_between_dates = time_between_dates.days
        random_number_of_days = random.randrange(days_between_dates)
        random_date = start_date + timedelta(days=random_number_of_days)
        
        # Add random time of day
        random_hour = random.randint(0, 23)
        random_minute = random.randint(0, 59)
        random_second = random.randint(0, 59)
        timestamp = random_date.replace(
            hour=random_hour, 
            minute=random_minute, 
            second=random_second
        )
        
        # Select defect type and description
        defect_type = random.choice(list(defect_types.keys()))
        description = random.choice(defect_types[defect_type])
        
        # Create defect record
        defect = {
            "id": ''.join(random.choices(string.ascii_lowercase + string.digits, k=8)),
            "aircraft_registration": random.choice(aircraft_fleet),
            "reported_at": timestamp.isoformat() + "Z",
            "defect_type": defect_type,
            "description": description,
            "severity": random.choices(severities, weights=severity_weights)[0]
        }
        
        defects.append(defect)
    
    # Sort by date (more realistic)
    defects.sort(key=lambda x: x['reported_at'])
    
    return defects

def main():
    """Generate and save defect data."""
    print("Generating 10,000 defect records...")
    defects = generate_defects(10000)
    
    # Save to file
    with open('../data/large_aircraft_defects.json', 'w') as f:
        json.dump(defects, f, indent=2)
    
    print(f"Generated {len(defects)} defect records")
    print(f"Date range: {defects[0]['reported_at']} to {defects[-1]['reported_at']}")
    
    # Print statistics
    severity_counts = {}
    aircraft_counts = {}
    
    for defect in defects:
        # Count severities
        severity = defect['severity']
        severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        # Count per aircraft
        aircraft = defect['aircraft_registration']
        aircraft_counts[aircraft] = aircraft_counts.get(aircraft, 0) + 1
    
    print("\nSeverity distribution:")
    for severity, count in severity_counts.items():
        print(f"  {severity}: {count} ({count/len(defects)*100:.1f}%)")
    
    print(f"\nTotal aircraft in fleet: {len(aircraft_counts)}")
    print(f"Average defects per aircraft: {len(defects) / len(aircraft_counts):.1f}")

if __name__ == "__main__":
    main()