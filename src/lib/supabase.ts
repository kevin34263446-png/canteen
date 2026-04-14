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
  user_id: string;
  rating: number;
  content: string;
  user_name: string;
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
  canteen_id: string;
  stall_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
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
  user_id: string;
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
    throw new Error(`提交评价失败: ${error.message}`);
  }

  return newReview;
}

// 删除评价
export async function deleteReview(reviewId: string, user: User | null): Promise<{ success: boolean; error: string | null }> {
  // 检查用户是否登录
  if (!user) {
    const errorMsg = "未登录用户不能删除评价";
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  try {
    // 首先获取评价信息，检查是否是用户自己的评价
    const { data: review, error: getError } = await supabase
      .from("reviews")
      .select("user_name")
      .eq("id", reviewId)
      .single();

    if (getError || !review) {
      const errorMsg = "评价不存在";
      console.error(errorMsg, getError);
      return { success: false, error: errorMsg };
    }

    // 检查是否是用户自己的评价
    if (review.user_name !== user.name) {
      const errorMsg = "只能删除自己的评价";
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // 删除评价
    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) {
      const errorMsg = `删除评价失败: ${deleteError.message || JSON.stringify(deleteError)}`;
      console.error(errorMsg, deleteError);
      return { success: false, error: errorMsg };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMsg = `删除评价失败: ${err instanceof Error ? err.message : JSON.stringify(err)}`;
    console.error(errorMsg, err);
    return { success: false, error: errorMsg };
  }
}

// 获取食堂的平均评分
export async function getCanteenRating(canteenId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("canteen_id", canteenId);

  if (error || !data || data.length === 0) {
    return null;
  }

  // 过滤有效评分（1-5分）
  const validRatings = data
    .map((item: any) => Number(item.rating))
    .filter(rating => rating >= 1 && rating <= 5);

  if (validRatings.length === 0) {
    return null;
  }

  // 计算平均分
  const average = validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
  return parseFloat(average.toFixed(1));
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

// 档口模拟数据
const mockStalls: Stall[] = [
  // 第一食堂档口
  {
    id: '1',
    canteen_id: '1',
    name: '川味炒菜',
    description: '提供正宗川菜，口味麻辣鲜香。',
    image_url: 'https://via.placeholder.com/300',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    canteen_id: '1',
    name: '主食窗口',
    description: '提供各种主食，包括米饭、面条等。',
    image_url: 'https://via.placeholder.com/300',
    created_at: new Date().toISOString()
  },
  // 第二食堂档口
  {
    id: '3',
    canteen_id: '2',
    name: '面食档',
    description: '提供各种面食，包括拉面、小面等。',
    image_url: 'https://via.placeholder.com/300',
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    canteen_id: '2',
    name: '小吃档',
    description: '提供各种传统小吃，包括煎饼果子、手抓饼等。',
    image_url: 'https://via.placeholder.com/300',
    created_at: new Date().toISOString()
  },
  // 第三食堂档口
  {
    id: '5',
    canteen_id: '3',
    name: '套餐档',
    description: '提供各种营养套餐，搭配合理。',
    image_url: 'https://via.placeholder.com/300',
    created_at: new Date().toISOString()
  },
  {
    id: '6',
    canteen_id: '3',
    name: '健康食品',
    description: '提供健康沙拉、水果等。',
    image_url: 'https://via.placeholder.com/300',
    created_at: new Date().toISOString()
  }
];

// 菜品模拟数据
const mockDishes: Dish[] = [
  // 第一食堂 - 川味炒菜档口
  {
    id: '1',
    canteen_id: '1',
    stall_id: '1',
    name: '宫保鸡丁',
    description: '经典川菜，鸡肉嫩滑，花生香脆，辣中带甜。',
    price: 12.00,
    image_url: 'https://via.placeholder.com/200',
    category: '炒菜',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    canteen_id: '1',
    stall_id: '1',
    name: '鱼香肉丝',
    description: '传统川菜，肉丝鲜嫩，木耳爽脆，酸甜可口。',
    price: 10.00,
    image_url: 'https://via.placeholder.com/200',
    category: '炒菜',
    created_at: new Date().toISOString()
  },
  // 第一食堂 - 主食窗口
  {
    id: '3',
    canteen_id: '1',
    stall_id: '2',
    name: '蛋炒饭',
    description: '经典主食，米饭粒粒分明，鸡蛋香嫩。',
    price: 8.00,
    image_url: 'https://via.placeholder.com/200',
    category: '主食',
    created_at: new Date().toISOString()
  },
  {
    id: '10',
    canteen_id: '1',
    stall_id: '2',
    name: '扬州炒饭',
    description: '传统名吃，配料丰富，口感多样。',
    price: 10.00,
    image_url: 'https://via.placeholder.com/200',
    category: '主食',
    created_at: new Date().toISOString()
  },
  // 第二食堂 - 面食档
  {
    id: '4',
    canteen_id: '2',
    stall_id: '3',
    name: '兰州拉面',
    description: '手工拉面，汤头浓郁，牛肉香烂。',
    price: 15.00,
    image_url: 'https://via.placeholder.com/200',
    category: '面食',
    created_at: new Date().toISOString()
  },
  {
    id: '5',
    canteen_id: '2',
    stall_id: '3',
    name: '重庆小面',
    description: '麻辣鲜香，面条劲道，配菜丰富。',
    price: 12.00,
    image_url: 'https://via.placeholder.com/200',
    category: '面食',
    created_at: new Date().toISOString()
  },
  // 第二食堂 - 小吃档
  {
    id: '6',
    canteen_id: '2',
    stall_id: '4',
    name: '煎饼果子',
    description: '传统小吃，薄饼酥脆，配料丰富。',
    price: 6.00,
    image_url: 'https://via.placeholder.com/200',
    category: '小吃',
    created_at: new Date().toISOString()
  },
  {
    id: '11',
    canteen_id: '2',
    stall_id: '4',
    name: '手抓饼',
    description: '酥脆可口，可加各种配料。',
    price: 5.00,
    image_url: 'https://via.placeholder.com/200',
    category: '小吃',
    created_at: new Date().toISOString()
  },
  // 第三食堂 - 套餐档
  {
    id: '7',
    canteen_id: '3',
    stall_id: '5',
    name: '套餐A',
    description: '一荤一素一汤，营养均衡。',
    price: 15.00,
    image_url: 'https://via.placeholder.com/200',
    category: '套餐',
    created_at: new Date().toISOString()
  },
  {
    id: '8',
    canteen_id: '3',
    stall_id: '5',
    name: '套餐B',
    description: '两荤一素一汤，量大实惠。',
    price: 18.00,
    image_url: 'https://via.placeholder.com/200',
    category: '套餐',
    created_at: new Date().toISOString()
  },
  // 第三食堂 - 健康食品
  {
    id: '9',
    canteen_id: '3',
    stall_id: '6',
    name: '水果沙拉',
    description: '新鲜水果，健康营养。',
    price: 10.00,
    image_url: 'https://via.placeholder.com/200',
    category: '沙拉',
    created_at: new Date().toISOString()
  },
  {
    id: '12',
    canteen_id: '3',
    stall_id: '6',
    name: '蔬菜沙拉',
    description: '新鲜蔬菜，低脂健康。',
    price: 8.00,
    image_url: 'https://via.placeholder.com/200',
    category: '沙拉',
    created_at: new Date().toISOString()
  }
];

// 获取食堂的档口列表
export async function getCanteenStalls(canteenId: string): Promise<Stall[]> {
  // 模拟数据
  return mockStalls.filter(stall => stall.canteen_id === canteenId);
}

// 获取单个档口详情
export async function getStallById(id: string): Promise<Stall | null> {
  // 模拟数据
  return mockStalls.find(stall => stall.id === id) || null;
}

// 获取档口的菜品列表
export async function getStallDishes(stallId: string): Promise<Dish[]> {
  // 模拟数据
  return mockDishes.filter(dish => dish.stall_id === stallId);
}

// 获取食堂的菜品列表
export async function getCanteenDishes(canteenId: string): Promise<Dish[]> {
  // 模拟数据
  return mockDishes.filter(dish => dish.canteen_id === canteenId);
}

// 获取单个菜品详情
export async function getDishById(id: string): Promise<Dish | null> {
  // 模拟数据
  return mockDishes.find(dish => dish.id === id) || null;
}

// 获取菜品分类列表
export async function getDishCategories(canteenId: string): Promise<string[]> {
  // 模拟数据
  const canteenDishes = mockDishes.filter(dish => dish.canteen_id === canteenId);
  const categories = [...new Set(canteenDishes.map(dish => dish.category))];
  return categories;
}

// 按分类获取菜品
export async function getDishesByCategory(canteenId: string, category: string): Promise<Dish[]> {
  // 模拟数据
  return mockDishes.filter(dish => dish.canteen_id === canteenId && dish.category === category);
}
