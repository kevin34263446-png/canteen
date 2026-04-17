"use client";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCanteenById, getCanteenReviews, getCanteenRating, Review, isFavorite, addFavorite, removeFavorite, deleteReview, getCanteenStalls, Stall, getCanteenDishes, getDishCategories, Dish, getStallDishes, getCanteenDisplayName, uploadDishImage, createDish } from "@/lib/supabase";
import { getAIFoodRecommendation } from "@/lib/ai";
import ReviewForm from "@/components/ReviewForm";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";
import FoodTray from "@/components/FoodTray";

interface CanteenDetailPageProps {
  params: {
    id: string;
  };
}

export default function CanteenDetailPage({ params }: CanteenDetailPageProps) {
  // 直接从params中获取id
  const { id: canteenId } = params;
  const [canteen, setCanteen] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [activeStall, setActiveStall] = useState<string | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("全部");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showDishForm, setShowDishForm] = useState<boolean>(false);
  const [creatingDish, setCreatingDish] = useState<boolean>(false);
  const [dishForm, setDishForm] = useState<{
    stall_id: string;
    name: string;
    category: string;
    price: string;
    description: string;
    file: File | null;
  }>({
    stall_id: "",
    name: "",
    category: "",
    price: "",
    description: "",
    file: null,
  });

  // 托盘系统状态
  const [tray, setTray] = useState<Array<{
    id: string;
    name: string;
    price: number;
    image_url: string;
    quantity: number;
  }>>([]);
  const [showTray, setShowTray] = useState<boolean>(false);
  const [animatingDish, setAnimatingDish] = useState<string | null>(null);

  // 计算托盘总金额
  const totalPrice = tray.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // AI智能导购状态
  const [aiRecommendation, setAiRecommendation] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiInput, setAiInput] = useState<string>('');
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取用户信息
        const token = localStorage.getItem('auth_token');
        const userJson = localStorage.getItem('auth_user');
        if (token && userJson) {
          try {
            const decoded = JSON.parse(atob(token));
            setUserId(decoded.userId);
            setUser(JSON.parse(userJson));
          } catch (error) {
            // 清除无效的存储数据
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }

        const [canteenData, reviewsData, ratingData, stallsData, dishesData, categoriesData] = await Promise.all([
          getCanteenById(canteenId),
          getCanteenReviews(canteenId),
          getCanteenRating(canteenId),
          getCanteenStalls(canteenId),
          getCanteenDishes(canteenId),
          getDishCategories(canteenId),
        ]);

        if (!canteenData) {
          notFound();
        }

        setCanteen(canteenData);
        setReviews(reviewsData);
        setAvgRating(ratingData);
        setStalls(stallsData);
        setDishes(dishesData);
        setCategories(['全部', ...categoriesData]);

        // 检查是否已收藏
        if (userId) {
          const favorited = await isFavorite(userId, canteenId);
          setIsFavorited(favorited);
        }
      } catch (error) {
        console.error("获取数据失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [canteenId, userId]);

  const handleReviewSuccess = async () => {
    // 重新加载评价数据
    const [reviewsData, ratingData] = await Promise.all([
      getCanteenReviews(canteenId),
      getCanteenRating(canteenId),
    ]);

    setReviews(reviewsData);
    setAvgRating(ratingData);
    setShowReviewForm(false);
  };

  const refreshDishes = async () => {
    const [dishesData, categoriesData] = await Promise.all([
        getCanteenDishes(canteenId),
        getDishCategories(canteenId),
      ]);
    setDishes(dishesData);
    setCategories(["全部", ...categoriesData]);
  };

  const handleCreateDish = async () => {
    if (!dishForm.stall_id) {
      alert("请选择档口");
      return;
    }
    if (!dishForm.name.trim()) {
      alert("请输入菜品名称");
      return;
    }
    const price = Number(dishForm.price);
    if (!Number.isFinite(price) || price < 0) {
      alert("请输入正确的价格");
      return;
    }

    setCreatingDish(true);
    try {
      let imageUrl: string | null = null;
      if (dishForm.file) {
        imageUrl = await uploadDishImage({
          file: dishForm.file,
          canteenId: canteenId,
          stallId: dishForm.stall_id,
        });
      }

      await createDish({
        canteen_id: canteenId,
        stall_id: dishForm.stall_id,
        name: dishForm.name.trim(),
        category: (dishForm.category.trim() || "未分类"),
        price,
        description: dishForm.description.trim() || null,
        image_url: imageUrl,
      });

      setShowDishForm(false);
      setDishForm({
        stall_id: "",
        name: "",
        category: "",
        price: "",
        description: "",
        file: null,
      });
      await refreshDishes();
    } catch (e) {
      alert(e instanceof Error ? e.message : "新增菜品失败");
    } finally {
      setCreatingDish(false);
    }
  };

  // 添加菜品到托盘
  const addToTray = (dish: any) => {
    setAnimatingDish(dish.id);
    
    // 模拟动画效果
    setTimeout(() => {
      setTray(prevTray => {
        const existingItem = prevTray.find(item => item.id === dish.id);
        if (existingItem) {
          return prevTray.map(item => 
            item.id === dish.id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          return [...prevTray, {
            id: dish.id,
            name: dish.name,
            price: dish.price,
            image_url: dish.image_url,
            quantity: 1
          }];
        }
      });
      setAnimatingDish(null);
      setShowTray(true);
    }, 500);
  };

  // 从托盘中移除菜品
  const removeFromTray = (dishId: string) => {
    setTray(prevTray => {
      const existingItem = prevTray.find(item => item.id === dishId);
      if (existingItem && existingItem.quantity > 1) {
        return prevTray.map(item => 
          item.id === dishId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prevTray.filter(item => item.id !== dishId);
      }
    });
  };

  // 清空托盘
  const clearTray = () => {
    setTray([]);
    setShowTray(false);
  };

  // 处理AI智能导购请求
  const handleAIRecommendation = async () => {
    if (!aiInput.trim()) {
      return;
    }

    setAiLoading(true);
    try {
      const recommendation = await getAIFoodRecommendation(aiInput);
      setAiRecommendation(recommendation);
    } catch (error) {
      console.error('获取AI推荐失败:', error);
      setAiRecommendation('获取推荐失败，请重试');
    } finally {
      setAiLoading(false);
    }
  };

  // 处理档口选择时的菜品加载
  const handleStallSelect = async (stallId: string) => {
    setActiveStall(stallId === activeStall ? null : stallId);
    
    if (stallId === activeStall) {
      // 取消选择档口，显示所有菜品
      const allDishes = await getCanteenDishes(canteenId);
      setDishes(allDishes);
    } else {
      // 选择档口，显示该档口的菜品
      const stallDishes = await getStallDishes(stallId);
      setDishes(stallDishes);
    }
  };

  // 过滤菜品
  const filteredDishes = dishes.filter(dish => {
    // 分类过滤
    const categoryMatch = activeCategory === "全部" || dish.category === activeCategory;
    
    // 搜索过滤
    const searchMatch = searchQuery === "" || 
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dish.description && dish.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return categoryMatch && searchMatch;
  });

  const handleFavorite = async () => {
    if (!userId) {
      // 未登录，跳转到登录页面
      window.location.href = '/login';
      return;
    }

    if (isFavorited) {
      // 取消收藏
      const success = await removeFavorite(userId, canteenId);
      if (success) {
        setIsFavorited(false);
      }
    } else {
      // 添加收藏
      const success = await addFavorite(userId, canteenId);
      if (success) {
        setIsFavorited(true);
      }
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) {
      // 未登录，跳转到登录页面
      window.location.href = '/login';
      return;
    }

    // 确认删除
    if (!confirm('确定要删除这条评价吗？')) {
      return;
    }

    setDeletingReviewId(reviewId);
    try {
        const result = await deleteReview(reviewId);
        if (result.success) {
        // 重新加载评价数据
        const [reviewsData, ratingData] = await Promise.all([
      getCanteenReviews(canteenId),
      getCanteenRating(canteenId),
    ]);
        setReviews(reviewsData);
        setAvgRating(ratingData);
      } else {
        alert(result.error || '删除评价失败');
      }
    } catch (error) {
      console.error('删除评价失败:', error);
      alert('删除评价失败，请重试');
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </main>
    );
  }

  if (!canteen) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-transparent">
      <Navbar />
      
      {/* 头部导航 */}
      <header className="glass sticky top-16 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <span>←</span>
            <span>返回列表</span>
          </Link>
        </div>
      </header>

      {/* 食堂详情 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 图片区域 */}
        <div className="glass rounded-[2rem] overflow-hidden mb-6">
          <div className="h-64 md:h-80 bg-gray-800 relative">
            {canteen.image_url ? (
              <Image
                src={canteen.image_url}
                alt={canteen.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
                <span className="text-6xl">🍽️</span>
              </div>
            )}
          </div>

          {/* 信息区域 */}
          <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-4">{getCanteenDisplayName(canteenId, canteen.name)}</h1>

            <div className="flex flex-wrap gap-4 mb-6">
              {canteen.location && (
                <div className="flex items-center gap-2 text-gray-300">
                  <span>📍</span>
                  <span>{canteen.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-300">
                <span>⏰</span>
                <span>营业时间: 06:30 - 22:00</span>
              </div>
              <div className="flex items-center gap-2">
                {/* 星级评分显示 */}
                <StarRating score={avgRating} size="md" />
                <span className="font-semibold text-white">{avgRating !== null ? avgRating : "暂无评分"}</span>
                <span className="text-gray-400">({reviews.length} 条评价)</span>
              </div>
              <button
                onClick={handleFavorite}
                className="flex items-center gap-2 text-gray-300 hover:text-red-500 transition-colors"
              >
                <span className={`${isFavorited ? 'text-red-500' : ''}`}>{isFavorited ? '❤️' : '🤍'}</span>
                <span>{isFavorited ? '已收藏' : '收藏'}</span>
              </button>
              <button
                onClick={() => setShowAiModal(true)}
                className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors"
              >
                <span>🤖</span>
                <span>AI导购</span>
              </button>
            </div>

            {canteen.description && (
              <div className="prose max-w-none">
                <h2 className="text-lg font-semibold text-white mb-2">食堂介绍</h2>
                <p className="text-gray-300 leading-relaxed">{canteen.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* 档口区域 */}
        <div className="glass rounded-[2rem] p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">档口列表</h2>
          
          {stalls.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl text-gray-600 block mb-2">🏪</span>
              <p className="text-gray-400">该食堂暂无档口信息</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stalls.map((stall) => (
                <div 
                  key={stall.id} 
                  onClick={() => handleStallSelect(stall.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${activeStall === stall.id 
                    ? 'border-indigo-500 bg-indigo-900/20 shadow-[0_12px_30px_rgba(99,102,241,0.2)]' 
                    : 'border-gray-700 hover:border-indigo-300 hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700">
                      {stall.image_url ? (
                        <Image
                          src={stall.image_url}
                          alt={stall.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-900 to-orange-900">
                          <span className="text-2xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white">{stall.name}</h3>
                        {stall.waitTime !== undefined && (
                          <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full flex items-center gap-1">
                            ⏰ {stall.waitTime}分钟
                          </span>
                        )}
                      </div>
                      {stall.description && (
                        <p className="text-sm text-gray-400 line-clamp-1">{stall.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 菜品区域 */}
        <div className="bg-white/72 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-[0_20px_60px_rgba(120,88,58,0.10)] p-8 mb-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              菜品列表
              {activeStall && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (来自: {stalls.find(s => s.id === activeStall)?.name})
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowDishForm(true)}
              className="shrink-0 rounded-full bg-amber-600 text-white px-4 py-2 text-sm font-medium shadow-[0_10px_24px_rgba(217,119,6,0.24)] hover:bg-amber-700 transition-colors"
            >
              + 新增菜品
            </button>
          </div>

          {/* 搜索框 */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索菜品名称或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 分类筛选 */}
          <div className="flex flex-wrap gap-3 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === category 
                  ? 'bg-amber-600 text-white shadow-[0_10px_24px_rgba(217,119,6,0.24)]' 
                  : 'bg-stone-100/90 text-stone-700 hover:bg-stone-200/90'}`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 菜品列表 */}
          {filteredDishes.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl text-gray-300 block mb-4">🍜</span>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">暂无菜品数据</h3>
              <p className="text-gray-500">该食堂暂无菜品信息</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDishes.map((dish) => (
                <Link key={dish.id} href={`/dish/${dish.id}`} className="bg-gray-50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer block">
                  <div className="h-48 bg-gray-200 relative">
                    {dish.image_url ? (
                      <Image
                        src={dish.image_url}
                        alt={dish.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
                        <span className="text-4xl text-green-400">🍽️</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{dish.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-600 font-bold">¥{dish.price.toFixed(2)}</span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">{dish.category}</span>
                    </div>
                    {dish.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{dish.description}</p>
                    )}
                    {dish.tags && dish.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {dish.tags.map((tag, index) => (
                          <span key={index} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          addToTray(dish);
                        }}
                        className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <span>🍽️</span>
                        <span>加入托盘</span>
                      </button>
                      <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        查看详情
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 评价区域 */}
        <div className="bg-white/72 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-[0_20px_60px_rgba(120,88,58,0.10)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">用户评价</h2>
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              写评价
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">暂无评价</p>
              <p className="text-gray-400 text-sm mt-2">成为第一个评价的人吧！</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: Review) => (
                <div key={review.id} className="border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500">{review.is_anonymous ? '匿' : review.user_name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{review.is_anonymous ? '匿名用户' : review.user_name}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`${
                              star <= review.rating
                                ? "text-yellow-400"
                                : "text-yellow-200"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        {new Date(review.created_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {/* 只有评价的发布者才能看到删除按钮 */}
                      {user && user.id === review.user_id && (
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingReviewId === review.id}
                          className="text-red-500 hover:text-red-700 text-sm transition-colors"
                        >
                          {deletingReviewId === review.id ? '删除中...' : '删除'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 ml-13 pl-13">{review.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 评价表单模态框 */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">写评价</h3>
              <button
                onClick={() => setShowReviewForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <ReviewForm
              canteenId={canteenId}
              onSuccess={handleReviewSuccess}
            />
          </div>
        </div>
      )}

      {/* 新增菜品模态框 */}
      {showDishForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">新增菜品</h3>
              <button
                onClick={() => setShowDishForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                disabled={creatingDish}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">档口</label>
                <select
                  value={dishForm.stall_id}
                  onChange={(e) => setDishForm((s) => ({ ...s, stall_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">请选择档口</option>
                  {stalls.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {stalls.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">当前没有档口数据，请先在数据库创建档口。</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">菜品名称</label>
                  <input
                    value={dishForm.name}
                    onChange={(e) => setDishForm((s) => ({ ...s, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="例如：宫保鸡丁"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <input
                    value={dishForm.category}
                    onChange={(e) => setDishForm((s) => ({ ...s, category: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="例如：炒菜/面食/饮品"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格（元）</label>
                  <input
                    value={dishForm.price}
                    onChange={(e) => setDishForm((s) => ({ ...s, price: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="例如：12.5"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">图片（可选）</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDishForm((s) => ({ ...s, file: e.target.files?.[0] || null }))}
                    className="w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述（可选）</label>
                <textarea
                  value={dishForm.description}
                  onChange={(e) => setDishForm((s) => ({ ...s, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="简单介绍一下这道菜…"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowDishForm(false)}
                  className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100"
                  disabled={creatingDish}
                >
                  取消
                </button>
                <button
                  onClick={handleCreateDish}
                  className="px-5 py-2 rounded-full text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60"
                  disabled={creatingDish || stalls.length === 0}
                >
                  {creatingDish ? "提交中..." : "提交"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI智能导购模态框 */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🤖</span>
                <span>AI智能导购</span>
              </h3>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请输入你的需求（如：月底没钱了、考前补脑、练后加餐）
              </label>
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="例如：月底没钱了，推荐一些便宜又好吃的菜"
                rows={3}
              />
            </div>
            <button
              onClick={handleAIRecommendation}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium mb-4"
              disabled={aiLoading || !aiInput.trim()}
            >
              {aiLoading ? '思考中...' : '获取推荐'}
            </button>
            {aiRecommendation && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">AI推荐：</h4>
                <p className="text-gray-600 whitespace-pre-line">{aiRecommendation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 托盘系统 */}
      {showTray && tray.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>🍽️</span>
                <span>我的托盘</span>
              </h3>
              <button 
                onClick={clearTray}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                清空
              </button>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-4 mb-4 min-h-[100px] flex items-center">
              {tray.length === 0 ? (
                <p className="text-gray-500 text-center w-full">托盘是空的</p>
              ) : (
                <div className="flex flex-wrap gap-4 w-full">
                  {tray.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
                            <span className="text-xl text-green-400">🍽️</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">¥{item.price.toFixed(2)}</span>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => removeFromTray(item.id)}
                              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-gray-900">{item.quantity}</span>
                            <button 
                              onClick={() => addToTray(item)}
                              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-gray-900">
                今日消费总额: <span className="text-blue-600">¥{totalPrice.toFixed(2)}</span>
              </div>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                结算
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 预约点餐系统 */}
      <FoodTray 
        dishes={dishes}
        onOrder={(order) => {
          console.log('预约订单:', order);
          alert('预约成功！取餐时间：' + order.pickupTime);
        }}
      />
    </main>
  );
}