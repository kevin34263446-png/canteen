# Supabase RLS 权限设置指南

## 概述

为了确保只有登录用户才能提交评价，并且只能删除自己的评价，我们需要在 Supabase 端设置 RLS (Row Level Security) 权限。RLS 可以在数据库层面控制数据的访问权限，防止未授权的用户直接写入数据。

## 步骤一：修改 `reviews` 表结构

1. 登录到 Supabase 控制台
2. 进入 "Database" 页面
3. 找到 `reviews` 表
4. 点击 "Edit" 按钮
5. 添加以下列：
   - **Name**: `user_id`
   - **Data type**: `uuid`
   - **Default value**: `auth.uid()`
   - **Nullable**: `false`
6. 点击 "Save"

## 步骤二：启用 RLS

1. 在 `reviews` 表的编辑页面，启用 "Row Level Security (RLS)"
2. 点击 "Save"

## 步骤三：创建 RLS 策略

### 1. 为 `reviews` 表创建插入权限策略

1. 在 `reviews` 表的 RLS 设置页面，点击 "New Policy"
2. 选择 "For Insert"
3. 填写以下信息：
   - **Policy name**: `allow_insert_only_authenticated_users`
   - **Target roles**: `authenticated`
   - **Using expression**: `true`
   - **With check expression**: `auth.uid() = user_id`
4. 点击 "Save Policy"

### 2. 为 `reviews` 表创建读取权限策略

1. 在 `reviews` 表的 RLS 设置页面，点击 "New Policy"
2. 选择 "For Select"
3. 填写以下信息：
   - **Policy name**: `allow_select_for_all_users`
   - **Target roles**: `authenticated`, `anonymous`
   - **Using expression**: `true`
4. 点击 "Save Policy"

### 3. 为 `reviews` 表创建删除权限策略

1. 在 `reviews` 表的 RLS 设置页面，点击 "New Policy"
2. 选择 "For Delete"
3. 填写以下信息：
   - **Policy name**: `allow_delete_own_reviews`
   - **Target roles**: `authenticated`
   - **Using expression**: `auth.uid() = user_id`
4. 点击 "Save Policy"

### 4. 为 `reviews` 表创建更新权限策略（可选）

如果需要允许用户更新自己的评价，可以添加以下策略：

1. 在 `reviews` 表的 RLS 设置页面，点击 "New Policy"
2. 选择 "For Update"
3. 填写以下信息：
   - **Policy name**: `allow_update_own_reviews`
   - **Target roles**: `authenticated`
   - **Using expression**: `auth.uid() = user_id`
   - **With check expression**: `auth.uid() = user_id`
4. 点击 "Save Policy"

## 步骤四：清理历史脏数据

1. 在 Supabase 控制台中，进入 SQL Editor
2. 运行以下 SQL 命令，删除所有没有 user_id 的评价：
   ```sql
   DELETE FROM reviews WHERE user_id IS NULL;
   ```
3. 运行以下 SQL 命令，删除所有 user_id 无效的评价：
   ```sql
   DELETE FROM reviews WHERE user_id NOT IN (SELECT id FROM users);
   ```

## 步骤五：更新前端代码

### 更新 `supabase.ts` 中的类型定义和函数

1. 更新 `Review` 类型定义，添加 `user_id` 字段：
   ```typescript
   export type Review = {
     id: string;
     canteen_id: string;
     rating: number;
     content: string;
     user_name: string;
     user_id: string; // 添加用户 ID 字段
     is_anonymous: boolean;
     created_at: string;
   };
   ```

2. 更新 `createReview` 函数，确保包含 `user_id`：
   ```typescript
   export async function createReview(data: {
     canteen_id: string;
     rating: number;
     content: string;
     user_name: string;
   }, user: User | null): Promise<Review | null> {
     // 检查用户是否登录
     if (!user) {
       console.error("未登录用户不能提交评价");
       return null;
     }

     const { data: newReview, error } = await supabase
       .from("reviews")
       .insert({
         ...data,
         user_id: user.id, // 添加用户 ID
         is_anonymous: false // 强制非匿名，移除匿名评价功能
       })
       .select()
       .single();

     if (error) {
       console.error("提交评价失败:", error);
       return null;
     }

     return newReview;
   }
   ```

3. 添加 `deleteReview` 函数，用于删除评价：
   ```typescript
   export async function deleteReview(reviewId: string, user: User | null): Promise<boolean> {
     // 检查用户是否登录
     if (!user) {
       console.error("未登录用户不能删除评价");
       return false;
     }

     const { error } = await supabase
       .from("reviews")
       .delete()
       .eq("id", reviewId)
       .eq("user_id", user.id); // 确保只能删除自己的评价

     if (error) {
       console.error("删除评价失败:", error);
       return false;
     }

     return true;
   }
   ```

### 更新 `ReviewForm.tsx` 组件

1. 移除匿名评价选项
2. 确保只有登录用户才能提交评价
3. 确保提交评价时包含用户信息

### 更新 `canteen/[id]/page.tsx` 页面

1. 添加删除评价功能
2. 只给评价发布者显示删除按钮
3. 实现删除确认提示
4. 删除成功后自动刷新评价列表

## 测试验证

1. 尝试在未登录状态下提交评价，应该会收到错误提示
2. 登录后再尝试提交评价，应该可以成功
3. 尝试删除自己的评价，应该可以成功
4. 尝试删除其他用户的评价，应该会失败
5. 尝试使用 API 工具（如 Postman）直接向 `reviews` 表插入数据，应该会被 RLS 策略阻止
6. 尝试使用 API 工具直接删除其他用户的评价，应该会被 RLS 策略阻止

## 总结

通过以上步骤，我们实现了：
1. 前端层面：
   - 未登录用户无法提交评价，会显示登录提示
   - 未登录用户和非发布者看不到删除按钮
   - 只有评价发布者才能删除自己的评价
   - 删除评价时会显示确认提示，防止误删

2. 后端层面：
   - 通过 Supabase RLS 策略，确保只有登录用户才能向 `reviews` 表插入数据
   - 通过 Supabase RLS 策略，确保用户只能删除自己的评价
   - 清理了历史脏数据，确保数据完整性

3. 数据完整性：
   - 通过添加 `user_id` 字段，确保每个评价都与用户关联
   - 强制非匿名评价，确保评价可追溯

这样就形成了完整的权限控制体系，防止未登录用户提交评价，并且确保用户只能管理自己的评价。