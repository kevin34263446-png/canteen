import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 食堂类型定义
export type Canteen = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  created_at: string;
};

// 评价类型定义
export type Review = {
  id: string;
  canteen_id: string;
  rating: number;
  content: string;
  user_name: string;
  is_anonymous: boolean;
  created_at: string;
};

// 用户类型定义
export type User = {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
};

// 认证响应类型
export type AuthResponse = {
  user: User | null;
  token: string | null;
  error: string | null;
};

// 获取所有食堂数据
export async function getCanteens(): Promise<Canteen[]> {
  const { data, error } = await supabase
    .from("canteens")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("获取食堂数据失败:", error);
    return [];
  }

  return data || [];
}

// 获取单个食堂详情
export async function getCanteenById(id: string): Promise<Canteen | null> {
  const { data, error } = await supabase
    .from("canteens")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("获取食堂详情失败:", error);
    return null;
  }

  return data;
}

// 获取食堂的评价列表
export async function getCanteenReviews(canteenId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("canteen_id", canteenId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("获取评价列表失败:", error);
    return [];
  }

  return data || [];
}

// 提交评价
export async function createReview(data: {
  canteen_id: string;
  rating: number;
  content: string;
  user_name: string;
}): Promise<Review | null> {
  const { data: newReview, error } = await supabase
    .from("reviews")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("提交评价失败:", error);
    return null;
  }

  return newReview;
}

// 获取食堂的平均评分
export async function getCanteenRating(canteenId: string): Promise<number> {
  const { data, error } = await supabase
    .from("reviews")
    .select("avg(rating) as avg_rating")
    .eq("canteen_id", canteenId)
    .single();

  if (error || !data) {
    return 0;
  }

  return Number((data as any).avg_rating || 0);
}

// 用户注册
export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  try {
    // 检查邮箱是否已存在
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return {
        user: null,
        token: null,
        error: "邮箱已被注册",
      };
    }

    // 创建新用户
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email,
        password, // 注意：实际项目中应该哈希密码
        name,
      })
      .select("id, email, name, created_at, updated_at")
      .single();

    if (error) {
      return {
        user: null,
        token: null,
        error: error.message,
      };
    }

    // 生成简单的 token（实际项目中应该使用 JWT）
    const token = btoa(JSON.stringify({ userId: newUser.id }));

    return {
      user: newUser,
      token,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      token: null,
      error: "注册失败，请重试",
    };
  }
}

// 用户登录
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, created_at, updated_at")
      .eq("email", email)
      .eq("password", password) // 注意：实际项目中应该验证哈希密码
      .single();

    if (error || !user) {
      return {
        user: null,
        token: null,
        error: "邮箱或密码错误",
      };
    }

    // 生成简单的 token
    const token = btoa(JSON.stringify({ userId: user.id }));

    return {
      user,
      token,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      token: null,
      error: "登录失败，请重试",
    };
  }
}

// 获取用户信息
export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("获取用户信息失败:", error);
    return null;
  }

  return data;
}
