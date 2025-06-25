-- Create the main table for storing defect reports.
CREATE TABLE defects (
    id TEXT PRIMARY KEY,
    aircraft_registration TEXT NOT NULL,
    reported_at TIMESTAMPTZ NOT NULL,
    defect_type TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL
);

-- Create indexes on commonly filtered and sorted columns.
-- This is a critical performance optimization for a large dataset.
-- An index is a sorted copy of a column (like a book's index),
-- allowing the database to find rows in O(log n) time instead of
-- scanning the entire table (O(n) time).

-- TIME COMPLEXITY:
-- Without index: WHERE aircraft_registration (and severity) = ... is O(n)
-- With index: it is O(log n) because the index is sorted, enabling a fast binary search.
-- Without index: ORDER BY reported_at DESC is O(n log n)
-- With index: finding rows in reported_at DESC order is O(log n) because the index is already sorted.
CREATE INDEX idx_aircraft_registration ON defects(aircraft_registration);
CREATE INDEX idx_severity ON defects(severity);
CREATE INDEX idx_reported_at_desc ON defects(reported_at DESC);

-- Create a view to get a distinct list of aircraft registrations.
-- This is far more efficient for populating the filter dropdown in the UI
-- than querying the entire 'defects' table and finding distinct values.
-- NOTE: While creating the view is efficient, the underlying DISTINCT operation
-- on an unindexed column still requires a full table scan (O(n)). For very large,
-- dynamic datasets, a separate, smaller 'aircraft' table would be even faster.
CREATE OR REPLACE VIEW distinct_aircraft AS
SELECT DISTINCT aircraft_registration
FROM defects
ORDER BY aircraft_registration; 