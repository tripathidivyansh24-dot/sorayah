create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  description text default '',
  price integer not null,
  compare_at_price integer,
  image_url text default '',
  image_url_2 text default '',
  image_url_3 text default '',
  image_url_4 text default '',
  badge text default '',
  image_class text default '',
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists image_url text default '';
alter table public.products add column if not exists image_url_2 text default '';
alter table public.products add column if not exists image_url_3 text default '';
alter table public.products add column if not exists image_url_4 text default '';

alter table public.products enable row level security;

drop policy if exists "Products are publicly readable" on public.products;
create policy "Products are publicly readable"
on public.products
for select
to anon
using (true);

insert into public.products
  (name, category, description, price, compare_at_price, image_url, image_url_2, image_url_3, image_url_4, badge, image_class)
values
  ('Royal Zari Banarasi', 'Banarasi', 'Handwoven pure silk with intricate zari motifs', 8499, 11999, '', '', '', '', 'hot', 'pi-1'),
  ('Floral Organza Dream', 'Organza', 'Lightweight organza with delicate floral embroidery', 4299, 5999, '', '', '', '', 'new', 'pi-2'),
  ('Kanjivaram Temple', 'Kanjivaram', 'Traditional temple border design in pure Kanjivaram silk', 12999, null, '', '', '', '', '', 'pi-3'),
  ('Peacock Silk Saree', 'Silk', 'Vibrant peacock motifs on rich Mysore silk', 6799, 8999, '', '', '', '', 'sale', 'pi-4'),
  ('Bridal Lehenga Saree', 'Bridal', 'Heavy embroidered bridal saree with blouse', 18999, null, '', '', '', '', 'new', 'pi-5'),
  ('Chiffon Garden Saree', 'Chiffon', 'Soft chiffon with floral print, perfect for parties', 2499, 3499, '', '', '', '', 'hot', 'pi-6')
on conflict (name) do update set
  category = excluded.category,
  description = excluded.description,
  price = excluded.price,
  compare_at_price = excluded.compare_at_price,
  image_url = coalesce(nullif(excluded.image_url, ''), products.image_url),
  image_url_2 = coalesce(nullif(excluded.image_url_2, ''), products.image_url_2),
  image_url_3 = coalesce(nullif(excluded.image_url_3, ''), products.image_url_3),
  image_url_4 = coalesce(nullif(excluded.image_url_4, ''), products.image_url_4),
  badge = excluded.badge,
  image_class = excluded.image_class;
