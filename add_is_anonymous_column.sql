-- 给reviews表添加is_anonymous字段
-- 字段类型：布尔值（boolean）
-- 默认值：false（表示默认非匿名）

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false;