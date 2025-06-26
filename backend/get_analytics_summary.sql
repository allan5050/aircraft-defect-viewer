-- =============================================================================
-- Supabase RPC Function for Analytics
-- =============================================================================
--
-- This function calculates analytics data directly in the database for
-- optimal performance, avoiding pulling thousands of records into client memory.
--
-- DB-level calculations are critical for performance and scalability,
-- especially with large datasets like the 10k defects in this project.
--

create or replace function get_analytics_summary()
returns json
language plpgsql
as $$
declare
  -- Define variables to hold our analytics results
  total_defects_count int;
  high_severity_defects_count int;
  recent_defects_count int;
  unique_aircraft_count int;
  severity_distribution_data json;
  top_aircraft_data json;
begin
  -- 1. Total Defects
  select count(*)
  into total_defects_count
  from public.defects;

  -- 2. High Severity Defects
  select count(*)
  into high_severity_defects_count
  from public.defects
  where severity = 'High';

  -- 3. Recent Defects (last 7 days)
  select count(*)
  into recent_defects_count
  from public.defects
  where reported_at >= now() - interval '7 days';

  -- 4. Total Unique Aircraft
  select count(distinct aircraft_registration)
  into unique_aircraft_count
  from public.defects;

  -- 5. Severity Distribution
  select json_object_agg(severity, count)
  into severity_distribution_data
  from (
    select severity, count(*) as count
    from public.defects
    group by severity
  ) as severity_counts;

  -- 6. Top 10 Aircraft by Defects
  select json_agg(top_aircraft)
  into top_aircraft_data
  from (
    select aircraft_registration as aircraft, count(*) as count
    from public.defects
    group by aircraft_registration
    order by count desc
    limit 10
  ) as top_aircraft;

  -- Assemble the final JSON response
  return json_build_object(
    'total_defects', total_defects_count,
    'high_severity_count', high_severity_defects_count,
    'recent_defects_7d', recent_defects_count,
    'total_unique_aircraft', unique_aircraft_count,
    'severity_distribution', coalesce(severity_distribution_data, '{}'::json),
    'top_aircraft', coalesce(top_aircraft_data, '[]'::json)
  );
end;
$$; 