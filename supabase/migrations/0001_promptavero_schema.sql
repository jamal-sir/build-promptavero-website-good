-- PromptAvero schema: admin authorization, content tables, RLS, search, storage.

-- ───────────────────────── Admin authorization ─────────────────────────
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke insert, update, delete on public.admin_users from anon, authenticated;
create policy admin_users_select_self on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- First administrator can only be created once, atomically, by the service role.
create or replace function public.bootstrap_admin(p_user_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(7243001);
  if exists (select 1 from public.admin_users) then
    return false;
  end if;
  insert into public.admin_users (user_id) values (p_user_id);
  return true;
end;
$$;
revoke all on function public.bootstrap_admin(uuid) from public, anon, authenticated;
grant execute on function public.bootstrap_admin(uuid) to service_role;

-- ───────────────────────── Categories ─────────────────────────
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  description text not null default '' check (char_length(description) <= 1000),
  seo_title text check (seo_title is null or char_length(seo_title) <= 120),
  seo_description text check (seo_description is null or char_length(seo_description) <= 320),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists categories_name_lower_key on public.categories (lower(name));
create index if not exists categories_sort_idx on public.categories (sort_order, name);

-- ───────────────────────── Prompts ─────────────────────────
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  prompt_text text not null check (char_length(btrim(prompt_text)) >= 10 and char_length(prompt_text) <= 8000),
  excerpt text not null default '' check (char_length(excerpt) <= 400),
  category_id uuid not null references public.categories(id) on delete restrict,
  featured_image_url text check (featured_image_url is null or featured_image_url ~ '^https?://'),
  featured_image_alt text check (featured_image_alt is null or char_length(featured_image_alt) <= 300),
  image_width integer check (image_width is null or image_width > 0),
  image_height integer check (image_height is null or image_height > 0),
  tags text[] not null default '{}' check (cardinality(tags) <= 15),
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  seo_title text check (seo_title is null or char_length(seo_title) <= 120),
  seo_description text check (seo_description is null or char_length(seo_description) <= 320),
  canonical_url text check (canonical_url is null or canonical_url ~ '^https?://'),
  author_id uuid references auth.users(id) on delete set null,
  search_vector tsvector,
  constraint prompts_published_requires_date check (status <> 'published' or published_at is not null),
  constraint prompts_image_requires_alt check (
    featured_image_url is null or coalesce(btrim(featured_image_alt), '') <> ''
  )
);
create index if not exists prompts_published_idx on public.prompts (published_at desc) where status = 'published';
create index if not exists prompts_category_idx on public.prompts (category_id);
create index if not exists prompts_featured_idx on public.prompts (published_at desc) where featured and status = 'published';
create index if not exists prompts_tags_idx on public.prompts using gin (tags);
create index if not exists prompts_search_idx on public.prompts using gin (search_vector);
create index if not exists prompts_updated_idx on public.prompts (updated_at desc);

-- ───────────────────────── Slug redirects ─────────────────────────
create table if not exists public.slug_redirects (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('prompt', 'category')),
  old_slug text not null,
  prompt_id uuid references public.prompts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (kind, old_slug),
  check (
    (kind = 'prompt' and prompt_id is not null and category_id is null)
    or (kind = 'category' and category_id is not null and prompt_id is null)
  )
);
create index if not exists slug_redirects_prompt_idx on public.slug_redirects (prompt_id);
create index if not exists slug_redirects_category_idx on public.slug_redirects (category_id);

-- ───────────────────────── Site settings (single row) ─────────────────────────
create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  site_name text not null default 'PromptAvero' check (char_length(btrim(site_name)) between 1 and 60),
  tagline text not null default 'Curated AI image-generation prompts' check (char_length(tagline) <= 160),
  logo_url text,
  favicon_url text,
  default_seo_title text not null default 'PromptAvero | Curated AI Image Prompts' check (char_length(default_seo_title) <= 120),
  default_seo_description text not null default 'A curated library of creative, detailed AI image-generation prompts for portraits, cinematic scenes, 3D illustrations, fantasy art, product photography and more.' check (char_length(default_seo_description) <= 320),
  default_og_image_url text,
  site_url text check (site_url is null or site_url ~ '^https?://[^/]+$'),
  custom_domain text check (custom_domain is null or char_length(custom_domain) <= 253),
  x_url text check (x_url is null or x_url ~ '^https?://'),
  instagram_url text check (instagram_url is null or instagram_url ~ '^https?://'),
  youtube_url text check (youtube_url is null or youtube_url ~ '^https?://'),
  pinterest_url text check (pinterest_url is null or pinterest_url ~ '^https?://'),
  contact_email text check (contact_email is null or contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_details text check (contact_details is null or char_length(contact_details) <= 1000),
  google_analytics_id text check (google_analytics_id is null or google_analytics_id ~ '^G-[A-Z0-9]+$'),
  google_site_verification text check (google_site_verification is null or char_length(google_site_verification) <= 200),
  bing_site_verification text check (bing_site_verification is null or char_length(bing_site_verification) <= 200),
  allow_indexing boolean not null default true,
  sitemap_enabled boolean not null default true,
  ads_enabled boolean not null default false,
  adsense_client_id text check (adsense_client_id is null or adsense_client_id ~ '^ca-pub-[0-9]+$'),
  ad_slot_listing text check (ad_slot_listing is null or ad_slot_listing ~ '^[0-9]+$'),
  ad_slot_prompt text check (ad_slot_prompt is null or ad_slot_prompt ~ '^[0-9]+$'),
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- ───────────────────────── Triggers ─────────────────────────
create or replace function public.compute_prompt_vector(
  p_title text, p_tags text[], p_excerpt text, p_category text, p_text text
) returns tsvector
language sql stable set search_path = ''
as $$
  select setweight(to_tsvector('english', coalesce(p_title, '')), 'A')
    || setweight(to_tsvector('english', array_to_string(coalesce(p_tags, '{}'), ' ')), 'B')
    || setweight(to_tsvector('english', coalesce(p_excerpt, '')), 'B')
    || setweight(to_tsvector('english', coalesce(p_category, '')), 'C')
    || setweight(to_tsvector('english', coalesce(p_text, '')), 'D');
$$;

create or replace function public.prompts_before_write()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  cat_name text;
begin
  new.tags := coalesce((
    select array_agg(s.t order by s.first_ord)
    from (
      select lower(btrim(u.x)) as t, min(u.ord) as first_ord
      from unnest(new.tags) with ordinality as u(x, ord)
      where btrim(u.x) <> ''
      group by lower(btrim(u.x))
    ) s
  ), '{}');

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  if tg_op = 'UPDATE' then
    if (new.title, new.slug, new.prompt_text, new.excerpt, new.category_id, new.featured_image_url,
        new.featured_image_alt, new.tags, new.status, new.featured, new.published_at,
        new.seo_title, new.seo_description, new.canonical_url)
       is distinct from
       (old.title, old.slug, old.prompt_text, old.excerpt, old.category_id, old.featured_image_url,
        old.featured_image_alt, old.tags, old.status, old.featured, old.published_at,
        old.seo_title, old.seo_description, old.canonical_url) then
      new.updated_at := now();
    else
      new.updated_at := old.updated_at;
    end if;
  end if;

  select c.name into cat_name from public.categories c where c.id = new.category_id;
  new.search_vector := public.compute_prompt_vector(new.title, new.tags, new.excerpt, cat_name, new.prompt_text);
  return new;
end;
$$;
drop trigger if exists prompts_before_write_trg on public.prompts;
create trigger prompts_before_write_trg
  before insert or update on public.prompts
  for each row execute function public.prompts_before_write();

create or replace function public.prompts_slug_redirect()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.slug_redirects where kind = 'prompt' and old_slug = new.slug;
  if tg_op = 'UPDATE' and old.slug is distinct from new.slug then
    insert into public.slug_redirects (kind, old_slug, prompt_id)
    values ('prompt', old.slug, new.id)
    on conflict (kind, old_slug) do update set prompt_id = excluded.prompt_id;
  end if;
  return null;
end;
$$;
drop trigger if exists prompts_slug_redirect_trg on public.prompts;
create trigger prompts_slug_redirect_trg
  after insert or update of slug on public.prompts
  for each row execute function public.prompts_slug_redirect();

create or replace function public.categories_before_write()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists categories_before_write_trg on public.categories;
create trigger categories_before_write_trg
  before update on public.categories
  for each row execute function public.categories_before_write();

create or replace function public.categories_after_write()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.slug_redirects where kind = 'category' and old_slug = new.slug;
  if tg_op = 'UPDATE' and old.slug is distinct from new.slug then
    insert into public.slug_redirects (kind, old_slug, category_id)
    values ('category', old.slug, new.id)
    on conflict (kind, old_slug) do update set category_id = excluded.category_id;
  end if;
  if tg_op = 'UPDATE' and old.name is distinct from new.name then
    update public.prompts p
    set search_vector = public.compute_prompt_vector(p.title, p.tags, p.excerpt, new.name, p.prompt_text)
    where p.category_id = new.id;
  end if;
  return null;
end;
$$;
drop trigger if exists categories_after_write_trg on public.categories;
create trigger categories_after_write_trg
  after insert or update on public.categories
  for each row execute function public.categories_after_write();

create or replace function public.site_settings_touch()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists site_settings_touch_trg on public.site_settings;
create trigger site_settings_touch_trg
  before update on public.site_settings
  for each row execute function public.site_settings_touch();

-- ───────────────────────── Row Level Security ─────────────────────────
alter table public.categories enable row level security;
alter table public.prompts enable row level security;
alter table public.slug_redirects enable row level security;
alter table public.site_settings enable row level security;

-- categories
create policy categories_public_read on public.categories for select to anon, authenticated using (true);
create policy categories_admin_insert on public.categories for insert to authenticated with check ((select public.is_admin()));
create policy categories_admin_update on public.categories for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy categories_admin_delete on public.categories for delete to authenticated using ((select public.is_admin()));

-- prompts: the public sees only published prompts whose publication time has passed
create policy prompts_public_read on public.prompts for select to anon, authenticated
  using (status = 'published' and published_at <= now());
create policy prompts_admin_read on public.prompts for select to authenticated using ((select public.is_admin()));
create policy prompts_admin_insert on public.prompts for insert to authenticated
  with check ((select public.is_admin()) and author_id = (select auth.uid()));
create policy prompts_admin_update on public.prompts for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy prompts_admin_delete on public.prompts for delete to authenticated using ((select public.is_admin()));

-- slug redirects: public can resolve a redirect only if its target is publicly visible
create policy slug_redirects_public_read on public.slug_redirects for select to anon, authenticated
  using (
    kind = 'category'
    or exists (
      select 1 from public.prompts p
      where p.id = slug_redirects.prompt_id and p.status = 'published' and p.published_at <= now()
    )
  );
create policy slug_redirects_admin_all on public.slug_redirects for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- site settings
create policy site_settings_public_read on public.site_settings for select to anon, authenticated using (true);
create policy site_settings_admin_update on public.site_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
revoke insert, delete on public.site_settings from anon, authenticated;

-- ───────────────────────── Search and discovery functions ─────────────────────────
create or replace function public.build_tsquery(q text)
returns tsquery
language plpgsql immutable set search_path = ''
as $$
declare
  cleaned text;
  terms text;
begin
  cleaned := lower(regexp_replace(coalesce(q, ''), '[^[:alnum:]]+', ' ', 'g'));
  select string_agg(w || ':*', ' & ') into terms
  from (
    select w from regexp_split_to_table(btrim(cleaned), '\s+') as w where w <> '' limit 8
  ) s;
  if terms is null then
    return null;
  end if;
  return to_tsquery('english', terms);
end;
$$;

create or replace function public.search_prompts(
  p_q text default null,
  p_category text default null,
  p_tag text default null,
  p_sort text default 'relevance',
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  id uuid, title text, slug text, excerpt text,
  featured_image_url text, featured_image_alt text, image_width integer, image_height integer,
  tags text[], published_at timestamptz, category_name text, category_slug text, total_count bigint
)
language sql stable set search_path = ''
as $$
  with params as (select public.build_tsquery(p_q) as tsq),
  matched as (
    select pr.id, pr.title, pr.slug, pr.excerpt, pr.featured_image_url, pr.featured_image_alt,
           pr.image_width, pr.image_height, pr.tags, pr.published_at,
           c.name as category_name, c.slug as category_slug,
           case when (select tsq from params) is not null
                then ts_rank_cd(pr.search_vector, (select tsq from params)) else 0 end as rank
    from public.prompts pr
    join public.categories c on c.id = pr.category_id
    where pr.status = 'published' and pr.published_at <= now()
      and ((select tsq from params) is null or pr.search_vector @@ (select tsq from params))
      and (p_category is null or c.slug = p_category)
      and (p_tag is null or pr.tags @> array[lower(p_tag)])
  )
  select m.id, m.title, m.slug, m.excerpt, m.featured_image_url, m.featured_image_alt,
         m.image_width, m.image_height, m.tags, m.published_at, m.category_name, m.category_slug,
         count(*) over () as total_count
  from matched m
  order by
    case when p_sort = 'relevance' then m.rank end desc nulls last,
    case when p_sort = 'oldest' then m.published_at end asc,
    case when p_sort = 'title' then m.title end asc,
    m.published_at desc
  limit greatest(least(p_limit, 50), 1)
  offset greatest(p_offset, 0);
$$;

create or replace function public.related_prompts(p_id uuid, p_limit integer default 3)
returns table (
  id uuid, title text, slug text, excerpt text,
  featured_image_url text, featured_image_alt text, image_width integer, image_height integer,
  tags text[], published_at timestamptz, category_name text, category_slug text
)
language sql stable set search_path = ''
as $$
  with base as (
    select b.category_id, b.tags from public.prompts b where b.id = p_id
  )
  select pr.id, pr.title, pr.slug, pr.excerpt, pr.featured_image_url, pr.featured_image_alt,
         pr.image_width, pr.image_height, pr.tags, pr.published_at,
         c.name as category_name, c.slug as category_slug
  from public.prompts pr
  join public.categories c on c.id = pr.category_id
  cross join base
  where pr.id <> p_id
    and pr.status = 'published' and pr.published_at <= now()
    and (pr.category_id = base.category_id or pr.tags && base.tags)
  order by
    (select count(*) from unnest(pr.tags) t where t = any (base.tags)) desc,
    (pr.category_id = base.category_id) desc,
    pr.published_at desc
  limit greatest(least(p_limit, 12), 1);
$$;

create or replace function public.category_prompt_counts()
returns table (category_id uuid, prompt_count bigint)
language sql stable set search_path = ''
as $$
  select pr.category_id, count(*)
  from public.prompts pr
  where pr.status = 'published' and pr.published_at <= now()
  group by pr.category_id;
$$;

create or replace function public.list_tags(p_limit integer default 40)
returns table (tag text, prompt_count bigint)
language sql stable set search_path = ''
as $$
  select t.tag, count(*) as prompt_count
  from public.prompts pr, unnest(pr.tags) as t(tag)
  where pr.status = 'published' and pr.published_at <= now()
  group by t.tag
  order by count(*) desc, t.tag
  limit greatest(least(p_limit, 200), 1);
$$;

-- ───────────────────────── Storage ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prompt-images', 'prompt-images', true, 8388608,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy prompt_images_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'prompt-images' and (select public.is_admin()));
create policy prompt_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'prompt-images' and (select public.is_admin()));
create policy prompt_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'prompt-images' and (select public.is_admin()))
  with check (bucket_id = 'prompt-images' and (select public.is_admin()));
create policy prompt_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'prompt-images' and (select public.is_admin()));

-- ───────────────────────── Starter categories ─────────────────────────
insert into public.categories (name, slug, description, sort_order) values
  ('AI Portraits', 'ai-portraits', 'Prompts for lifelike and stylized portraits, with attention to lighting, lens choice, skin texture and mood.', 1),
  ('3D Illustrations', '3d-illustrations', 'Soft-lit 3D renders, isometric scenes and stylized characters, written for clean materials and clear composition.', 2),
  ('Cinematic Photography', 'cinematic-photography', 'Film-inspired frames with deliberate color grading, depth of field and atmosphere, from street scenes to wide establishing shots.', 3),
  ('Fantasy Art', 'fantasy-art', 'Worlds, creatures and characters for fantasy artwork, with prompts that guide scale, light and storytelling detail.', 4),
  ('Anime and Character Art', 'anime-and-character-art', 'Character-focused prompts in anime and illustrated styles, covering pose, outfit, expression and background.', 5),
  ('Product Photography', 'product-photography', 'Studio and lifestyle product shots with controlled lighting, surfaces and backdrops suited to commercial mockups.', 6),
  ('Fashion and Editorial', 'fashion-and-editorial', 'Magazine-style fashion imagery with styling, set design and lighting direction for editorial looks.', 7),
  ('Nature and Landscapes', 'nature-and-landscapes', 'Landscape, wildlife and weather prompts that emphasize atmosphere, season and time of day.', 8),
  ('Architecture and Interiors', 'architecture-and-interiors', 'Exteriors, interiors and spatial concepts, with prompts for materials, daylight and architectural style.', 9),
  ('Social Media Creatives', 'social-media-creatives', 'Eye-catching visuals sized and composed for posts, covers and thumbnails, with room left for text overlays.', 10)
on conflict (slug) do nothing;
