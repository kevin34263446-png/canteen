-- 说明：
-- - 一个食堂(canteen)可以有多个档口(stalls)
-- - 一个档口(stall)可以有多个菜品(dishes)
-- - 这里使用 TEXT 存储 canteen_id / stall_id，兼容你现有的 canteens 表主键类型（uuid / text 都可存）

-- 如你的项目尚未启用 gen_random_uuid，可取消注释启用 pgcrypto
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS stalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stalls_canteen_id_idx ON stalls(canteen_id);
CREATE INDEX IF NOT EXISTS stalls_created_at_idx ON stalls(created_at);

CREATE TABLE IF NOT EXISTS dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id TEXT NOT NULL,
  stall_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT '未分类',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dishes_canteen_id_idx ON dishes(canteen_id);
CREATE INDEX IF NOT EXISTS dishes_stall_id_idx ON dishes(stall_id);
CREATE INDEX IF NOT EXISTS dishes_category_idx ON dishes(category);
CREATE INDEX IF NOT EXISTS dishes_created_at_idx ON dishes(created_at);

