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

// 档口类型定义
export type Stall = {
  id: string;
  canteen_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

// 菜品类型定义
export type Dish = {
  id: string;
  stall_id: string;
  name: string;
  description: string | null;
  price: number;
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
  created_at: string;
};

// 用户类型定义
export type User = {
  id: string;
  email: string;
  name: string;
  user_type: string;
  student_id: string;
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
}, user: User | null): Promise<{ review: Review | null; error: string | null }> {
  // 检查用户是否登录
  if (!user) {
    const errorMsg = "未登录用户不能提交评价";
    console.error(errorMsg);
    return { review: null, error: errorMsg };
  }

  try {
    const { data: newReview, error } = await supabase
      .from("reviews")
      .insert(data)
      .select()
      .single();

    if (error) {
      const errorMsg = `提交评价失败: ${error.message || JSON.stringify(error)}`;
      console.error(errorMsg, error);
      return { review: null, error: errorMsg };
    }

    return { review: newReview, error: null };
  } catch (err) {
    const errorMsg = `提交评价失败: ${err instanceof Error ? err.message : JSON.stringify(err)}`;
    console.error(errorMsg, err);
    return { review: null, error: errorMsg };
  }
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

// 删除评价
export async function deleteReview(reviewId: string, user: User | null): Promise<boolean> {
  // 检查用户是否登录
  if (!user) {
    console.error("未登录用户不能删除评价");
    return false;
  }

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId);

  if (error) {
    console.error("删除评价失败:", error);
    return false;
  }

  return true;
}

// 用户注册
export async function register(
  email: string,
  password: string,
  name: string,
  userType: string,
  studentId: string
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

    // 检查学号/工号是否已存在
    const { data: existingStudentId } = await supabase
      .from("users")
      .select("id")
      .eq("student_id", studentId)
      .single();

    if (existingStudentId) {
      return {
        user: null,
        token: null,
        error: userType === "student" ? "学号已被注册" : "工号已被注册",
      };
    }

    // 创建新用户
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email,
        password, // 注意：实际项目中应该哈希密码
        name,
        user_type: userType,
        student_id: studentId,
      })
      .select("id, email, name, user_type, student_id, created_at, updated_at")
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
export async function login(email: string, password: string, userType: string): Promise<AuthResponse> {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, user_type, student_id, created_at, updated_at")
      .eq("email", email)
      .eq("password", password) // 注意：实际项目中应该验证哈希密码
      .eq("user_type", userType)
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
    .select("id, email, name, user_type, student_id, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("获取用户信息失败:", error);
    return null;
  }

  return data;
}

// 获取用户评价历史
export async function getUserReviews(userId: string): Promise<Review[]> {
  // 首先获取用户信息
  const user = await getUserById(userId);
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_name", user.name)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("获取用户评价历史失败:", error);
    return [];
  }

  return data || [];
}

// 添加收藏
export async function addFavorite(userId: string, canteenId: string): Promise<boolean> {
  const { error } = await supabase
    .from("favorites")
    .insert({
      user_id: userId,
      canteen_id: canteenId
    });

  if (error) {
    console.error("添加收藏失败:", error);
    return false;
  }

  return true;
}

// 取消收藏
export async function removeFavorite(userId: string, canteenId: string): Promise<boolean> {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("canteen_id", canteenId);

  if (error) {
    console.error("取消收藏失败:", error);
    return false;
  }

  return true;
}

// 检查是否已收藏
export async function isFavorite(userId: string, canteenId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("canteen_id", canteenId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

// 获取用户收藏的食堂
export async function getUserFavorites(userId: string): Promise<Canteen[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("canteen_id")
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  // 获取所有收藏的食堂详情
  const canteenIds = data.map((item: any) => item.canteen_id);
  if (canteenIds.length === 0) {
    return [];
  }

  const { data: canteens, error: canteensError } = await supabase
    .from("canteens")
    .select("*")
    .in("id", canteenIds);

  if (canteensError) {
    console.error("获取收藏食堂失败:", canteensError);
    return [];
  }

  return canteens || [];
}

// 获取食堂排行榜（按评分排序）
export async function getCanteenRanking(): Promise<(Canteen & { rating: number })[]> {
  // 首先获取所有食堂
  const { data: canteens, error } = await supabase
    .from("canteens")
    .select("*");

  if (error || !canteens) {
    return [];
  }

  // 获取每个食堂的评分
  const canteensWithRating = await Promise.all(
    canteens.map(async (canteen) => {
      const rating = await getCanteenRating(canteen.id);
      return {
        ...canteen,
        rating
      };
    })
  );

  // 按评分排序，降序
  canteensWithRating.sort((a, b) => b.rating - a.rating);

  return canteensWithRating;
}

// 获取食堂的档口列表
export async function getCanteenStalls(canteenId: string): Promise<Stall[]> {
  const { data, error } = await supabase
    .from("stalls")
    .select("*")
    .eq("canteen_id", canteenId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("获取档口列表失败:", error);
    return [];
  }

  return data || [];
}

// 获取单个档口详情
export async function getStallById(stallId: string): Promise<Stall | null> {
  const { data, error } = await supabase
    .from("stalls")
    .select("*")
    .eq("id", stallId)
    .single();

  if (error) {
    console.error("获取档口详情失败:", error);
    return null;
  }

  return data;
}

// 获取档口的菜品列表
export async function getStallDishes(stallId: string): Promise<Dish[]> {
  const { data, error } = await supabase
    .from("dishes")
    .select("*")
    .eq("stall_id", stallId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("获取菜品列表失败:", error);
    return [];
  }

  return data || [];
}

// 获取单个菜品详情
export async function getDishById(dishId: string): Promise<Dish | null> {
  const { data, error } = await supabase
    .from("dishes")
    .select("*")
    .eq("id", dishId)
    .single();

  if (error) {
    console.error("获取菜品详情失败:", error);
    return null;
  }

  return data;
}
