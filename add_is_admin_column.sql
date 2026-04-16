-- 为 users 表添加 is_admin 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- （可选）设置第一个注册的用户为管理员
-- UPDATE users SET is_admin = TRUE WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);
