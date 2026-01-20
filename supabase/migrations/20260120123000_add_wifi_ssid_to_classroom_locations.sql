-- Add wifi_ssid column to classroom_locations table
alter table public.classroom_locations
add column wifi_ssid text;

-- Optional: Add a comment for documentation
comment on column public.classroom_locations.wifi_ssid is 'Authorized Wi-Fi SSID for this classroom location.';
