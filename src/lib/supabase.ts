import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

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
        is_time_limited: false,
        is_spicy: 0,
        student_discount: 0,
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
  
  // 标准化 canteenId 格式
  const normalizedCanteenId = canteenId.startsWith('canteen-') ? canteenId : `canteen-${canteenId}`;
  
  // 根据食堂ID返回对应的档口
  switch (normalizedCanteenId) {
    case "canteen-1": // 学一·启航
      return [
        {
          id: "canteen-1__stall__1",
          canteen_id: "canteen-1",
          name: "大众快餐",
          description: "提供经济实惠的快餐套餐",
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-1__stall__2",
          canteen_id: "canteen-1",
          name: "包子/粥铺",
          description: "提供各种包子和粥品",
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-1__stall__3",
          canteen_id: "canteen-1",
          name: "精品小炒",
          description: "提供现炒的精品菜肴",
          image_url: null,
          created_at: new Date().toISOString()
        }
      ];
    case "canteen-2": // 学二·银河
      return [
        {
          id: "canteen-2__stall__1",
          canteen_id: "canteen-2",
          name: "麻辣香锅/干锅",
          description: "提供麻辣香锅和干锅系列",
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-2__stall__2",
          canteen_id: "canteen-2",
          name: "西北面馆",
          description: "提供各种面食",
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-2__stall__3",
          canteen_id: "canteen-2",
          name: "地道淮扬",
          description: "提供淮扬特色菜肴",
          image_url: null,
          created_at: new Date().toISOString()
        }
      ];
    case "canteen-3": // 学三·极光
      return [
        {
          id: "canteen-3__stall__1",
          canteen_id: "canteen-3",
          name: "黄焖鸡/石锅饭",
          description: "提供黄焖鸡和石锅饭",
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-3__stall__2",
          canteen_id: "canteen-3",
          name: "轻食沙拉",
          description: "提供健康轻食和沙拉",
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-3__stall__3",
          canteen_id: "canteen-3",
          name: "西式简餐",
          description: "提供西式简餐",
          image_url: null,
          created_at: new Date().toISOString()
        }
      ];
    case "canteen-4": // 学四·繁星
      return [
        {
          id: "canteen-4__stall__1",
          canteen_id: "canteen-4",
          name: "螺蛳粉/酸辣粉",
          description: "提供螺蛳粉和酸辣粉",
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-4__stall__2",
          canteen_id: "canteen-4",
          name: "炸鸡烧烤",
          description: "提供炸鸡和烧烤",
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-4__stall__3",
          canteen_id: "canteen-4",
          name: "奶茶甜品",
          description: "提供奶茶和甜品",
          image_url: null,
          created_at: new Date().toISOString()
        }
      ];
    default:
      return getGeneratedMockStallsForCanteen(canteenId);
  }
}

function getMockDishesForCanteen(canteenId: string, stallIdMap: Map<string, string>): Dish[] {
  const exact = mockDishes.filter((dish) => dish.canteen_id === canteenId);
  if (exact.length > 0) return exact;

  // 处理不同格式的食堂ID
  const normalizedCanteenId = canteenId.startsWith('canteen-') ? canteenId : `canteen-${canteenId}`;

  // 根据食堂ID返回对应的菜品
  let dishes: Dish[] = [];
  
  switch (normalizedCanteenId) {
    case "canteen-1": // 学一·启航
      dishes = [
        // 大众快餐
        {
          id: "canteen-1__dish__1",
          canteen_id: "canteen-1",
          stall_id: "canteen-1__stall__1",
          name: "宫保鸡丁套餐",
          description: "经典宫保鸡丁配米饭",
          price: 12.00,
          image_url: null,
          category: "快餐",
          is_time_limited: false,
          is_spicy: 2,
          student_discount: 1.00,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-1__dish__2",
          canteen_id: "canteen-1",
          stall_id: "canteen-1__stall__1",
          name: "鱼香肉丝套餐",
          description: "鱼香肉丝配米饭",
          price: 11.00,
          image_url: null,
          category: "快餐",
          is_time_limited: false,
          is_spicy: 2,
          student_discount: 1.00,
          created_at: new Date().toISOString()
        },
        // 包子/粥铺
        {
          id: "canteen-1__dish__3",
          canteen_id: "canteen-1",
          stall_id: "canteen-1__stall__2",
          name: "肉包子",
          description: "鲜香多汁的肉包子",
          price: 2.00,
          image_url: null,
          category: "早餐",
          is_time_limited: true,
          is_spicy: 0,
          student_discount: 0.20,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-1__dish__4",
          canteen_id: "canteen-1",
          stall_id: "canteen-1__stall__2",
          name: "小米粥",
          description: "营养健康的小米粥",
          price: 1.50,
          image_url: null,
          category: "早餐",
          is_time_limited: true,
          is_spicy: 0,
          student_discount: 0.10,
          created_at: new Date().toISOString()
        },
        // 精品小炒
        {
          id: "canteen-1__dish__5",
          canteen_id: "canteen-1",
          stall_id: "canteen-1__stall__3",
          name: "红烧肉",
          description: "肥而不腻的红烧肉",
          price: 18.00,
          image_url: null,
          category: "小炒",
          is_time_limited: false,
          is_spicy: 1,
          student_discount: 2.00,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-1__dish__6",
          canteen_id: "canteen-1",
          stall_id: "canteen-1__stall__3",
          name: "清蒸鱼",
          description: "新鲜美味的清蒸鱼",
          price: 22.00,
          image_url: null,
          category: "小炒",
          is_time_limited: false,
          is_spicy: 0,
          student_discount: 2.00,
          created_at: new Date().toISOString()
        }
      ];
      break;
    case "canteen-2": // 学二·银河
      dishes = [
        // 麻辣香锅/干锅
        {
          id: "canteen-2__dish__1",
          canteen_id: "canteen-2",
          stall_id: "canteen-2__stall__1",
          name: "麻辣香锅",
          description: "自选食材的麻辣香锅",
          price: 15.00,
          image_url: null,
          category: "香锅",
          is_time_limited: false,
          is_spicy: 3,
          student_discount: 1.50,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-2__dish__2",
          canteen_id: "canteen-2",
          stall_id: "canteen-2__stall__1",
          name: "干锅排骨",
          description: "香喷喷的干锅排骨",
          price: 28.00,
          image_url: null,
          category: "干锅",
          is_time_limited: false,
          is_spicy: 2,
          student_discount: 2.00,
          created_at: new Date().toISOString()
        },
        // 西北面馆
        {
          id: "canteen-2__dish__3",
          canteen_id: "canteen-2",
          stall_id: "canteen-2__stall__2",
          name: "兰州拉面",
          description: "正宗兰州拉面",
          price: 10.00,
          image_url: null,
          category: "面食",
          is_time_limited: false,
          is_spicy: 1,
          student_discount: 1.00,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-2__dish__4",
          canteen_id: "canteen-2",
          stall_id: "canteen-2__stall__2",
          name: "刀削面",
          description: "手工刀削面",
          price: 12.00,
          image_url: null,
          category: "面食",
          is_time_limited: false,
          is_spicy: 1,
          student_discount: 1.00,
          created_at: new Date().toISOString()
        },
        // 地道淮扬
        {
          id: "canteen-2__dish__5",
          canteen_id: "canteen-2",
          stall_id: "canteen-2__stall__3",
          name: "扬州炒饭",
          description: "正宗扬州炒饭",
          price: 15.00,
          image_url: null,
          category: "淮扬菜",
          is_time_limited: false,
          is_spicy: 0,
          student_discount: 1.00,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-2__dish__6",
          canteen_id: "canteen-2",
          stall_id: "canteen-2__stall__3",
          name: "松鼠桂鱼",
          description: "经典淮扬菜松鼠桂鱼",
          price: 38.00,
          image_url: null,
          category: "淮扬菜",
          is_time_limited: false,
          is_spicy: 0,
          student_discount: 3.00,
          created_at: new Date().toISOString()
        }
      ];
      break;
    case "canteen-3": // 学三·极光
      dishes = [
        // 黄焖鸡/石锅饭
        {
          id: "canteen-3__dish__1",
          canteen_id: "canteen-3",
          stall_id: "canteen-3__stall__1",
          name: "黄焖鸡米饭",
          description: "香喷喷的黄焖鸡米饭",
          price: 16.00,
          image_url: null,
          category: "米饭",
          is_time_limited: false,
          is_spicy: 2,
          student_discount: 1.50,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-3__dish__2",
          canteen_id: "canteen-3",
          stall_id: "canteen-3__stall__1",
          name: "石锅拌饭",
          description: "韩国风味石锅拌饭",
          price: 18.00,
          image_url: null,
          category: "米饭",
          is_time_limited: false,
          is_spicy: 1,
          student_discount: 1.50,
          created_at: new Date().toISOString()
        },
        // 轻食沙拉
        {
          id: "canteen-3__dish__3",
          canteen_id: "canteen-3",
          stall_id: "canteen-3__stall__2",
          name: "减脂沙拉",
          description: "健康减脂沙拉",
          price: 20.00,
          image_url: null,
          category: "轻食",
          is_time_limited: false,
          is_spicy: 0,
          student_discount: 2.00,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-3__dish__4",
          canteen_id: "canteen-3",
          stall_id: "canteen-3__stall__2",
          name: "鸡胸肉沙拉",
          description: "高蛋白鸡胸肉沙拉",
          price: 22.00,
          image_url: null,
          category: "轻食",
          is_time_limited: false,
          is_spicy: 0,
          student_discount: 2.00,
          created_at: new Date().toISOString()
        },
        // 西式简餐
        {
          id: "canteen-3__dish__5",
          canteen_id: "canteen-3",
          stall_id: "canteen-3__stall__3",
          name: "汉堡套餐",
          description: "牛肉汉堡配薯条",
          price: 25.00,
          image_url: null,
          category: "西餐",
          is_time_limited: false,
          is_spicy: 0,
          student_discount: 2.00,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-3__dish__6",
          canteen_id: "canteen-3",
          stall_id: "canteen-3__stall__3",
          name: "意面",
          description: "经典意大利面",
          price: 22.00,
          image_url: null,
          category: "西餐",
          is_time_limited: false,
          is_spicy: 1,
          student_discount: 2.00,
          created_at: new Date().toISOString()
        }
      ];
      break;
    case "canteen-4": // 学四·繁星
      dishes = [
        // 螺蛳粉/酸辣粉
        {
          id: "canteen-4__dish__1",
          canteen_id: "canteen-4",
          stall_id: "canteen-4__stall__1",
          name: "螺蛳粉",
          description: "正宗柳州螺蛳粉",
          price: 14.00,
          image_url: null,
          category: "粉面",
          is_time_limited: false,
          is_spicy: 3,
          student_discount: 1.00,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-4__dish__2",
          canteen_id: "canteen-4",
          stall_id: "canteen-4__stall__1",
          name: "酸辣粉",
          description: "酸辣可口的酸辣粉",
          price: 12.00,
          image_url: null,
          category: "粉面",
          is_time_limited: false,
          is_spicy: 2,
          student_discount: 1.00,
          created_at: new Date().toISOString()
        },
        // 炸鸡烧烤
        {
          id: "canteen-4__dish__3",
          canteen_id: "canteen-4",
          stall_id: "canteen-4__stall__2",
          name: "脆皮炸鸡",
          description: "外酥里嫩的脆皮炸鸡",
          price: 18.00,
          image_url: null,
          category: "小吃",
          is_time_limited: false,
          is_spicy: 1,
          student_discount: 1.50,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-4__dish__4",
          canteen_id: "canteen-4",
          stall_id: "canteen-4__stall__2",
          name: "烤串拼盘",
          description: "各种烤串拼盘",
          price: 25.00,
          image_url: null,
          category: "小吃",
          is_time_limited: false,
          is_spicy: 2,
          student_discount: 2.00,
          created_at: new Date().toISOString()
        },
        // 奶茶甜品
        {
          id: "canteen-4__dish__5",
          canteen_id: "canteen-4",
          stall_id: "canteen-4__stall__3",
          name: "珍珠奶茶",
          description: "经典珍珠奶茶",
          price: 12.00,
          image_url: null,
          category: "饮品",
          is_time_limited: false,
          is_spicy: 0,
          student_discount: 1.00,
          created_at: new Date().toISOString()
        },
        {
          id: "canteen-4__dish__6",
          canteen_id: "canteen-4",
          stall_id: "canteen-4__stall__3",
          name: "芒果布丁",
          description: "香甜可口的芒果布丁",
          price: 8.00,
          image_url: null,
          category: "甜品",
          is_time_limited: false,
          is_spicy: 0,
          student_discount: 0.50,
          created_at: new Date().toISOString()
        }
      ];
      break;
    default:
      // 生成默认菜品
      const generated = getGeneratedMockDishesForCanteen(canteenId);
      dishes = generated.map(dish => ({
        ...dish,
        is_time_limited: false,
        is_spicy: 0,
        student_discount: 0
      }));
  }

  // 为了兼容旧逻辑，如果传了映射仍然做一次替换
  if (stallIdMap.size > 0) {
    return dishes.map((dish) => ({
      ...dish,
      stall_id: stallIdMap.get(dish.stall_id) || dish.stall_id,
    }));
  }

  return dishes;
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

// 食堂评价类型定义
export type Review = {
  id: string;
  canteen_id: string;
  user_id: string;
  rating: number;
  content: string;
  user_name: string;
  is_anonymous: boolean;
  created_at: string;
  admin_reply?: string;
  replies?: ReviewReply[];
};

// 评论回复类型定义
export type ReviewReply = {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  user_name: string;
  is_anonymous: boolean;
  created_at: string;
};

// 菜品评价类型定义
export type DishReview = {
  id: string;
  dish_id: string;
  canteen_id: string;
  user_id: string;
  rating: number;
  content: string;
  user_name: string;
  is_anonymous: boolean;
  created_at: string;
  replies?: DishReviewReply[];
};

// 菜品评论回复类型定义
export type DishReviewReply = {
  id: string;
  dish_review_id: string;
  user_id: string;
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
  waitTime?: number;
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
  is_time_limited?: boolean;
  is_spicy?: number; // 0: 不辣, 1: 微辣, 2: 中辣, 3: 特辣
  student_discount?: number;
  created_at: string;
  tags?: string[];
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
  avatar_url?: string;
  is_admin?: boolean;
  height?: number;
  weight?: number;
  age?: number;
  gender?: 'male' | 'female';
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  created_at: string;
  updated_at: string;
};

// 认证响应类型
export type AuthResponse = {
  user: User | null;
  token: string | null;
  error: string | null;
};

// 模拟食堂数据
function getMockCanteens(): Canteen[] {
  return [
    {
      id: "canteen-1",
      name: "学一·启航",
      description: "主打基本伙，提供大众快餐、包子粥铺和精品小炒",
      location: "校园东区",
      image_url: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "canteen-2",
      name: "学二·银河",
      description: "主打地方特色，提供麻辣香锅、西北面馆和地道淮扬菜",
      location: "校园西区",
      image_url: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "canteen-3",
      name: "学三·极光",
      description: "主打精致健康，提供黄焖鸡、轻食沙拉和西式简餐",
      location: "校园南区",
      image_url: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "canteen-4",
      name: "学四·繁星",
      description: "主打小吃宵夜，提供螺蛳粉、炸鸡烧烤和奶茶甜品",
      location: "校园北区",
      image_url: null,
      created_at: new Date().toISOString(),
    },
  ];
}

// 获取所有食堂数据
export async function getCanteens(): Promise<Canteen[]> {
  // 优先从 Supabase 获取数据
  if (hasSupabaseConfig) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const { data, error } = await supabase
        .from("canteens")
        .select("*")
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (!error && data && data.length > 0) {
        return data;
      }
      
      if (error) {
        console.error("从 Supabase 获取食堂数据失败:", error.message);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("从 Supabase 获取食堂数据超时，使用模拟数据");
      } else {
        console.error("从 Supabase 获取食堂数据失败:", error.message);
      }
    }
  }
  
  // 如果 Supabase 没有数据或不可用，使用模拟数据
  console.log("使用模拟食堂数据");
  return getMockCanteens();
}

// 获取单个食堂详情
export async function getCanteenById(id: string): Promise<Canteen | null> {
  // 标准化 ID 格式
  const normalizedId = id.startsWith('canteen-') ? id : `canteen-${id}`;
  
  // 从模拟数据中查找
  const mockCanteens = getMockCanteens();
  const mockCanteen = mockCanteens.find(c => c.id === normalizedId || c.id === id);
  if (mockCanteen) {
    return mockCanteen;
  }
  
  // 如果 Supabase 配置存在，尝试从 Supabase 获取
  if (hasSupabaseConfig) {
    try {
      const { data, error } = await supabase
        .from("canteens")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        return data;
      }
    } catch (error) {
      console.error("从 Supabase 获取食堂数据失败:", error);
    }
  }
  
  // 如果都获取不到，返回基于ID的默认食堂
  const nameMap: Record<string, string> = {
    "canteen-1": "学一·启航",
    "canteen-2": "学二·银河",
    "canteen-3": "学三·极光",
    "canteen-4": "学四·繁星",
    "1": "学一·启航",
    "2": "学二·银河",
    "3": "学三·极光",
    "4": "学四·繁星",
  };
  
  return {
    id: normalizedId,
    name: nameMap[normalizedId] || nameMap[id] || `食堂 ${id}`,
    description: `食堂 ${id} 的描述`,
    location: "校园内",
    image_url: null,
    created_at: new Date().toISOString(),
  };
}

// 获取食堂的评价列表
export async function getCanteenReviews(canteenId?: string): Promise<Review[]> {
  if (!hasSupabaseConfig) {
    // 返回模拟评价数据
    const mockReviews: Review[] = [
      {
        id: "1",
        canteen_id: canteenId || "canteen-1",
        user_id: "1",
        rating: 5,
        content: "食堂环境整洁，菜品丰富，味道不错！",
        user_name: "张三",
        is_anonymous: false,
        created_at: new Date().toISOString(),
        replies: [
          {
            id: "1",
            review_id: "1",
            user_id: "2",
            content: "这个评论很有道理！",
            user_name: "李四",
            is_anonymous: false,
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: "2",
        canteen_id: canteenId || "canteen-2",
        user_id: "2",
        rating: 4,
        content: "菜品价格合理，服务态度好。",
        user_name: "李四",
        is_anonymous: false,
        created_at: new Date().toISOString(),
        replies: []
      }
    ];
    return mockReviews;
  }
  
  try {
    let query = supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (canteenId) {
      query = query.eq("canteen_id", canteenId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("获取评价列表失败:", error);
      // 返回模拟评价数据作为降级方案
      const mockReviews: Review[] = [
        {
          id: "1",
          canteen_id: canteenId || "canteen-1",
          user_id: "1",
          rating: 5,
          content: "食堂环境整洁，菜品丰富，味道不错！",
          user_name: "张三",
          is_anonymous: false,
          created_at: new Date().toISOString(),
          replies: [
            {
              id: "1",
              review_id: "1",
              user_id: "2",
              content: "这个评论很有道理！",
              user_name: "李四",
              is_anonymous: false,
              created_at: new Date().toISOString()
            }
          ]
        },
        {
          id: "2",
          canteen_id: canteenId || "canteen-2",
          user_id: "2",
          rating: 4,
          content: "菜品价格合理，服务态度好。",
          user_name: "李四",
          is_anonymous: false,
          created_at: new Date().toISOString(),
          replies: []
        }
      ];
      return mockReviews;
    }

    // 获取每个评论的回复
    if (data && data.length > 0) {
      const reviewsWithReplies = await Promise.all(
        data.map(async (review) => {
          const replies = await getReviewReplies(review.id);
          return { ...review, replies };
        })
      );
      return reviewsWithReplies;
    }

    return [];
  } catch (error) {
    console.error("获取评价列表出错:", error);
    // 返回模拟评价数据作为降级方案
    const mockReviews: Review[] = [
      {
        id: "1",
        canteen_id: canteenId || "canteen-1",
        user_id: "1",
        rating: 5,
        content: "食堂环境整洁，菜品丰富，味道不错！",
        user_name: "张三",
        is_anonymous: false,
        created_at: new Date().toISOString(),
        replies: [
          {
            id: "1",
            review_id: "1",
            user_id: "2",
            content: "这个评论很有道理！",
            user_name: "李四",
            is_anonymous: false,
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: "2",
        canteen_id: canteenId || "canteen-2",
        user_id: "2",
        rating: 4,
        content: "菜品价格合理，服务态度好。",
        user_name: "李四",
        is_anonymous: false,
        created_at: new Date().toISOString(),
        replies: []
      }
    ];
    return mockReviews;
  }
}

// 提交评论回复
export async function createReviewReply(data: {
  review_id: string;
  user_id: string;
  content: string;
  user_name: string;
  is_anonymous: boolean;
}): Promise<ReviewReply | null> {
  if (!hasSupabaseConfig) {
    // 返回模拟数据
    const mockReply: ReviewReply = {
      id: `reply-${Date.now()}`,
      review_id: data.review_id,
      user_id: data.user_id,
      content: data.content,
      user_name: data.is_anonymous ? '匿名用户' : data.user_name,
      is_anonymous: data.is_anonymous,
      created_at: new Date().toISOString()
    };
    return mockReply;
  }
  
  try {
    const { data: reply, error } = await supabase
      .from("review_replies")
      .insert({
        review_id: data.review_id,
        user_id: data.user_id,
        content: data.content,
        user_name: data.user_name,
        is_anonymous: data.is_anonymous
      })
      .select()
      .single();

    if (error) {
      console.error("提交评论回复失败:", error);
      // 如果是表不存在的错误，返回模拟数据
      if (error.code === 'PGRST205') {
        const mockReply: ReviewReply = {
          id: `reply-${Date.now()}`,
          review_id: data.review_id,
          user_id: data.user_id,
          content: data.content,
          user_name: data.is_anonymous ? '匿名用户' : data.user_name,
          is_anonymous: data.is_anonymous,
          created_at: new Date().toISOString()
        };
        return mockReply;
      }
      return null;
    }

    return reply;
  } catch (error) {
    console.error("提交评论回复出错:", error);
    // 出错时返回模拟数据
    const mockReply: ReviewReply = {
      id: `reply-${Date.now()}`,
      review_id: data.review_id,
      user_id: data.user_id,
      content: data.content,
      user_name: data.is_anonymous ? '匿名用户' : data.user_name,
      is_anonymous: data.is_anonymous,
      created_at: new Date().toISOString()
    };
    return mockReply;
  }
}

// 获取评论的回复列表
export async function getReviewReplies(reviewId: string): Promise<ReviewReply[]> {
  if (!hasSupabaseConfig) {
    // 返回模拟数据
    const mockReplies: ReviewReply[] = [
      {
        id: "1",
        review_id: reviewId,
        user_id: "1",
        content: "这个评论很有道理！",
        user_name: "张三",
        is_anonymous: false,
        created_at: new Date().toISOString()
      }
    ];
    return mockReplies;
  }
  
  try {
    const { data: replies, error } = await supabase
      .from("review_replies")
      .select("*")
      .eq("review_id", reviewId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("获取评论回复失败:", error);
      // 如果是表不存在的错误，返回模拟数据
      if (error.code === 'PGRST205') {
        const mockReplies: ReviewReply[] = [
          {
            id: "1",
            review_id: reviewId,
            user_id: "1",
            content: "这个评论很有道理！",
            user_name: "张三",
            is_anonymous: false,
            created_at: new Date().toISOString()
          }
        ];
        return mockReplies;
      }
      return [];
    }

    return replies || [];
  } catch (error) {
    console.error("获取评论回复出错:", error);
    // 出错时返回模拟数据
    const mockReplies: ReviewReply[] = [
      {
        id: "1",
        review_id: reviewId,
        user_id: "1",
        content: "这个评论很有道理！",
        user_name: "张三",
        is_anonymous: false,
        created_at: new Date().toISOString()
      }
    ];
    return mockReplies;
  }
}

// 提交菜品评论回复
export async function createDishReviewReply(data: {
  dish_review_id: string;
  user_id: string;
  content: string;
  user_name: string;
  is_anonymous: boolean;
}): Promise<DishReviewReply | null> {
  if (!hasSupabaseConfig) {
    // 返回模拟数据
    const mockReply: DishReviewReply = {
      id: `dish-reply-${Date.now()}`,
      dish_review_id: data.dish_review_id,
      user_id: data.user_id,
      content: data.content,
      user_name: data.is_anonymous ? '匿名用户' : data.user_name,
      is_anonymous: data.is_anonymous,
      created_at: new Date().toISOString()
    };
    return mockReply;
  }
  
  try {
    const { data: reply, error } = await supabase
      .from("dish_review_replies")
      .insert({
        dish_review_id: data.dish_review_id,
        user_id: data.user_id,
        content: data.content,
        user_name: data.user_name,
        is_anonymous: data.is_anonymous
      })
      .select()
      .single();

    if (error) {
      console.error("提交菜品评论回复失败:", error);
      // 如果是表不存在的错误，返回模拟数据
      if (error.code === 'PGRST205') {
        const mockReply: DishReviewReply = {
          id: `dish-reply-${Date.now()}`,
          dish_review_id: data.dish_review_id,
          user_id: data.user_id,
          content: data.content,
          user_name: data.is_anonymous ? '匿名用户' : data.user_name,
          is_anonymous: data.is_anonymous,
          created_at: new Date().toISOString()
        };
        return mockReply;
      }
      return null;
    }

    return reply;
  } catch (error) {
    console.error("提交菜品评论回复出错:", error);
    // 出错时返回模拟数据
    const mockReply: DishReviewReply = {
      id: `dish-reply-${Date.now()}`,
      dish_review_id: data.dish_review_id,
      user_id: data.user_id,
      content: data.content,
      user_name: data.is_anonymous ? '匿名用户' : data.user_name,
      is_anonymous: data.is_anonymous,
      created_at: new Date().toISOString()
    };
    return mockReply;
  }
}

// 获取菜品评论的回复列表
export async function getDishReviewReplies(dishReviewId: string): Promise<DishReviewReply[]> {
  if (!hasSupabaseConfig) {
    // 返回模拟数据
    const mockReplies: DishReviewReply[] = [
      {
        id: "1",
        dish_review_id: dishReviewId,
        user_id: "1",
        content: "这个评论很有道理！",
        user_name: "张三",
        is_anonymous: false,
        created_at: new Date().toISOString()
      }
    ];
    return mockReplies;
  }
  
  try {
    const { data: replies, error } = await supabase
      .from("dish_review_replies")
      .select("*")
      .eq("dish_review_id", dishReviewId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("获取菜品评论回复失败:", error);
      // 如果是表不存在的错误，返回模拟数据
      if (error.code === 'PGRST205') {
        const mockReplies: DishReviewReply[] = [
          {
            id: "1",
            dish_review_id: dishReviewId,
            user_id: "1",
            content: "这个评论很有道理！",
            user_name: "张三",
            is_anonymous: false,
            created_at: new Date().toISOString()
          }
        ];
        return mockReplies;
      }
      return [];
    }

    return replies || [];
  } catch (error) {
    console.error("获取菜品评论回复出错:", error);
    // 出错时返回模拟数据
    const mockReplies: DishReviewReply[] = [
      {
        id: "1",
        dish_review_id: dishReviewId,
        user_id: "1",
        content: "这个评论很有道理！",
        user_name: "张三",
        is_anonymous: false,
        created_at: new Date().toISOString()
      }
    ];
    return mockReplies;
  }
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
  if (!hasSupabaseConfig) {
    // 返回模拟数据
    const mockReview: Review = {
      id: `review-${Date.now()}`,
      canteen_id: data.canteen_id,
      user_id: data.user_id,
      rating: data.rating,
      content: data.content,
      user_name: data.is_anonymous ? '匿名用户' : data.user_name,
      is_anonymous: data.is_anonymous,
      created_at: new Date().toISOString()
    };
    return mockReview;
  }
  
  let canteenUuid = data.canteen_id;
  
  // 如果 canteen_id 是 "canteen-1" 格式，需要查询 Supabase 中的 UUID
  if (data.canteen_id.startsWith('canteen-')) {
    try {
      // 查询 Supabase 中的食堂，获取其真正的 UUID
      const { data: canteenData, error: canteenError } = await supabase
        .from("canteens")
        .select("id")
        .eq("name", getCanteenNameFromId(data.canteen_id))
        .single();
      
      if (!canteenError && canteenData) {
        canteenUuid = canteenData.id;
      }
    } catch (error) {
      console.error("查询食堂UUID失败:", error);
    }
  }
  
  try {
    const { data: newReview, error } = await supabase
      .from("reviews")
      .insert({
        ...data,
        canteen_id: canteenUuid
      })
      .select()
      .single();

    if (error) {
      console.error("提交评价失败:", error);
      return null;
    }

    return newReview;
  } catch (error) {
    console.error("提交评价出错:", error);
    return null;
  }
}

function getCanteenNameFromId(canteenId: string): string {
  const nameMap: Record<string, string> = {
    "canteen-1": "学一·启航",
    "canteen-2": "学二·银河",
    "canteen-3": "学三·极光",
    "canteen-4": "学四·繁星",
  };
  return nameMap[canteenId] || canteenId;
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
  // 如果没有 Supabase 配置，返回模拟评分
  if (!hasSupabaseConfig) {
    const hash = canteenId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (3.5 + (hash % 15) / 10);
  }

  let queryId = canteenId;
  
  // 如果 canteenId 是 "canteen-1" 格式，需要先查询 Supabase 中的 UUID
  if (canteenId.startsWith('canteen-')) {
    try {
      const { data: canteenData, error: canteenError } = await supabase
        .from("canteens")
        .select("id")
        .eq("name", getCanteenNameFromId(canteenId))
        .single();
      
      if (!canteenError && canteenData) {
        queryId = canteenData.id;
      }
    } catch (error) {
      console.error("查询食堂UUID失败:", error);
    }
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("canteen_id", queryId);

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

    // 创建新用户（不加密密码）
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email,
        password: password,
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
    console.log('登录尝试:', { email, userType });
    
    // 检查 supabase 实例是否存在
    console.log('supabase 实例:', !!supabase);
    console.log('supabase URL:', supabaseUrl);
    console.log('hasSupabaseConfig:', hasSupabaseConfig);
    
    // 检查是否有配置
    if (!hasSupabaseConfig) {
      console.log('没有 Supabase 配置');
      return {
        user: null,
        token: null,
        error: "系统配置错误，请联系管理员",
      };
    }
    
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, user_type, student_id, password, is_admin, created_at, updated_at")
      .eq("email", email)
      .single();

    console.log('查询结果:', { user, error });

    if (error || !user) {
      console.log('用户不存在或查询失败:', error);
      // 更详细的错误信息
      if (error) {
        console.log('错误详情:', error.code, error.message);
      }
      return {
        user: null,
        token: null,
        error: `邮箱或密码错误: ${error?.message || '用户不存在'}`,
      };
    }

    // 使用bcrypt验证密码
    let passwordMatch = false;
    console.log('密码验证开始:', { inputPassword: password, storedPassword: user.password });
    
    try {
      // 检查存储的密码是否是bcrypt哈希值
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
        // 是bcrypt哈希值，使用bcrypt验证
        passwordMatch = await bcrypt.compare(password, user.password);
        console.log('bcrypt验证结果:', passwordMatch);
      } else {
        // 不是bcrypt哈希值，直接比较
        passwordMatch = password === user.password;
        console.log('直接比较结果:', passwordMatch);
      }
    } catch (e) {
      console.log('密码验证失败，尝试直接比较:', e);
      // 如果bcrypt验证失败，尝试直接比较（可能是旧的明文密码）
      passwordMatch = password === user.password;
      console.log('直接比较结果:', passwordMatch);
    }

    if (!passwordMatch) {
      console.log('密码验证失败');
      return {
        user: null,
        token: null,
        error: "邮箱或密码错误",
      };
    }
    
    console.log('密码验证成功');


    // 生成简单的 token
    const token = btoa(JSON.stringify({ userId: user.id }));

    // 从用户对象中移除password属性
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
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
  console.log('getUserById 被调用:', { userId, hasSupabaseConfig });
  
  if (!hasSupabaseConfig) {
    console.log('使用 mock 数据');
    return mockUsers.find(user => user.id === userId) || null;
  }
  
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, user_type, student_id, avatar_url, is_admin, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("获取用户信息失败:", error);
      console.log('使用 mock 数据作为 fallback');
      return mockUsers.find(user => user.id === userId) || null;
    }

    console.log('从数据库获取的用户数据:', data);
    return data;
  } catch (error) {
    console.error("获取用户信息出错:", error);
    console.log('使用 mock 数据作为 fallback');
    return mockUsers.find(user => user.id === userId) || null;
  }
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
  // 首先获取所有食堂（优先使用模拟数据）
  let canteens = getMockCanteens();
  
  if (hasSupabaseConfig) {
    try {
      const { data, error } = await supabase
        .from("canteens")
        .select("*");

      if (!error && data && data.length > 0) {
        canteens = data;
      }
    } catch (error) {
      console.error("从 Supabase 获取食堂数据失败:", error);
    }
  }

  // 获取每个食堂的评分
  const canteensWithRating = await Promise.all(
    canteens.map(async (canteen) => {
      const rating = await getCanteenRating(canteen.id);
      return {
        ...canteen,
        rating: rating || 0
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
export async function getCanteenStalls(canteenId: string): Promise<(Stall & { waitTime?: number })[]> {
  // 如果 Supabase 配置存在，优先从 Supabase 获取数据
  if (hasSupabaseConfig) {
    try {
      const { data, error } = await supabase
        .from("stalls")
        .select("*")
        .eq("canteen_id", canteenId);

      if (!error && data && data.length > 0) {
        return data.map((stall: any) => ({
          ...stall,
          waitTime: getEstimatedWaitTime(stall.id)
        }));
      }
    } catch (error) {
      console.error("从 Supabase 获取档口数据失败:", error);
    }
  }

  // 如果 Supabase 没有数据或不可用，使用模拟数据
  const stalls = getMockStallsForCanteen(canteenId);
  // 为每个档口添加模拟的等待时间
  return stalls.map(stall => ({
    ...stall,
    waitTime: getEstimatedWaitTime(stall.id)
  }));
}

// 生成模拟的等待时间（分钟）
function getEstimatedWaitTime(stallId: string): number {
  // 根据时间和档口ID生成相对稳定的等待时间
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // 计算基础等待时间（基于当前时间）
  let baseWaitTime = 0;
  
  // 早餐高峰：7:00-9:00
  if (hour >= 7 && hour < 9) {
    baseWaitTime = 8 + Math.sin(minute / 10) * 3;
  }
  // 午餐高峰：11:30-13:30
  else if (hour >= 11 && hour < 14) {
    baseWaitTime = 12 + Math.sin(minute / 15) * 5;
  }
  // 晚餐高峰：17:00-19:00
  else if (hour >= 17 && hour < 19) {
    baseWaitTime = 10 + Math.sin(minute / 12) * 4;
  }
  // 其他时间
  else {
    baseWaitTime = 3 + Math.sin(minute / 20) * 2;
  }
  
  // 根据档口ID添加一些随机性
  const stallHash = stallId.split('__').reduce((hash, part) => {
    return part.split('').reduce((h, char) => h + char.charCodeAt(0), hash);
  }, 0);
  
  const randomFactor = (stallHash % 5) / 2;
  
  // 确保等待时间在合理范围内
  return Math.max(1, Math.round(baseWaitTime + randomFactor));
}

// 生成菜品的口味标签
function getDishTags(dish: Dish): string[] {
  const tags: string[] = [];
  
  // 根据辣度添加标签
  if (dish.is_spicy === 3) {
    tags.push('辣到飞起');
  } else if (dish.is_spicy === 2) {
    tags.push('有点辣');
  } else if (dish.is_spicy === 1) {
    tags.push('微辣');
  } else {
    tags.push('不辣');
  }
  
  // 根据价格添加标签
  if (dish.price < 10) {
    tags.push('性价比之王');
  } else if (dish.price < 20) {
    tags.push('价格适中');
  } else {
    tags.push('豪华套餐');
  }
  
  // 根据类别添加标签
  switch (dish.category) {
    case '快餐':
      tags.push('速度快');
      break;
    case '早餐':
      tags.push('早餐限定');
      break;
    case '面食':
      tags.push('碳水炸弹');
      break;
    case '轻食':
      tags.push('健康减脂');
      break;
    case '小吃':
      tags.push('解馋必备');
      break;
    case '饮品':
      tags.push('解渴神器');
      break;
    case '甜品':
      tags.push('甜蜜暴击');
      break;
  }
  
  // 根据描述添加标签
  if (dish.description) {
    if (dish.description.includes('肉')) {
      tags.push('肉食爱好者');
    }
    if (dish.description.includes('蔬菜') || dish.description.includes('沙拉')) {
      tags.push('素食友好');
    }
  }
  
  // 随机添加一些学生口吻的标签
  const studentTags = [
    '米饭杀手',
    '重油重盐',
    '清淡避雷',
    '期末必备',
    '熬夜神器',
    '减肥克星',
    '性价比之王',
    '食堂顶流'
  ];
  
  // 随机选择1-2个学生标签
  const randomTags = studentTags.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 2) + 1);
  tags.push(...randomTags);
  
  // 去重并限制数量
  return [...new Set(tags)].slice(0, 5);
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
  // 优先使用模拟数据
  const parsed = parseMockStallId(stallId);
  if (parsed) {
    const canteenId = parsed.canteenId;
    const allDishes = getMockDishesForCanteen(canteenId, new Map());
    return allDishes.filter((d) => d.stall_id === stallId);
  }
  return mockDishes.filter((dish) => dish.stall_id === stallId);
}

// 获取食堂的菜品列表
export async function getCanteenDishes(canteenId: string): Promise<(Dish & { tags?: string[] })[]> {
  // 优先从 Supabase 获取数据（用户之前保存的数据）
  if (hasSupabaseConfig) {
    try {
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("canteen_id", canteenId);

      if (!error && data && data.length > 0) {
        return data.map((dish: any) => ({
          ...dish,
          tags: getDishTags(dish)
        }));
      }
    } catch (error) {
      console.error("从 Supabase 获取菜品数据失败:", error);
    }
  }

  // 如果 Supabase 没有数据或不可用，使用本地模拟数据
  let dishes = getMockDishesForCanteen(canteenId, new Map());
  
  // 如果没有找到菜品，生成默认菜品
  if (dishes.length === 0) {
    const generated = getGeneratedMockDishesForCanteen(canteenId);
    dishes = generated;
  }
  
  return dishes.map(dish => ({
    ...dish,
    tags: getDishTags(dish)
  }));
}

// 获取单个菜品详情
export async function getDishById(id: string): Promise<(Dish & { tags?: string[] }) | null> {
  // 优先使用模拟数据
  const sepIdx = id.lastIndexOf(MOCK_DISH_ID_SEP);
  if (sepIdx > 0) {
    const canteenId = id.slice(0, sepIdx);
    // 使用 getMockDishesForCanteen 获取我们定义的菜品
    const dishes = getMockDishesForCanteen(canteenId, new Map());
    const dish = dishes.find((d) => d.id === id);
    if (dish) {
      return { ...dish, tags: getDishTags(dish) };
    }
  }
  // 从 mockDishes 中查找
  const dish = mockDishes.find((dish) => dish.id === id);
  if (dish) {
    return { ...dish, tags: getDishTags(dish) };
  }
  return null;
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

    const passwordMatch = oldPassword === user.password;
    if (!passwordMatch) {
      return { success: false, error: "原密码错误" };
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ password: newPassword })
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
    const { error: updateError } = await supabase
      .from("users")
      .update({ password: newPassword })
      .eq("email", email);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: "重置密码失败" };
  }
}

// 更新用户身体信息
export async function updateUserProfile(
  userId: string,
  profile: {
    height?: number;
    weight?: number;
    age?: number;
    gender?: 'male' | 'female';
    activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  }
): Promise<{ success: boolean; error: string | null; user?: User }> {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({ ...profile, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null, user: data };
  } catch (error) {
    return { success: false, error: "更新用户信息失败" };
  }
}

// 更新用户基本信息（头像、用户名、学号等）
export async function updateUserBasicInfo(
  userId: string,
  basicInfo: {
    avatar_url?: string;
    name?: string;
    student_id?: string;
  }
): Promise<{ success: boolean; error: string | null; user?: User }> {
  try {
    console.log('🔄 开始更新用户基本信息:', { userId, basicInfo });
    console.log('📊 Supabase 配置状态:', { hasSupabaseConfig, supabaseUrl });
    
    // 验证输入参数
    if (!userId) {
      console.error('❌ 用户ID为空');
      return { success: false, error: '用户ID不能为空' };
    }

    // 验证要更新的字段
    const updateFields = {};
    if (basicInfo.name !== undefined && basicInfo.name !== null) {
      Object.assign(updateFields, { name: basicInfo.name });
    }
    if (basicInfo.avatar_url !== undefined && basicInfo.avatar_url !== null) {
      Object.assign(updateFields, { avatar_url: basicInfo.avatar_url });
    }
    if (basicInfo.student_id !== undefined && basicInfo.student_id !== null) {
      Object.assign(updateFields, { student_id: basicInfo.student_id });
    }
    
    // 添加更新时间戳
    Object.assign(updateFields, { updated_at: new Date().toISOString() });

    console.log('✅ 准备更新的字段:', updateFields);

    // 执行更新操作
    const { error: updateError, data: updateData } = await supabase
      .from("users")
      .update(updateFields)
      .eq("id", userId)
      .select();

    console.log('📝 更新操作结果:', { 
      error: updateError, 
      data: updateData,
      dataType: typeof updateData,
      isArray: Array.isArray(updateData),
      dataLength: Array.isArray(updateData) ? updateData.length : 'N/A'
    });

    if (updateError) {
      console.error("❌ 更新用户基本信息失败:", updateError);
      console.error("错误详情:", {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      });
      return { success: false, error: updateError.message || '数据库更新失败' };
    }

    // 处理更新结果
    let updatedUserData = null;
    
    if (Array.isArray(updateData) && updateData.length > 0) {
      // 如果 select() 返回数组，取第一个元素
      updatedUserData = updateData[0];
      console.log('✅ 从更新操作中获取到用户数据:', updatedUserData);
    } else if (updateData && !Array.isArray(updateData)) {
      // 如果 select() 返回对象
      updatedUserData = updateData;
      console.log('✅ 从更新操作中获取到用户数据(对象):', updatedUserData);
    }
    
    // 如果更新操作没有返回完整数据，重新查询
    if (!updatedUserData) {
      console.log('⚠️ 更新操作未返回完整数据，重新查询...');
      
      try {
        const { data: freshData, error: fetchError } = await supabase
          .from("users")
          .select("id, email, name, user_type, student_id, avatar_url, is_admin, created_at, updated_at")
          .eq("id", userId)
          .maybeSingle();

        if (fetchError) {
          console.error("❌ 获取更新后的用户信息失败:", fetchError);
          // 即使查询失败，也认为更新成功（因为前面的 update 已经成功了）
          console.log('ℹ️ 但更新操作本身已成功');
        } else {
          updatedUserData = freshData;
          console.log('✅ 重新查询获取到用户数据:', updatedUserData);
        }
      } catch (queryError) {
        console.error("❌ 重新查询异常:", queryError);
      }
    }

    // 验证最终获取到的数据
    if (updatedUserData) {
      console.log('🎉 最终返回的用户数据:', updatedUserData);
      console.log('🔍 数据验证:', {
        hasId: !!updatedUserData.id,
        hasName: !!updatedUserData.name,
        hasStudentId: !!updatedUserData.student_id,
        idMatch: updatedUserData.id === userId
      });
      
      return { success: true, error: null, user: updatedUserData as User };
    } else {
      console.warn('⚠️ 无法获取更新后的完整用户数据，但更新操作已执行');
      return { success: true, error: null }; // 返回成功但不包含用户数据
    }
  } catch (error) {
    console.error("💥 更新用户基本信息异常:", error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error("异常类型:", error instanceof Error ? error.constructor.name : 'Unknown');
    console.error("异常消息:", errorMessage);
    console.error("异常堆栈:", error instanceof Error ? error.stack : undefined);
    return { success: false, error: `系统异常: ${errorMessage || '未知错误'}` };
  }
}

// 计算每日推荐营养摄入量
export function calculateDailyGoals(user: User) {
  const { height, weight, age, gender, activity_level } = user;

  if (!weight || !age || !gender) {
    return {
      carbs: 300,
      protein: 150,
      fat: 80,
      fiber: 30,
      calories: 2000
    };
  }

  let bmr;
  if (gender === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * (height || 170)) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * (height || 160)) - (4.330 * age);
  }

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const tdee = bmr * (activityMultipliers[activity_level || 'sedentary']);

  return {
    carbs: Math.round((tdee * 0.5) / 4),
    protein: Math.round((tdee * 0.25) / 4),
    fat: Math.round((tdee * 0.25) / 9),
    fiber: Math.round(weight * 0.25),
    calories: Math.round(tdee)
  };
}

// 根据邮箱获取用户
export async function getUserByEmail(email: string): Promise<User | null> {
  if (!hasSupabaseConfig) {
    return mockUsers.find(user => user.email === email) || null;
  }
  
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, user_type, student_id, is_admin, height, weight, age, gender, activity_level, created_at, updated_at")
      .eq("email", email)
      .single();

    if (error) {
      console.error("根据邮箱获取用户失败:", error);
      return mockUsers.find(user => user.email === email) || null;
    }

    return data;
  } catch (error) {
    console.error("根据邮箱获取用户出错:", error);
    return mockUsers.find(user => user.email === email) || null;
  }
}

// 获取所有用户
// 模拟用户数据
const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@example.com",
    name: "管理员",
    user_type: "teacher",
    student_id: "00000000",
    is_admin: true,
    height: 175,
    weight: 70,
    age: 30,
    gender: "male",
    activity_level: "moderate",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    email: "student1@example.com",
    name: "张三",
    user_type: "student",
    student_id: "2023000001",
    is_admin: false,
    height: 170,
    weight: 65,
    age: 18,
    gender: "male",
    activity_level: "active",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z"
  },
  {
    id: "3",
    email: "student2@example.com",
    name: "李四",
    user_type: "student",
    student_id: "2023000002",
    is_admin: false,
    height: 165,
    weight: 55,
    age: 19,
    gender: "female",
    activity_level: "moderate",
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z"
  },
  {
    id: "4",
    email: "teacher1@example.com",
    name: "王老师",
    user_type: "teacher",
    student_id: "12345678",
    is_admin: false,
    height: 180,
    weight: 75,
    age: 35,
    gender: "male",
    activity_level: "sedentary",
    created_at: "2024-01-04T00:00:00Z",
    updated_at: "2024-01-04T00:00:00Z"
  }
];

export async function getAllUsers(): Promise<User[]> {
  if (!hasSupabaseConfig) {
    return mockUsers;
  }
  
  try {
    // 选择数据库中的字段，包括is_admin
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, created_at, is_admin, user_type, student_id")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("获取用户列表失败:", error);
      return mockUsers;
    }

    // 转换数据格式以匹配 User 类型
    const users = (data || []).map(user => ({
      ...user,
      user_type: user.user_type || "student", // 默认值
      student_id: user.student_id || "", // 默认值
      is_admin: user.is_admin || ["kevin", "千秋梧桐", "CHOW"].includes(user.name), // 优先使用数据库中的值，否则使用用户名判断
      updated_at: user.created_at // 使用 created_at 作为 updated_at
    }));

    return users;
  } catch (error) {
    console.error("获取用户列表出错:", error);
    return mockUsers;
  }
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
    const { error } = await supabase
      .from("users")
      .update({ password: newPassword })
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
export async function getAllDishes(): Promise<(Dish & { tags?: string[] })[]> {
  // 默认使用模拟数据，确保显示完整的菜品列表
  const mockResult = mockDishes.map(dish => ({
    ...dish,
    tags: getDishTags(dish)
  }));
  
  if (!hasSupabaseConfig) {
    return mockResult;
  }

  try {
    const { data, error } = await supabase
      .from("dishes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("获取所有菜品失败:", error);
      return mockResult;
    }

    // 如果数据库中没有数据，返回模拟数据
    if (!data || data.length === 0) {
      return mockResult;
    }

    // 合并模拟数据和Supabase数据，去除重复（根据菜品名称和食堂ID）
    const supabaseDishes = (data as Dish[]).map(dish => ({
      ...dish,
      tags: getDishTags(dish)
    }));
    
    const mergedDishes = [...mockResult];
    for (const supDish of supabaseDishes) {
      const exists = mergedDishes.some(d => 
        d.name === supDish.name && d.canteen_id === supDish.canteen_id
      );
      if (!exists) {
        mergedDishes.push(supDish);
      }
    }
    
    return mergedDishes;
  } catch (err) {
    console.error("获取所有菜品出错:", err);
    return mockResult;
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

// 获取菜品排行榜（按评分排序）
export async function getDishRanking(): Promise<(Dish & { rating: number; tags?: string[] })[]> {
  const allDishes = await getAllDishes();
  
  if (!hasSupabaseConfig) {
    const dishesWithRating = allDishes.map(dish => {
      const hash = dish.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return {
        ...dish,
        rating: parseFloat((3.5 + (hash % 15) / 10).toFixed(1))
      };
    });
    return dishesWithRating.sort((a, b) => b.rating - a.rating);
  }

  const dishesWithRating = await Promise.all(
    allDishes.map(async (dish) => {
      const rating = await getDishRating(dish.id);
      return {
        ...dish,
        rating: rating || 0
      };
    })
  );

  return dishesWithRating.sort((a, b) => b.rating - a.rating);
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

// 获取菜品的评价列表
export async function getDishReviews(dishId: string): Promise<DishReview[]> {
  const { data, error } = await supabase
    .from("dish_reviews")
    .select("*")
    .eq("dish_id", dishId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("获取菜品评价列表失败:", error);
    return [];
  }

  return data || [];
}

// 提交菜品评价
export async function createDishReview(data: {
  dish_id: string;
  canteen_id: string;
  user_id: string;
  rating: number;
  content: string;
  user_name: string;
  is_anonymous: boolean;
}): Promise<DishReview | null> {
  let canteenUuid = data.canteen_id;
  
  // 如果 canteen_id 是 "canteen-1" 格式，需要查询 Supabase 中的 UUID
  if (data.canteen_id.startsWith('canteen-')) {
    try {
      const { data: canteenData, error: canteenError } = await supabase
        .from("canteens")
        .select("id")
        .eq("name", getCanteenNameFromId(data.canteen_id))
        .single();
      
      if (!canteenError && canteenData) {
        canteenUuid = canteenData.id;
      }
    } catch (error) {
      console.error("查询食堂UUID失败:", error);
    }
  }
  
  const { data: newReview, error } = await supabase
    .from("dish_reviews")
    .insert({
      ...data,
      canteen_id: canteenUuid
    })
    .select()
    .single();

  if (error) {
    console.error("提交菜品评价失败:", error);
    throw new Error(`提交菜品评价失败: ${error.message}`);
  }

  return newReview;
}

// 获取菜品的平均评分
export async function getDishRating(dishId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("dish_reviews")
    .select("rating")
    .eq("dish_id", dishId);

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

// 删除菜品评价
export async function deleteDishReview(reviewId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from("dish_reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: "删除菜品评价失败" };
  }
}
