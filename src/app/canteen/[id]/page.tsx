"use client";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCanteenById, getCanteenReviews, getCanteenRating, Review, isFavorite, addFavorite, removeFavorite, deleteReview, getCanteenStalls, Stall, getCanteenDishes, getDishCategories, Dish, getStallDishes } from "@/lib/supabase";
import ReviewForm from "@/components/ReviewForm";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";

interface CanteenDetailPageProps {
  params: {
    id: string;
  };
}

export default function CanteenDetailPage({ params }: CanteenDetailPageProps) {
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
          getCanteenById(params.id),
          getCanteenReviews(params.id),
          getCanteenRating(params.id),
          getCanteenStalls(params.id),
          getCanteenDishes(params.id),
          getDishCategories(params.id),
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
          const favorited = await isFavorite(userId, params.id);
          setIsFavorited(favorited);
        }
      } catch (error) {
        console.error("获取数据失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, userId]);

  const handleReviewSuccess = async () => {
    // 重新加载评价数据
    const [reviewsData, ratingData] = await Promise.all([
      getCanteenReviews(params.id),
      getCanteenRating(params.id),
    ]);

    setReviews(reviewsData);
    setAvgRating(ratingData);
    setShowReviewForm(false);
  };

  // 处理档口选择
  const handleStallSelect = async (stallId: string) => {
    setActiveStall(stallId === activeStall ? null : stallId);
    setActiveCategory("全部");
    
    if (stallId === activeStall) {
      // 取消选择档口，显示所有菜品
      const allDishes = await getCanteenDishes(params.id);
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
      const success = await removeFavorite(userId, params.id);
      if (success) {
        setIsFavorited(false);
      }
    } else {
      // 添加收藏
      const success = await addFavorite(userId, params.id);
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
      const result = await deleteReview(reviewId, user);
      if (result.success) {
        // 重新加载评价数据
        const [reviewsData, ratingData] = await Promise.all([
          getCanteenReviews(params.id),
          getCanteenRating(params.id),
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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* 头部导航 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>←</span>
            <span>返回列表</span>
          </Link>
        </div>
      </header>

      {/* 食堂详情 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 图片区域 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="h-64 md:h-80 bg-gray-200 relative">
            {canteen.image_url ? (
              <Image
                src={canteen.image_url}
                alt={canteen.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                <span className="text-6xl">🍽️</span>
              </div>
            )}
          </div>

          {/* 信息区域 */}
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{canteen.name}</h1>

            <div className="flex flex-wrap gap-4 mb-6">
              {canteen.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span>📍</span>
                  <span>{canteen.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <span>⏰</span>
                <span>营业时间: 06:30 - 22:00</span>
              </div>
              <div className="flex items-center gap-2">
                {/* 星级评分显示 */}
                <StarRating score={avgRating} size="md" />
                <span className="font-semibold">{avgRating !== null ? avgRating : "暂无评分"}</span>
                <span className="text-gray-500">({reviews.length} 条评价)</span>
              </div>
              <button
                onClick={handleFavorite}
                className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
              >
                <span className={`${isFavorited ? 'text-red-500' : ''}`}>{isFavorited ? '❤️' : '🤍'}</span>
                <span>{isFavorited ? '已收藏' : '收藏'}</span>
              </button>
            </div>

            {canteen.description && (
              <div className="prose max-w-none">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">食堂介绍</h2>
                <p className="text-gray-600 leading-relaxed">{canteen.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* 档口区域 */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">档口列表</h2>
          
          {stalls.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl text-gray-300 block mb-2">🏪</span>
              <p className="text-gray-500">该食堂暂无档口信息</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stalls.map((stall) => (
                <div 
                  key={stall.id} 
                  onClick={() => handleStallSelect(stall.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${activeStall === stall.id 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                      {stall.image_url ? (
                        <Image
                          src={stall.image_url}
                          alt={stall.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100">
                          <span className="text-2xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{stall.name}</h3>
                      {stall.description && (
                        <p className="text-sm text-gray-600 line-clamp-1">{stall.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 菜品区域 */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            菜品列表
            {activeStall && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (来自: {stalls.find(s => s.id === activeStall)?.name})
              </span>
            )}
          </h2>

          {/* 搜索框 */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索菜品名称或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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
                <div key={dish.id} className="bg-gray-50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      查看详情
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 评价区域 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
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
                      <span className="text-gray-500">{review.user_name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{review.user_name}</p>
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
                      {user && user.name === review.user_name && (
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
              canteenId={params.id}
              onSuccess={handleReviewSuccess}
            />
          </div>
        </div>
      )}
    </main>
  );
}
