# seed_data.py
import json
import random
import string
from datetime import datetime, timedelta, timezone
from typing import List, Dict
from pathlib import Path
from collections import Counter

def generate_aircraft_registration() -> str:
    """Generate realistic aircraft registration."""
    # Common country prefixes
    prefixes = ['N', 'G-', 'D-', 'F-', 'VH-', 'C-', 'JA', 'B-', 'OH-', 'SE-']
    prefix = random.choice(prefixes)
    
    # Generate suffix
    if prefix in ['N']:
        suffix = ''.join(random.choices(string.digits, k=4)) + random.choice(string.ascii_uppercase)
    elif prefix == 'JA':
        suffix = ''.join(random.choices(string.digits, k=4))
    else:
        suffix = ''.join(random.choices(string.ascii_uppercase, k=3))
    
    return f"{prefix}{suffix}"

def generate_defects(count: int = 10000) -> List[Dict]:
    """
    Generates a specified number of realistic-looking aircraft defect records.

    Args:
        count: The number of defect records to generate.

    Returns:
        A list of dictionaries, where each dictionary is a defect record.
    """
    
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
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=730)
    
    for _ in range(count):
        # Generate a random timestamp within the last two years
        time_between_dates = end_date - start_date
        random_seconds = random.randrange(int(time_between_dates.total_seconds()))
        timestamp = start_date + timedelta(seconds=random_seconds)
        
        # Select defect type and description
        defect_type = random.choice(list(defect_types.keys()))
        description = random.choice(defect_types[defect_type])
        
        # Create a unique ID for the defect
        defect_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))

        # Create defect record
        defect = {
            "id": defect_id,
            "aircraft_registration": random.choice(aircraft_fleet),
            "reported_at": timestamp.isoformat(),
            "defect_type": defect_type,
            "description": description,
            "severity": random.choices(severities, weights=severity_weights)[0]
        }
        
        defects.append(defect)
    
    # Sort by date to simulate a realistic sequence of reports
    defects.sort(key=lambda x: x['reported_at'])
    
    return defects

def main():
    """Generates and saves a dataset of defect records."""
    print("Generating 10,000 defect records...")
    defects_data = generate_defects(10000)
    
    # Define the output path using pathlib for cross-platform compatibility
    output_path = Path(__file__).parent.parent / "data" / "large_aircraft_defects.json"
    output_path.parent.mkdir(exist_ok=True) # Ensure the 'data' directory exists

    # Save to file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(defects_data, f, indent=2)
    
    print(f"Successfully generated {len(defects_data)} defect records.")
    if defects_data:
        print(f"Date range: {defects_data[0]['reported_at']} to {defects_data[-1]['reported_at']}")
    
    # Calculate and print statistics using collections.Counter for conciseness
    severity_counts = Counter(d['severity'] for d in defects_data)
    aircraft_counts = Counter(d['aircraft_registration'] for d in defects_data)

    print("\nSeverity distribution:")
    for severity, count in severity_counts.items():
        print(f"  {severity}: {count} ({count/len(defects_data)*100:.1f}%)")
    
    print(f"\nTotal unique aircraft in fleet: {len(aircraft_counts)}")
    if aircraft_counts:
        print(f"Average defects per aircraft: {len(defects_data) / len(aircraft_counts):.1f}")

if __name__ == "__main__":
    main()