-- 菜品评价表
CREATE TABLE IF NOT EXISTS dish_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id TEXT NOT NULL,
  canteen_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  user_name TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dish_reviews_dish_id_idx ON dish_reviews(dish_id);
CREATE INDEX IF NOT EXISTS dish_reviews_canteen_id_idx ON dish_reviews(canteen_id);
CREATE INDEX IF NOT EXISTS dish_reviews_user_id_idx ON dish_reviews(user_id);
CREATE INDEX IF NOT EXISTS dish_reviews_created_at_idx ON dish_reviews(created_at);
