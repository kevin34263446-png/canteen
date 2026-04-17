"use client";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { getDishById, getCanteenById, getDishReviews, getDishRating, DishReview, deleteDishReview } from "@/lib/supabase";
import DishReviewForm from "@/components/DishReviewForm";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";

interface DishDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DishDetailPage({ params }: DishDetailPageProps) {
  const { id: dishId } = use(params);
  const [dish, setDish] = useState<any>(null);
  const [canteen, setCanteen] = useState<any>(null);
  const [reviews, setReviews] = useState<DishReview[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const userJson = localStorage.getItem('auth_user');
        if (token && userJson) {
          try {
            const decoded = JSON.parse(atob(token));
            setUserId(decoded.userId);
            setUser(JSON.parse(userJson));
          } catch (error) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }

        const dishData = await getDishById(dishId);
    if (!dishData) {
      notFound();
    }

    const canteenData = await getCanteenById(dishData.canteen_id);
    const reviewsData = await getDishReviews(dishId);
    const ratingData = await getDishRating(dishId);

        setDish(dishData);
        setCanteen(canteenData);
        setReviews(reviewsData);
        setAvgRating(ratingData);
      } catch (error) {
        console.error("获取数据失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dishId]);

  const handleReviewSuccess = async () => {
    const [reviewsData, ratingData] = await Promise.all([
      getDishReviews(dishId),
      getDishRating(dishId),
    ]);

    setReviews(reviewsData);
    setAvgRating(ratingData);
    setShowReviewForm(false);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (!confirm('确定要删除这条评价吗？')) {
      return;
    }

    setDeletingReviewId(reviewId);
    try {
      const result = await deleteDishReview(reviewId);
      if (result.success) {
        const [reviewsData, ratingData] = await Promise.all([
          getDishReviews(dishId),
          getDishRating(dishId),
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

  if (!dish) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-transparent">
      <Navbar />

      <header className="bg-white/55 backdrop-blur-xl border-b border-white/50 shadow-[0_10px_30px_rgba(120,88,58,0.06)] sticky top-16 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={canteen ? `/canteen/${canteen.id}` : "/"}
            className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <span>←</span>
            <span>返回{canteen ? canteen.name : '食堂'}</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/72 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-[0_20px_60px_rgba(120,88,58,0.10)] overflow-hidden mb-6">
          <div className="h-64 md:h-80 bg-gray-200 relative">
            {dish.image_url ? (
              <Image
                src={dish.image_url}
                alt={dish.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
                <span className="text-6xl text-green-400">🍽️</span>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{dish.name}</h1>
                <span className="inline-block bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">{dish.category}</span>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">¥{dish.price.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <StarRating score={avgRating} size="md" />
                <span className="font-semibold">{avgRating !== null ? avgRating : "暂无评分"}</span>
                <span className="text-gray-500">({reviews.length} 条评价)</span>
              </div>
              {canteen && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span>🏪</span>
                  <span>{canteen.name}</span>
                </div>
              )}
            </div>

            {dish.description && (
              <div className="prose max-w-none">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">菜品介绍</h2>
                <p className="text-gray-600 leading-relaxed">{dish.description}</p>
              </div>
            )}
          </div>
        </div>

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
              <p className="text-gray-400 text-sm mt-2">成为第一个评价这道菜的人吧！</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: DishReview) => (
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

      {showReviewForm && dish && (
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
            <DishReviewForm
              dishId={dishId}
              canteenId={dish.canteen_id}
              onSuccess={handleReviewSuccess}
            />
          </div>
        </div>
      )}
    </main>
  );
}
