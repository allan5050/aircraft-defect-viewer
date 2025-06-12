-- Create the main table for storing defect reports.
CREATE TABLE defects (
    id TEXT PRIMARY KEY,
    aircraft_registration TEXT NOT NULL,
    reported_at TIMESTAMPTZ NOT NULL,
    defect_type TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL
);

-- Create indexes for faster filtering and sorting.
CREATE INDEX idx_aircraft_registration ON defects(aircraft_registration);
CREATE INDEX idx_severity ON defects(severity);
CREATE INDEX idx_reported_at_desc ON defects(reported_at DESC);

-- Create a view to get a distinct list of aircraft registrations.
-- This is more efficient for populating the filter dropdown.
CREATE OR REPLACE VIEW distinct_aircraft AS
SELECT DISTINCT aircraft_registration
FROM defects
ORDER BY aircraft_registration; 