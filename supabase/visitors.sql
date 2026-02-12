create table if not exists site_visits (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  visit_count integer not null default 1,
  user_agent text,
  referrer text
);

create index if not exists idx_site_visits_last_seen on site_visits(last_seen_at desc);
create index if not exists idx_site_visits_first_seen on site_visits(first_seen_at desc);

alter table site_visits enable row level security;

drop policy if exists "All site visits for anyone" on site_visits;
create policy "All site visits for anyone"
  on site_visits for all using (true) with check (true);

create or replace view kpi_visitors as
select
  date_trunc('day', first_seen_at) as day,
  count(*) as unique_visitors,
  sum(visit_count) as visits
from site_visits
group by 1
order by 1 desc;
