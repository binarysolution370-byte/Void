create extension if not exists pgcrypto;

create table if not exists secrets (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) <= 5000),
  created_at timestamptz default now(),
  is_delivered boolean default false,
  delivered_at timestamptz,
  receiver_session_id text,
  reply_count integer default 0,
  is_reply boolean default false,
  parent_secret_id uuid references secrets(id) on delete set null,
  deliver_after timestamptz,
  is_sealed boolean default false,
  seal_type text,
  paper_id text,
  ink_effect text
);

create index if not exists idx_secrets_undelivered
  on secrets (is_delivered, created_at)
  where is_delivered = false;

create index if not exists idx_secrets_session
  on secrets (receiver_session_id)
  where receiver_session_id is not null;

create table if not exists replies (
  id uuid primary key default gen_random_uuid(),
  secret_id uuid not null references secrets(id) on delete cascade,
  content text not null check (char_length(content) <= 200),
  created_at timestamptz default now(),
  is_delivered boolean default false,
  delivered_at timestamptz,
  receiver_session_id text
);

create index if not exists idx_replies_undelivered
  on replies (is_delivered, created_at)
  where is_delivered = false;

create table if not exists kept_secrets (
  id uuid primary key default gen_random_uuid(),
  secret_id uuid not null references secrets(id) on delete cascade,
  user_session_id text not null,
  kept_at timestamptz default now()
);

create or replace function pull_next_secret(p_session_id text)
returns setof secrets
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_id uuid;
begin
  select id
  into selected_id
  from secrets
  where is_delivered = false
    and is_reply = false
    and (deliver_after is null or deliver_after <= now())
  order by created_at asc
  limit 1
  for update skip locked;

  if selected_id is null then
    return;
  end if;

  return query
    update secrets
    set is_delivered = true,
        delivered_at = now(),
        receiver_session_id = p_session_id
    where id = selected_id
    returning *;
end;
$$;

create or replace function release_secret(p_secret_id uuid, p_session_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update secrets
  set is_delivered = false,
      delivered_at = null,
      receiver_session_id = null
  where id = p_secret_id
    and receiver_session_id = p_session_id;

  get diagnostics updated_count = row_count;
  return updated_count > 0;
end;
$$;

create or replace function create_reply(p_target_secret_id uuid, p_content text)
returns setof secrets
language plpgsql
security definer
set search_path = public
as $$
declare
  target_record secrets%rowtype;
  inserted_record secrets%rowtype;
begin
  select *
  into target_record
  from secrets
  where id = p_target_secret_id
  for update;

  if not found then
    return;
  end if;

  if target_record.is_reply = false and target_record.reply_count >= 1 then
    raise exception 'reply_limit_reached';
  end if;

  insert into secrets (content, is_reply, parent_secret_id)
  values (p_content, true, target_record.id)
  returning * into inserted_record;

  update secrets
  set reply_count = reply_count + 1
  where id = target_record.id;

  return query select inserted_record.*;
end;
$$;

alter table secrets enable row level security;
alter table replies enable row level security;
alter table kept_secrets enable row level security;

drop policy if exists "Insert secrets for anyone" on secrets;
create policy "Insert secrets for anyone"
  on secrets
  for insert
  with check (true);

drop policy if exists "Select secrets for anyone" on secrets;
create policy "Select secrets for anyone"
  on secrets
  for select
  using (true);

drop policy if exists "Update secrets for anyone" on secrets;
create policy "Update secrets for anyone"
  on secrets
  for update
  using (true)
  with check (true);

drop policy if exists "Insert replies for anyone" on replies;
create policy "Insert replies for anyone"
  on replies
  for insert
  with check (true);

drop policy if exists "Select replies for anyone" on replies;
create policy "Select replies for anyone"
  on replies
  for select
  using (true);

drop policy if exists "Update replies for anyone" on replies;
create policy "Update replies for anyone"
  on replies
  for update
  using (true)
  with check (true);

drop policy if exists "All kept secrets for anyone" on kept_secrets;
create policy "All kept secrets for anyone"
  on kept_secrets
  for all
  using (true)
  with check (true);

grant execute on function pull_next_secret(text) to anon, authenticated, service_role;
grant execute on function release_secret(uuid, text) to anon, authenticated, service_role;
grant execute on function create_reply(uuid, text) to anon, authenticated, service_role;

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  feature_type text not null,
  offer_id text not null,
  payment_provider text not null default 'stripe',
  external_payment_id text,
  feature_id uuid,
  amount decimal not null,
  currency text default 'EUR',
  stripe_payment_intent_id text,
  status text not null default 'succeeded',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  expires_at timestamptz
);

alter table purchases add column if not exists payment_provider text not null default 'stripe';
alter table purchases add column if not exists external_payment_id text;

create unique index if not exists idx_purchases_payment_intent
  on purchases(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create unique index if not exists idx_purchases_provider_external
  on purchases(payment_provider, external_payment_id)
  where external_payment_id is not null;

create index if not exists idx_purchases_session_created
  on purchases(session_id, created_at desc);

create table if not exists unlocked_papers (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  paper_id text not null,
  purchase_id uuid references purchases(id) on delete set null,
  unlocked_at timestamptz default now()
);

create unique index if not exists idx_unlocked_papers_unique
  on unlocked_papers(session_id, paper_id);

create table if not exists time_capsules (
  id uuid primary key default gen_random_uuid(),
  secret_id uuid not null references secrets(id) on delete cascade,
  session_id text not null,
  deliver_at timestamptz not null,
  is_delivered boolean default false,
  purchase_id uuid references purchases(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists eternal_secrets (
  id uuid primary key default gen_random_uuid(),
  secret_id uuid not null references secrets(id) on delete cascade,
  patron_session_id text not null,
  purchase_id uuid references purchases(id) on delete set null,
  preserved_at timestamptz default now()
);

create unique index if not exists idx_eternal_secrets_unique
  on eternal_secrets(secret_id);

create table if not exists long_letter_entitlements (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  max_chars integer not null check (max_chars in (1000, 5000, 50000)),
  purchase_id uuid references purchases(id) on delete set null,
  granted_at timestamptz default now(),
  expires_at timestamptz
);

create table if not exists seal_entitlements (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  seal_type text not null,
  remaining_uses integer not null default 1,
  purchase_id uuid references purchases(id) on delete set null,
  granted_at timestamptz default now(),
  expires_at timestamptz
);

create table if not exists ink_entitlements (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  ink_effect text not null,
  purchase_id uuid references purchases(id) on delete set null,
  granted_at timestamptz default now()
);

create unique index if not exists idx_ink_entitlements_unique
  on ink_entitlements(session_id, ink_effect);

create table if not exists gifted_voids (
  id uuid primary key default gen_random_uuid(),
  giver_session_id text not null,
  gift_token text unique not null,
  recipient_session_id text,
  purchase_id uuid references purchases(id) on delete set null,
  max_chars integer not null default 1000,
  seals_quota integer not null default 3,
  starts_at timestamptz default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists sanctuary_access (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  tier text not null check (tier in ('monthly', 'yearly', 'lifetime')),
  purchase_id uuid references purchases(id) on delete set null,
  granted_at timestamptz default now(),
  expires_at timestamptz
);

create unique index if not exists idx_sanctuary_access_unique
  on sanctuary_access(session_id, tier, coalesce(expires_at, '9999-12-31'::timestamptz));

alter table purchases enable row level security;
alter table unlocked_papers enable row level security;
alter table time_capsules enable row level security;
alter table eternal_secrets enable row level security;
alter table long_letter_entitlements enable row level security;
alter table seal_entitlements enable row level security;
alter table ink_entitlements enable row level security;
alter table gifted_voids enable row level security;
alter table sanctuary_access enable row level security;

drop policy if exists "All purchases for anyone" on purchases;
create policy "All purchases for anyone"
  on purchases for all using (true) with check (true);

drop policy if exists "All unlocked papers for anyone" on unlocked_papers;
create policy "All unlocked papers for anyone"
  on unlocked_papers for all using (true) with check (true);

drop policy if exists "All time capsules for anyone" on time_capsules;
create policy "All time capsules for anyone"
  on time_capsules for all using (true) with check (true);

drop policy if exists "All eternal secrets for anyone" on eternal_secrets;
create policy "All eternal secrets for anyone"
  on eternal_secrets for all using (true) with check (true);

drop policy if exists "All long letters for anyone" on long_letter_entitlements;
create policy "All long letters for anyone"
  on long_letter_entitlements for all using (true) with check (true);

drop policy if exists "All seal entitlements for anyone" on seal_entitlements;
create policy "All seal entitlements for anyone"
  on seal_entitlements for all using (true) with check (true);

drop policy if exists "All ink entitlements for anyone" on ink_entitlements;
create policy "All ink entitlements for anyone"
  on ink_entitlements for all using (true) with check (true);

drop policy if exists "All gifted voids for anyone" on gifted_voids;
create policy "All gifted voids for anyone"
  on gifted_voids for all using (true) with check (true);

drop policy if exists "All sanctuary access for anyone" on sanctuary_access;
create policy "All sanctuary access for anyone"
  on sanctuary_access for all using (true) with check (true);

create or replace view kpi_monetization as
select
  date_trunc('day', created_at) as day,
  feature_type,
  count(*) as purchases_count,
  sum(amount) as revenue,
  count(distinct session_id) as unique_buyers
from purchases
group by 1, 2;

-- L'Echo v1.3
alter table secrets
  add column if not exists author_session_id text;

create index if not exists idx_secrets_author_session
  on secrets(author_session_id)
  where author_session_id is not null;

alter table replies
  add column if not exists author_session_id text,
  add column if not exists deleted_at timestamptz;

alter table replies
  drop constraint if exists replies_content_check;

alter table replies
  add constraint replies_content_check check (char_length(content) <= 300);

create unique index if not exists idx_replies_secret_author_unique
  on replies(secret_id, author_session_id)
  where deleted_at is null and author_session_id is not null;

create index if not exists idx_replies_secret_created
  on replies(secret_id, created_at);

create table if not exists notification_tokens (
  id uuid primary key default gen_random_uuid(),
  secret_id uuid not null references secrets(id) on delete cascade,
  push_token text,
  created_at timestamptz default now(),
  notified_at timestamptz,
  unique(secret_id)
);

alter table notification_tokens enable row level security;

drop policy if exists "All notification tokens for anyone" on notification_tokens;
create policy "All notification tokens for anyone"
  on notification_tokens for all using (true) with check (true);

-- Purge periodique des reponses retirees (L'Echo)
create extension if not exists pg_cron;

create or replace function cleanup_soft_deleted_replies()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
begin
  delete from replies
  where deleted_at is not null
    and deleted_at <= now() - interval '60 seconds';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant execute on function cleanup_soft_deleted_replies() to anon, authenticated, service_role;

do $$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'void_cleanup_soft_deleted_replies'
  ) then
    perform cron.schedule(
      'void_cleanup_soft_deleted_replies',
      '*/2 * * * *',
      $job$select cleanup_soft_deleted_replies();$job$
    );
  end if;
end
$$;

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
