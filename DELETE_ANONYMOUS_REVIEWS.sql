-- 删除之前未登录用户的评价

-- 1. 先查看 reviews 表的结构，了解字段情况
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reviews';

-- 2. 查看当前评价数据，识别未登录用户的评价
SELECT id, canteen_id, rating, content, user_name, created_at 
FROM reviews 
ORDER BY created_at DESC;

-- 3. 删除未登录用户的评价（根据 user_name 字段判断）
-- 假设未登录用户的 user_name 为 '未登录用户' 或为空
DELETE FROM reviews 
WHERE user_name = '未登录用户' OR user_name IS NULL OR user_name = '';

-- 4. 验证删除结果
SELECT COUNT(*) as remaining_reviews FROM reviews;
