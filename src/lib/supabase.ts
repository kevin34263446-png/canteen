import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

type StallKind =
  | "川湘小炒"
  | "面食档"
  | "小吃甜品"
  | "烧腊饭"
  | "麻辣烫"
  | "轻食西餐"
  | "早餐简餐"
  | "饮品"
  | "汤粉面";

const MOCK_STALL_ID_SEP = "__stall__";
const MOCK_DISH_ID_SEP = "__dish__";

const mockCache = {
  stallsByCanteen: new Map<string, Stall[]>(),
  dishesByCanteen: new Map<string, Dish[]>(),
};

function hashToUint32(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed: number): () => number {
  // mulberry32
  return function rng() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function sampleUnique<T>(rng: () => number, arr: T[], count: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function parseMockStallId(stallId: string): { canteenId: string; idx: number } | null {
  const sepIdx = stallId.lastIndexOf(MOCK_STALL_ID_SEP);
  if (sepIdx < 0) return null;
  const canteenId = stallId.slice(0, sepIdx);
  const idxStr = stallId.slice(sepIdx + MOCK_STALL_ID_SEP.length);
  const idx = Number(idxStr);
  if (!canteenId || !Number.isFinite(idx)) return null;
  return { canteenId, idx };
}

function generateStallsForCanteen(canteenId: string): (Stall & { kind: StallKind })[] {
  const rng = createRng(hashToUint32(`stalls:${canteenId}`));
  const kinds: StallKind[] = [
    "川湘小炒",
    "面食档",
    "小吃甜品",
    "烧腊饭",
    "麻辣烫",
    "轻食西餐",
    "早餐简餐",
    "饮品",
    "汤粉面",
  ];

  const stallCount = randInt(rng, 3, 6);
  const chosenKinds = sampleUnique(rng, kinds, stallCount);

  const nameByKind: Record<StallKind, string[]> = {
    川湘小炒: ["川湘小炒", "家常小炒", "川味现炒", "爆炒小馆"],
    面食档: ["面食档", "手工面馆", "拉面窗口", "刀削面"],
    小吃甜品: ["小吃甜品", "炸物小吃", "甜品站", "小食铺"],
    烧腊饭: ["烧腊饭", "港式烧腊", "叉烧烧鸭", "烧味饭"],
    麻辣烫: ["麻辣烫", "自选麻辣烫", "番茄麻辣烫", "清汤麻辣烫"],
    轻食西餐: ["轻食西餐", "意面轻食", "三明治沙拉", "低脂餐"],
    早餐简餐: ["早餐简餐", "早餐加盟", "包子豆浆", "早安食堂"],
    饮品: ["饮品", "奶茶果茶", "鲜榨饮品", "柠檬茶"],
    汤粉面: ["汤粉面", "米粉汤面", "砂锅粉", "酸辣粉"],
  };

  const descByKind: Record<StallKind, string[]> = {
    川湘小炒: ["现点现炒，锅气足。", "口味偏重，超级下饭。", "麻辣鲜香，回味十足。"],
    面食档: ["手工面条，汤头现熬。", "面条劲道，配料丰富。", "多种面型可选。"],
    小吃甜品: ["现炸现做，酥脆可口。", "下午茶首选，甜咸都有。", "小吃种类丰富。"],
    烧腊饭: ["叉烧烧鸭，秘制酱汁。", "肉香浓郁，配菜清爽。", "米饭香软，份量足。"],
    麻辣烫: ["自选菜品称重，汤底多选。", "麻辣鲜香，也可选不辣。", "蔬菜肉丸随心搭配。"],
    轻食西餐: ["低脂高蛋白，轻负担。", "沙拉意面三明治一应俱全。", "健康搭配，清爽不腻。"],
    早餐简餐: ["早餐供应，出餐快。", "包子粥粉面，搭配齐全。", "热腾腾更有元气。"],
    饮品: ["冷热皆可，甜度可调。", "果茶清爽，奶茶醇厚。", "解腻解渴。"],
    汤粉面: ["汤底鲜美，粉面顺滑。", "酸辣开胃，暖心暖胃。", "加料自由。"],
  };

  const now = new Date().toISOString();

  return chosenKinds.map((kind, i) => {
    const name = pick(rng, nameByKind[kind]);
    const description = pick(rng, descByKind[kind]);
    return {
      id: `${canteenId}${MOCK_STALL_ID_SEP}${i + 1}`,
      canteen_id: canteenId,
      name,
      description,
      image_url: null,
      created_at: now,
      kind,
    };
  });
}

function generateDishesForCanteen(canteenId: string, stalls: (Stall & { kind?: StallKind })[]): Dish[] {
  const rng = createRng(hashToUint32(`dishes:${canteenId}`));
  const now = new Date().toISOString();

  const pools: Record<StallKind, { names: string[]; categories: string[]; price: [number, number] }> = {
    川湘小炒: {
      names: ["宫保鸡丁", "鱼香肉丝", "麻婆豆腐", "回锅肉", "酸辣土豆丝", "青椒肉丝", "番茄炒蛋", "干锅花菜", "水煮牛肉", "酸菜鱼片"],
      categories: ["炒菜", "素菜", "汤品"],
      price: [8, 22],
    },
    面食档: {
      names: ["兰州拉面", "牛肉刀削面", "番茄牛腩面", "酸汤肥牛面", "炸酱面", "担担面", "红烧牛肉面", "排骨面", "馄饨面", "油泼面"],
      categories: ["面食"],
      price: [10, 26],
    },
    小吃甜品: {
      names: ["煎饼果子", "手抓饼", "鸡排", "炸串拼盘", "薯条", "章鱼小丸子", "烤冷面", "双皮奶", "杨枝甘露", "红豆冰"],
      categories: ["小吃", "甜品"],
      price: [5, 18],
    },
    烧腊饭: {
      names: ["叉烧饭", "烧鸭饭", "脆皮鸡饭", "双拼烧腊饭", "三拼烧腊饭", "蜜汁叉烧", "烧鸭腿饭", "豉油鸡饭"],
      categories: ["盖饭"],
      price: [16, 32],
    },
    麻辣烫: {
      names: ["经典麻辣烫", "番茄麻辣烫", "清汤麻辣烫", "酸辣麻辣烫", "干拌麻辣香锅", "麻辣香锅"],
      categories: ["麻辣烫"],
      price: [12, 28],
    },
    轻食西餐: {
      names: ["鸡胸肉凯撒沙拉", "金枪鱼沙拉", "牛油果三明治", "烤鸡腿轻食碗", "黑胡椒牛肉意面", "奶油蘑菇意面", "照烧鸡肉饭", "烤蔬菜拼盘"],
      categories: ["轻食", "西餐"],
      price: [16, 36],
    },
    早餐简餐: {
      names: ["豆浆油条", "皮蛋瘦肉粥", "小笼包", "肉包", "煎蛋三明治", "牛肉粉", "鸡蛋灌饼", "紫菜蛋花汤"],
      categories: ["早餐", "主食", "汤品"],
      price: [4, 16],
    },
    饮品: {
      names: ["冰豆浆", "柠檬茶", "珍珠奶茶", "椰奶咖啡", "葡萄气泡水", "芒果冰沙", "红茶拿铁", "乌龙茶"],
      categories: ["饮品"],
      price: [4, 18],
    },
    汤粉面: {
      names: ["酸辣粉", "砂锅米线", "螺蛳粉", "重庆小面", "牛肉米粉", "排骨米粉", "番茄米线", "肥肠粉"],
      categories: ["粉面"],
      price: [10, 26],
    },
  };

  const dishes: Dish[] = [];
  stalls.forEach((stall, stallIndex) => {
    const parsed = parseMockStallId(stall.id);
    const kind = (stall as any).kind as StallKind | undefined;
    const resolvedKind: StallKind = kind || "面食档";

    const pool = pools[resolvedKind];
    const count = randInt(rng, 5, 10);
    const pickedNames = sampleUnique(rng, pool.names, count);

    pickedNames.forEach((dishName, j) => {
      const category = pick(rng, pool.categories);
      const price = randInt(rng, pool.price[0], pool.price[1]) + (rng() < 0.3 ? 0.5 : 0);
      dishes.push({
        id: `${canteenId}${MOCK_DISH_ID_SEP}${stallIndex + 1}_${j + 1}`,
        canteen_id: canteenId,
        stall_id: stall.id,
        name: dishName,
        description: `推荐：${dishName}，口感更佳。`,
        price: Number(price.toFixed(2)),
        image_url: null,
        category,
        created_at: now,
      });
    });
  });

  return dishes;
}

function getGeneratedMockStallsForCanteen(canteenId: string): Stall[] {
  const cached = mockCache.stallsByCanteen.get(canteenId);
  if (cached) return cached;
  const generated = generateStallsForCanteen(canteenId).map(({ kind, ...stall }) => stall);
  mockCache.stallsByCanteen.set(canteenId, generated);
  return generated;
}

function getGeneratedMockDishesForCanteen(canteenId: string): Dish[] {
  const cached = mockCache.dishesByCanteen.get(canteenId);
  if (cached) return cached;
  const stallsWithKind = generateStallsForCanteen(canteenId);
  const generated = generateDishesForCanteen(canteenId, stallsWithKind);
  mockCache.stallsByCanteen.set(canteenId, stallsWithKind.map(({ kind, ...stall }) => stall));
  mockCache.dishesByCanteen.set(canteenId, generated);
  return generated;
}

function getMockStallsForCanteen(canteenId: string): Stall[] {
  const exact = mockStalls.filter((stall) => stall.canteen_id === canteenId);
  if (exact.length > 0) return exact;
  return getGeneratedMockStallsForCanteen(canteenId);
}

function getMockDishesForCanteen(canteenId: string, stallIdMap: Map<string, string>): Dish[] {
  const exact = mockDishes.filter((dish) => dish.canteen_id === canteenId);
  if (exact.length > 0) return exact;

  // 生成的 mock 已经使用“真实的 stall.id”，这里不再需要 stallIdMap；
  // 但为了兼容旧逻辑，如果传了映射仍然做一次替换（比如你已有旧的 mock 数据）
  const generated = getGeneratedMockDishesForCanteen(canteenId);
  if (stallIdMap.size === 0) return generated;
  return generated.map((dish) => ({
    ...dish,
    stall_id: stallIdMap.get(dish.stall_id) || dish.stall_id,
  }));
}

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
  is_anonymous: boolean;
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

export function getCanteenDisplayName(canteenId: string, baseName?: string | null): string {
  const stallsWithKind = generateStallsForCanteen(canteenId);
  const kinds = stallsWithKind.map((s) => s.kind);

  const labelByKind: Record<StallKind, string> = {
    川湘小炒: "川湘小炒",
    面食档: "面食",
    小吃甜品: "小吃甜品",
    烧腊饭: "烧腊",
    麻辣烫: "麻辣烫",
    轻食西餐: "轻食西餐",
    早餐简餐: "早餐",
    饮品: "饮品",
    汤粉面: "粉面",
  };

  const uniqueLabels: string[] = [];
  for (const k of kinds) {
    const label = labelByKind[k];
    if (!uniqueLabels.includes(label)) uniqueLabels.push(label);
  }
  const picked = uniqueLabels.slice(0, 2);

  const fallbackBase = baseName && baseName.trim() ? baseName.trim() : "食堂";
  if (picked.length === 0) return fallbackBase;
  return `${fallbackBase}·${picked.join("/")}`;
}

// 用户类型定义
export type User = {
  id: string;
  email: string;
  name: string;
  user_type: string;
  student_id: string;
  is_admin?: boolean;
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
  is_anonymous: boolean;
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

export async function uploadDishImage(params: {
  file: File;
  canteenId: string;
  stallId: string;
}): Promise<string> {
  const { file, canteenId, stallId } = params;

  if (!hasSupabaseConfig) {
    throw new Error("未配置 Supabase，无法上传图片");
  }

  const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeExt = /^[a-z0-9]+$/.test(fileExt) ? fileExt : "jpg";
  const objectName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`;
  const path = `canteens/${canteenId}/stalls/${stallId}/${objectName}`;

  const bucket = "dish-images";
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
    cacheControl: "3600",
  });

  if (uploadError) {
    throw new Error(`图片上传失败：${uploadError.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("获取图片地址失败");
  }

  return data.publicUrl;
}

export async function createDish(data: {
  canteen_id: string;
  stall_id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  category: string;
}): Promise<Dish | null> {
  if (!hasSupabaseConfig) {
    throw new Error("未配置 Supabase，无法新增菜品");
  }

  const { data: created, error } = await supabase
    .from("dishes")
    .insert({
      canteen_id: data.canteen_id,
      stall_id: data.stall_id,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      image_url: data.image_url ?? null,
      category: data.category,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`新增菜品失败：${error.message}`);
  }

  return (created as Dish) || null;
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

    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email,
        password: hashedPassword,
        name,
        user_type: userType,
        student_id: studentId,
      })
      .select("id, email, name, user_type, student_id, is_admin, created_at, updated_at")
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
      .select("id, email, name, user_type, student_id, password, is_admin, created_at, updated_at")
      .eq("email", email)
      .eq("user_type", userType)
      .single();

    if (error || !user) {
      return {
        user: null,
        token: null,
        error: "邮箱或密码错误",
      };
    }

    // 兼容旧密码：先尝试 bcrypt 验证，失败则直接比较明文（临时方案）
    let passwordMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      passwordMatch = password === user.password;
      // 如果是明文密码，登录成功后自动更新为加密密码
      if (passwordMatch) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await supabase
          .from("users")
          .update({ password: hashedPassword })
          .eq("id", user.id);
      }
    }

    if (!passwordMatch) {
      return {
        user: null,
        token: null,
        error: "邮箱或密码错误",
      };
    }

    // 生成简单的 token
    const token = btoa(JSON.stringify({ userId: user.id }));

    return {
      user: { ...user, password: undefined },
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
    .select("id, email, name, user_type, student_id, is_admin, created_at, updated_at")
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
    image_url: null,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    canteen_id: '1',
    name: '主食窗口',
    description: '提供各种主食，包括米饭、面条等。',
    image_url: null,
    created_at: new Date().toISOString()
  },
  {
    id: '7',
    canteen_id: '1',
    name: '麻辣烫',
    description: '自选菜品，麻辣鲜香，汤底多选。',
    image_url: null,
    created_at: new Date().toISOString()
  },
  // 第二食堂档口
  {
    id: '3',
    canteen_id: '2',
    name: '面食档',
    description: '提供各种面食，包括拉面、小面等。',
    image_url: null,
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    canteen_id: '2',
    name: '小吃档',
    description: '提供各种传统小吃，包括煎饼果子、手抓饼等。',
    image_url: null,
    created_at: new Date().toISOString()
  },
  {
    id: '8',
    canteen_id: '2',
    name: '烧腊饭',
    description: '叉烧、烧鸭、脆皮鸡，搭配秘制酱汁。',
    image_url: null,
    created_at: new Date().toISOString()
  },
  // 第三食堂档口
  {
    id: '5',
    canteen_id: '3',
    name: '套餐档',
    description: '提供各种营养套餐，搭配合理。',
    image_url: null,
    created_at: new Date().toISOString()
  },
  {
    id: '6',
    canteen_id: '3',
    name: '健康食品',
    description: '提供健康沙拉、水果等。',
    image_url: null,
    created_at: new Date().toISOString()
  },
  {
    id: '9',
    canteen_id: '3',
    name: '轻食西餐',
    description: '意面、三明治、烤鸡胸，低脂高蛋白。',
    image_url: null,
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
    image_url: null,
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
    image_url: null,
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
    image_url: null,
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
    image_url: null,
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
    image_url: null,
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
    image_url: null,
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
    image_url: null,
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
    image_url: null,
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
    image_url: null,
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
    image_url: null,
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
    image_url: null,
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
    image_url: null,
    category: '沙拉',
    created_at: new Date().toISOString()
  },

  // 更多示例（作为模板：会被复制到任意食堂）
  // 第一食堂 - 川味炒菜档口（stall_id: '1'）
  {
    id: '13',
    canteen_id: '1',
    stall_id: '1',
    name: '麻婆豆腐',
    description: '麻辣鲜香，豆腐嫩滑，下饭首选。',
    price: 9.00,
    image_url: null,
    category: '炒菜',
    created_at: new Date().toISOString()
  },
  {
    id: '14',
    canteen_id: '1',
    stall_id: '1',
    name: '回锅肉',
    description: '肥而不腻，酱香浓郁，搭配青蒜更香。',
    price: 14.00,
    image_url: null,
    category: '炒菜',
    created_at: new Date().toISOString()
  },
  {
    id: '15',
    canteen_id: '1',
    stall_id: '1',
    name: '酸辣土豆丝',
    description: '酸辣开胃，爽脆可口。',
    price: 7.00,
    image_url: null,
    category: '素菜',
    created_at: new Date().toISOString()
  },
  {
    id: '16',
    canteen_id: '1',
    stall_id: '1',
    name: '番茄鸡蛋汤',
    description: '家常经典，酸甜清爽。',
    price: 6.00,
    image_url: null,
    category: '汤品',
    created_at: new Date().toISOString()
  },

  // 第一食堂 - 主食窗口（stall_id: '2'）
  {
    id: '17',
    canteen_id: '1',
    stall_id: '2',
    name: '牛肉盖饭',
    description: '牛肉量足，酱汁浓郁，配菜丰富。',
    price: 16.00,
    image_url: null,
    category: '主食',
    created_at: new Date().toISOString()
  },
  {
    id: '18',
    canteen_id: '1',
    stall_id: '2',
    name: '番茄牛腩面',
    description: '酸甜汤底，牛腩软烂，面条筋道。',
    price: 18.00,
    image_url: null,
    category: '面食',
    created_at: new Date().toISOString()
  },
  {
    id: '19',
    canteen_id: '1',
    stall_id: '2',
    name: '鲜肉馄饨',
    description: '皮薄馅大，汤鲜味美。',
    price: 12.00,
    image_url: null,
    category: '面食',
    created_at: new Date().toISOString()
  },
  {
    id: '20',
    canteen_id: '1',
    stall_id: '2',
    name: '冰豆浆',
    description: '清爽解腻，搭配早餐更合适。',
    price: 4.00,
    image_url: null,
    category: '饮品',
    created_at: new Date().toISOString()
  },

  // 第一食堂 - 麻辣烫（stall_id: '7'）
  {
    id: '21',
    canteen_id: '1',
    stall_id: '7',
    name: '经典麻辣烫',
    description: '经典红汤，麻辣鲜香，自选菜品称重。',
    price: 15.00,
    image_url: null,
    category: '麻辣烫',
    created_at: new Date().toISOString()
  },
  {
    id: '22',
    canteen_id: '1',
    stall_id: '7',
    name: '番茄麻辣烫',
    description: '番茄汤底，酸甜开胃，适合不太能吃辣的人。',
    price: 16.00,
    image_url: null,
    category: '麻辣烫',
    created_at: new Date().toISOString()
  },

  // 第二食堂 - 面食档（stall_id: '3'）
  {
    id: '23',
    canteen_id: '2',
    stall_id: '3',
    name: '牛肉刀削面',
    description: '刀削面劲道，牛肉香烂，汤头浓郁。',
    price: 18.00,
    image_url: null,
    category: '面食',
    created_at: new Date().toISOString()
  },
  {
    id: '24',
    canteen_id: '2',
    stall_id: '3',
    name: '酸汤肥牛面',
    description: '酸汤开胃，肥牛滑嫩，配菜丰富。',
    price: 20.00,
    image_url: null,
    category: '面食',
    created_at: new Date().toISOString()
  },

  // 第二食堂 - 烧腊饭（stall_id: '8'）
  {
    id: '25',
    canteen_id: '2',
    stall_id: '8',
    name: '叉烧饭',
    description: '蜜汁叉烧，肥瘦相间，酱香浓郁。',
    price: 22.00,
    image_url: null,
    category: '盖饭',
    created_at: new Date().toISOString()
  },
  {
    id: '26',
    canteen_id: '2',
    stall_id: '8',
    name: '烧鸭饭',
    description: '皮脆肉嫩，搭配烧腊汁更香。',
    price: 24.00,
    image_url: null,
    category: '盖饭',
    created_at: new Date().toISOString()
  },

  // 第三食堂 - 套餐档（stall_id: '5'）
  {
    id: '27',
    canteen_id: '3',
    stall_id: '5',
    name: '鸡腿套餐',
    description: '烤鸡腿+时蔬+米饭，能量满满。',
    price: 21.00,
    image_url: null,
    category: '套餐',
    created_at: new Date().toISOString()
  },
  {
    id: '28',
    canteen_id: '3',
    stall_id: '5',
    name: '低脂牛肉套餐',
    description: '牛肉+西兰花+玉米，适合健身人群。',
    price: 26.00,
    image_url: null,
    category: '套餐',
    created_at: new Date().toISOString()
  },

  // 第三食堂 - 轻食西餐（stall_id: '9'）
  {
    id: '29',
    canteen_id: '3',
    stall_id: '9',
    name: '鸡胸肉凯撒沙拉',
    description: '鸡胸肉+生菜+帕玛森，饱腹不负担。',
    price: 19.00,
    image_url: null,
    category: '轻食',
    created_at: new Date().toISOString()
  },
  {
    id: '30',
    canteen_id: '3',
    stall_id: '9',
    name: '黑胡椒牛肉意面',
    description: '黑胡椒香气浓郁，意面弹牙。',
    price: 28.00,
    image_url: null,
    category: '西餐',
    created_at: new Date().toISOString()
  }
];

// 获取食堂的档口列表
export async function getCanteenStalls(canteenId: string): Promise<Stall[]> {
  if (!hasSupabaseConfig) {
    return getMockStallsForCanteen(canteenId);
  }

  try {
    const { data, error } = await supabase
      .from("stalls")
      .select("*")
      .eq("canteen_id", canteenId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("获取档口数据失败:", error);
      return getMockStallsForCanteen(canteenId);
    }

    return (data as Stall[]) || [];
  } catch (err) {
    console.error("获取档口数据出错:", err);
    return getMockStallsForCanteen(canteenId);
  }
}

// 获取单个档口详情
export async function getStallById(id: string): Promise<Stall | null> {
  if (!hasSupabaseConfig) {
    const parsed = parseMockStallId(id);
    if (parsed) {
      const stalls = getMockStallsForCanteen(parsed.canteenId);
      return stalls.find((s) => s.id === id) || null;
    }
    return mockStalls.find((stall) => stall.id === id) || null;
  }

  try {
    const { data, error } = await supabase
      .from("stalls")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("获取档口详情失败:", error);
      const parsed = parseMockStallId(id);
      if (parsed) {
        const stalls = getMockStallsForCanteen(parsed.canteenId);
        return stalls.find((s) => s.id === id) || null;
      }
      return mockStalls.find((stall) => stall.id === id) || null;
    }

    return (data as Stall) || null;
  } catch (err) {
    console.error("获取档口详情出错:", err);
    const parsed = parseMockStallId(id);
    if (parsed) {
      const stalls = getMockStallsForCanteen(parsed.canteenId);
      return stalls.find((s) => s.id === id) || null;
    }
    return mockStalls.find((stall) => stall.id === id) || null;
  }
}

// 获取档口的菜品列表
export async function getStallDishes(stallId: string): Promise<Dish[]> {
  if (!hasSupabaseConfig) {
    const parsed = parseMockStallId(stallId);
    if (parsed) {
      return getGeneratedMockDishesForCanteen(parsed.canteenId).filter((d) => d.stall_id === stallId);
    }
    return mockDishes.filter((dish) => dish.stall_id === stallId);
  }

  try {
    const { data, error } = await supabase
      .from("dishes")
      .select("*")
      .eq("stall_id", stallId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("获取档口菜品失败:", error);
      const parsed = parseMockStallId(stallId);
      if (parsed) {
        return getGeneratedMockDishesForCanteen(parsed.canteenId).filter((d) => d.stall_id === stallId);
      }
      return mockDishes.filter((dish) => dish.stall_id === stallId);
    }

    if (!data || data.length === 0) {
      const parsed = parseMockStallId(stallId);
      if (parsed) {
        return getGeneratedMockDishesForCanteen(parsed.canteenId).filter((d) => d.stall_id === stallId);
      }
      return mockDishes.filter((dish) => dish.stall_id === stallId);
    }

    return (data as Dish[]) || [];
  } catch (err) {
    console.error("获取档口菜品出错:", err);
    const parsed = parseMockStallId(stallId);
    if (parsed) {
      return getGeneratedMockDishesForCanteen(parsed.canteenId).filter((d) => d.stall_id === stallId);
    }
    return mockDishes.filter((dish) => dish.stall_id === stallId);
  }
}

// 获取食堂的菜品列表
export async function getCanteenDishes(canteenId: string): Promise<Dish[]> {
  if (!hasSupabaseConfig) {
    return getMockDishesForCanteen(canteenId, new Map());
  }

  try {
    const { data, error } = await supabase
      .from("dishes")
      .select("*")
      .eq("canteen_id", canteenId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("获取食堂菜品失败:", error);
      return getMockDishesForCanteen(canteenId, new Map());
    }

    if (!data || data.length === 0) {
      return getMockDishesForCanteen(canteenId, new Map());
    }

    return (data as Dish[]) || [];
  } catch (err) {
    console.error("获取食堂菜品出错:", err);
    return getMockDishesForCanteen(canteenId, new Map());
  }
}

// 获取单个菜品详情
export async function getDishById(id: string): Promise<Dish | null> {
  if (!hasSupabaseConfig) {
    const sepIdx = id.lastIndexOf(MOCK_DISH_ID_SEP);
    if (sepIdx > 0) {
      const canteenId = id.slice(0, sepIdx);
      const dishes = getGeneratedMockDishesForCanteen(canteenId);
      return dishes.find((d) => d.id === id) || null;
    }
    return mockDishes.find((dish) => dish.id === id) || null;
  }

  try {
    const { data, error } = await supabase
      .from("dishes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("获取菜品详情失败:", error);
      const sepIdx = id.lastIndexOf(MOCK_DISH_ID_SEP);
      if (sepIdx > 0) {
        const canteenId = id.slice(0, sepIdx);
        const dishes = getGeneratedMockDishesForCanteen(canteenId);
        return dishes.find((d) => d.id === id) || null;
      }
      return mockDishes.find((dish) => dish.id === id) || null;
    }

    return (data as Dish) || null;
  } catch (err) {
    console.error("获取菜品详情出错:", err);
    const sepIdx = id.lastIndexOf(MOCK_DISH_ID_SEP);
    if (sepIdx > 0) {
      const canteenId = id.slice(0, sepIdx);
      const dishes = getGeneratedMockDishesForCanteen(canteenId);
      return dishes.find((d) => d.id === id) || null;
    }
    return mockDishes.find((dish) => dish.id === id) || null;
  }
}

// 获取菜品分类列表
export async function getDishCategories(canteenId: string): Promise<string[]> {
  if (!hasSupabaseConfig) {
    const canteenDishes = mockDishes.filter((dish) => dish.canteen_id === canteenId);
    if (canteenDishes.length > 0) return [...new Set(canteenDishes.map((dish) => dish.category))];
    const generated = getGeneratedMockDishesForCanteen(canteenId);
    return [...new Set(generated.map((dish) => dish.category))];
  }

  try {
    const { data, error } = await supabase
      .from("dishes")
      .select("category")
      .eq("canteen_id", canteenId);

    if (error) {
      console.error("获取菜品分类失败:", error);
      const canteenDishes = mockDishes.filter((dish) => dish.canteen_id === canteenId);
      if (canteenDishes.length > 0) return [...new Set(canteenDishes.map((dish) => dish.category))];
      const generated = getGeneratedMockDishesForCanteen(canteenId);
      return [...new Set(generated.map((dish) => dish.category))];
    }

    if (!data || data.length === 0) {
      const canteenDishes = getGeneratedMockDishesForCanteen(canteenId);
      return [...new Set(canteenDishes.map((dish) => dish.category))];
    }

    const categories = (data || [])
      .map((row: any) => row.category)
      .filter((c: any) => typeof c === "string" && c.trim() !== "");

    return [...new Set(categories)];
  } catch (err) {
    console.error("获取菜品分类出错:", err);
    const canteenDishes = mockDishes.filter((dish) => dish.canteen_id === canteenId);
    return [...new Set(canteenDishes.map((dish) => dish.category))];
  }
}

// 按分类获取菜品
export async function getDishesByCategory(canteenId: string, category: string): Promise<Dish[]> {
  if (!hasSupabaseConfig) {
    return mockDishes.filter((dish) => dish.canteen_id === canteenId && dish.category === category);
  }

  try {
    const { data, error } = await supabase
      .from("dishes")
      .select("*")
      .eq("canteen_id", canteenId)
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("按分类获取菜品失败:", error);
      return mockDishes.filter((dish) => dish.canteen_id === canteenId && dish.category === category);
    }

    return (data as Dish[]) || [];
  } catch (err) {
    console.error("按分类获取菜品出错:", err);
    return mockDishes.filter((dish) => dish.canteen_id === canteenId && dish.category === category);
  }
}

// 修改密码
export async function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("password")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return { success: false, error: "用户不存在" };
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return { success: false, error: "原密码错误" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: "修改密码失败" };
  }
}

// 重置密码
export async function resetPassword(email: string, newPassword: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("email", email);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: "重置密码失败" };
  }
}

// 根据邮箱获取用户
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, user_type, student_id, is_admin, created_at, updated_at")
    .eq("email", email)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// 获取所有用户
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, user_type, student_id, is_admin, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("获取用户列表失败:", error);
    return [];
  }

  return data || [];
}

// 设置用户为管理员
export async function setAdmin(userId: string, isAdmin: boolean): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from("users")
      .update({ is_admin: isAdmin })
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: "设置失败" };
  }
}

// 管理员重置用户密码
export async function adminResetPassword(userId: string, newPassword: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: "重置密码失败" };
  }
}

// 删除用户
export async function deleteUser(userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: "删除用户失败" };
  }
}

// 获取所有菜品（管理员）
export async function getAllDishes(): Promise<Dish[]> {
  if (!hasSupabaseConfig) {
    return mockDishes;
  }

  try {
    const { data, error } = await supabase
      .from("dishes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("获取所有菜品失败:", error);
      return mockDishes;
    }

    return (data as Dish[]) || [];
  } catch (err) {
    console.error("获取所有菜品出错:", err);
    return mockDishes;
  }
}

// 添加菜品
export async function addDish(dish: Omit<Dish, "id" | "created_at">): Promise<{ success: boolean; error: string | null; dish?: Dish }> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("dishes")
      .insert({
        ...dish,
        created_at: now
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null, dish: data as Dish };
  } catch (error) {
    return { success: false, error: "添加菜品失败" };
  }
}

// 更新菜品
export async function updateDish(dishId: string, updates: Partial<Omit<Dish, "id" | "created_at">>): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from("dishes")
      .update(updates)
      .eq("id", dishId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: "更新菜品失败" };
  }
}

// 删除菜品
export async function deleteDish(dishId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from("dishes")
      .delete()
      .eq("id", dishId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: "删除菜品失败" };
  }
}

// 回复评价
export async function replyToReview(reviewId: string, reply: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from("reviews")
      .update({ reply: reply })
      .eq("id", reviewId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: "回复评价失败" };
  }
}

// 删除评价
export async function deleteReview(reviewId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: "删除评价失败" };
  }
}
