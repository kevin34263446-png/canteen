-- Supabase RLS 权限设置 SQL 语句

-- 1. 先查看 reviews 表的结构
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reviews';

-- 2. 如果 reviews 表不存在，创建它
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  canteen_id UUID NOT NULL REFERENCES canteens(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 如果 reviews 表存在但缺少 user_id 字段，添加它
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid();

-- 4. 确保其他必要字段存在
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS canteen_id UUID NOT NULL REFERENCES canteens(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS content TEXT NOT NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_name TEXT NOT NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. 启用 RLS (Row Level Security)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 6. 删除现有的插入策略（如果存在）
DROP POLICY IF EXISTS allow_insert_only_authenticated_users ON reviews;

-- 7. 创建新的插入策略，确保只有登录用户才能插入数据，并且 user_id 与当前用户匹配
CREATE POLICY allow_insert_only_authenticated_users ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 8. 删除现有的删除策略（如果存在）
DROP POLICY IF EXISTS allow_delete_own_reviews ON reviews;

-- 9. 创建新的删除策略，确保用户只能删除自己的评价
CREATE POLICY allow_delete_own_reviews ON reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 10. 确保读取策略存在（允许所有用户读取）
DROP POLICY IF EXISTS allow_select_for_all_users ON reviews;

CREATE POLICY allow_select_for_all_users ON reviews
  FOR SELECT
  TO authenticated, anonymous
  USING (true);

-- 11. 清理历史脏数据（删除没有 user_id 的评价）
DELETE FROM reviews WHERE user_id IS NULL;

-- 12. 验证 RLS 策略是否正确设置
SELECT * FROM pg_policies WHERE tablename = 'reviews';

-- 13. 验证表结构是否正确
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reviews';
