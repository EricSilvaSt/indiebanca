
CREATE SCHEMA IF NOT EXISTS indiebanca;
GRANT USAGE ON SCHEMA indiebanca TO anon, authenticated, service_role;

-- ENUMS
CREATE TYPE indiebanca.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE indiebanca.artist_type AS ENUM ('Banda', 'Artista solo');
CREATE TYPE indiebanca.genre AS ENUM ('Rock', 'Metal', 'Punk', 'Hardcore', 'Blues', 'Indie', 'Rap', 'Reggae', 'MPB', 'Outros');
CREATE TYPE indiebanca.product_category AS ENUM ('Camisetas', 'Bonés', 'CDs', 'Vinis', 'Adesivos', 'Palhetas', 'Posters', 'Personalizados');
CREATE TYPE indiebanca.order_status AS ENUM ('Pendente', 'Em produção', 'Enviado', 'Entregue');
CREATE TYPE indiebanca.post_type AS ENUM ('post', 'evento');

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION indiebanca.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = indiebanca AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE indiebanca.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON indiebanca.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON indiebanca.profiles TO authenticated;
GRANT ALL ON indiebanca.profiles TO service_role;
ALTER TABLE indiebanca.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON indiebanca.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON indiebanca.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON indiebanca.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON indiebanca.profiles FOR EACH ROW EXECUTE FUNCTION indiebanca.set_updated_at();

-- USER ROLES
CREATE TABLE indiebanca.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role indiebanca.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON indiebanca.user_roles TO authenticated;
GRANT ALL ON indiebanca.user_roles TO service_role;
ALTER TABLE indiebanca.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON indiebanca.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION indiebanca.has_role(_user_id UUID, _role indiebanca.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = indiebanca AS $$
  SELECT EXISTS (SELECT 1 FROM indiebanca.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- handle_new_user trigger
CREATE OR REPLACE FUNCTION indiebanca.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = indiebanca AS $$
BEGIN
  INSERT INTO indiebanca.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO indiebanca.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION indiebanca.handle_new_user();

-- BANDS
CREATE TABLE indiebanca.bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type indiebanca.artist_type NOT NULL DEFAULT 'Banda',
  genre indiebanca.genre NOT NULL DEFAULT 'Outros',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'Brasil',
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  cover_url TEXT,
  monthly_listeners INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  socials JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON indiebanca.bands TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON indiebanca.bands TO authenticated;
GRANT ALL ON indiebanca.bands TO service_role;
ALTER TABLE indiebanca.bands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bands are viewable by everyone" ON indiebanca.bands FOR SELECT USING (true);
CREATE POLICY "Owners can insert bands" ON indiebanca.bands FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Owners can update own band" ON indiebanca.bands FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Owners can delete own band" ON indiebanca.bands FOR DELETE USING (auth.uid() = owner_user_id);
CREATE TRIGGER trg_bands_updated BEFORE UPDATE ON indiebanca.bands FOR EACH ROW EXECUTE FUNCTION indiebanca.set_updated_at();
CREATE INDEX idx_bands_featured ON indiebanca.bands(featured) WHERE featured = true;
CREATE INDEX idx_bands_owner ON indiebanca.bands(owner_user_id);

CREATE OR REPLACE FUNCTION indiebanca.is_band_owner(_band_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = indiebanca AS $$
  SELECT EXISTS (SELECT 1 FROM indiebanca.bands WHERE id = _band_id AND owner_user_id = auth.uid());
$$;

-- SONGS
CREATE TABLE indiebanca.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES indiebanca.bands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  album TEXT NOT NULL DEFAULT 'Single',
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now())::INT,
  duration TEXT NOT NULL DEFAULT '3:30',
  plays INTEGER NOT NULL DEFAULT 0,
  external_url TEXT,
  cover_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON indiebanca.songs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON indiebanca.songs TO authenticated;
GRANT ALL ON indiebanca.songs TO service_role;
ALTER TABLE indiebanca.songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Songs are viewable by everyone" ON indiebanca.songs FOR SELECT USING (true);
CREATE POLICY "Band owners can manage songs" ON indiebanca.songs FOR ALL USING (indiebanca.is_band_owner(band_id)) WITH CHECK (indiebanca.is_band_owner(band_id));
CREATE INDEX idx_songs_band ON indiebanca.songs(band_id);

-- PRODUCTS
CREATE TABLE indiebanca.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES indiebanca.bands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category indiebanca.product_category NOT NULL DEFAULT 'Camisetas',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  description TEXT NOT NULL DEFAULT '',
  on_demand BOOLEAN NOT NULL DEFAULT true,
  stock INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON indiebanca.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON indiebanca.products TO authenticated;
GRANT ALL ON indiebanca.products TO service_role;
ALTER TABLE indiebanca.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON indiebanca.products FOR SELECT USING (true);
CREATE POLICY "Band owners can manage products" ON indiebanca.products FOR ALL USING (indiebanca.is_band_owner(band_id)) WITH CHECK (indiebanca.is_band_owner(band_id));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON indiebanca.products FOR EACH ROW EXECUTE FUNCTION indiebanca.set_updated_at();
CREATE INDEX idx_products_band ON indiebanca.products(band_id);

-- EVENTS
CREATE TABLE indiebanca.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES indiebanca.bands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL DEFAULT '20:00',
  venue TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON indiebanca.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON indiebanca.events TO authenticated;
GRANT ALL ON indiebanca.events TO service_role;
ALTER TABLE indiebanca.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are viewable by everyone" ON indiebanca.events FOR SELECT USING (true);
CREATE POLICY "Band owners can manage events" ON indiebanca.events FOR ALL USING (indiebanca.is_band_owner(band_id)) WITH CHECK (indiebanca.is_band_owner(band_id));
CREATE INDEX idx_events_band ON indiebanca.events(band_id);
CREATE INDEX idx_events_date ON indiebanca.events(event_date);

-- POSTS
CREATE TABLE indiebanca.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES indiebanca.bands(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  type indiebanca.post_type NOT NULL DEFAULT 'post',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON indiebanca.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON indiebanca.posts TO authenticated;
GRANT ALL ON indiebanca.posts TO service_role;
ALTER TABLE indiebanca.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone" ON indiebanca.posts FOR SELECT USING (true);
CREATE POLICY "Band owners can manage posts" ON indiebanca.posts FOR ALL USING (indiebanca.is_band_owner(band_id)) WITH CHECK (indiebanca.is_band_owner(band_id));
CREATE INDEX idx_posts_band ON indiebanca.posts(band_id);
CREATE INDEX idx_posts_created ON indiebanca.posts(created_at DESC);

-- POST LIKES
CREATE TABLE indiebanca.post_likes (
  post_id UUID NOT NULL REFERENCES indiebanca.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT ON indiebanca.post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON indiebanca.post_likes TO authenticated;
GRANT ALL ON indiebanca.post_likes TO service_role;
ALTER TABLE indiebanca.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are viewable by everyone" ON indiebanca.post_likes FOR SELECT USING (true);
CREATE POLICY "Users manage own likes" ON indiebanca.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own likes" ON indiebanca.post_likes FOR DELETE USING (auth.uid() = user_id);

-- FOLLOWERS
CREATE TABLE indiebanca.followers (
  band_id UUID NOT NULL REFERENCES indiebanca.bands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (band_id, user_id)
);
GRANT SELECT ON indiebanca.followers TO anon;
GRANT SELECT, INSERT, DELETE ON indiebanca.followers TO authenticated;
GRANT ALL ON indiebanca.followers TO service_role;
ALTER TABLE indiebanca.followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Followers are viewable by everyone" ON indiebanca.followers FOR SELECT USING (true);
CREATE POLICY "Users follow as themselves" ON indiebanca.followers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unfollow themselves" ON indiebanca.followers FOR DELETE USING (auth.uid() = user_id);

-- ORDERS (basic policies only — cross-table policies added after order_items exists)
CREATE TABLE indiebanca.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  status indiebanca.order_status NOT NULL DEFAULT 'Pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON indiebanca.orders TO authenticated;
GRANT ALL ON indiebanca.orders TO service_role;
ALTER TABLE indiebanca.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers view own orders" ON indiebanca.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Buyers create own orders" ON indiebanca.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON indiebanca.orders FOR EACH ROW EXECUTE FUNCTION indiebanca.set_updated_at();
CREATE INDEX idx_orders_user ON indiebanca.orders(user_id);

-- ORDER ITEMS
CREATE TABLE indiebanca.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES indiebanca.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES indiebanca.products(id) ON DELETE SET NULL,
  band_id UUID NOT NULL REFERENCES indiebanca.bands(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  on_demand BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON indiebanca.order_items TO authenticated;
GRANT ALL ON indiebanca.order_items TO service_role;
ALTER TABLE indiebanca.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers view own order items" ON indiebanca.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM indiebanca.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));
CREATE POLICY "Buyers insert own order items" ON indiebanca.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM indiebanca.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));
CREATE POLICY "Band owners view items of their band" ON indiebanca.order_items FOR SELECT
  USING (indiebanca.is_band_owner(band_id));
CREATE INDEX idx_order_items_order ON indiebanca.order_items(order_id);
CREATE INDEX idx_order_items_band ON indiebanca.order_items(band_id);

-- Now safe to add cross-table policies on orders
CREATE POLICY "Band owners view orders containing their items" ON indiebanca.orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM indiebanca.order_items oi JOIN indiebanca.bands b ON b.id = oi.band_id WHERE oi.order_id = orders.id AND b.owner_user_id = auth.uid()));
CREATE POLICY "Band owners update orders containing their items" ON indiebanca.orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM indiebanca.order_items oi JOIN indiebanca.bands b ON b.id = oi.band_id WHERE oi.order_id = orders.id AND b.owner_user_id = auth.uid()));
