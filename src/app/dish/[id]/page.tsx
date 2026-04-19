"use client";

import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDishById, getCanteenById, getDishReviews, getDishRating, DishReview, deleteDishReview } from "@/lib/supabase";
import DishReviewForm from "@/components/DishReviewForm";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";

export default function DishDetailPage() {
  const params = useParams();
  const dishId = params.id as string;
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
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white/70">加载中...</p>
        </div>
      </main>
    );
  }

  if (!dish) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-16 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={canteen ? `/canteen/${canteen.id}` : "/"}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <span>←</span>
            <span>返回{canteen ? canteen.name : '食堂'}</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden mb-6">
          <div className="h-64 md:h-80 bg-slate-800 relative">
            {dish.image_url ? (
              <Image
                src={dish.image_url}
                alt={dish.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                <span className="text-6xl">🍽️</span>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{dish.name}</h1>
                <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm">{dish.category}</span>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">¥{dish.price.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <StarRating score={avgRating} size="md" />
                <span className="font-semibold text-white">{avgRating !== null ? avgRating : "暂无评分"}</span>
                <span className="text-white/60">({reviews.length} 条评价)</span>
              </div>
              {canteen && (
                <div className="flex items-center gap-2 text-white/80">
                  <span>🏪</span>
                  <span>{canteen.name}</span>
                </div>
              )}
            </div>

            {dish.description && (
              <div className="prose max-w-none">
                <h2 className="text-lg font-semibold text-white mb-2">菜品介绍</h2>
                <p className="text-white/80 leading-relaxed">{dish.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">用户评价</h2>
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg"
            >
              写评价
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60">暂无评价</p>
              <p className="text-white/40 text-sm mt-2">成为第一个评价这道菜的人吧！</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: DishReview) => (
                <div key={review.id} className="border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">{review.is_anonymous ? '匿' : review.user_name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{review.is_anonymous ? '匿名用户' : review.user_name}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`${
                              star <= review.rating
                                ? "text-yellow-400"
                                : "text-white/30"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-sm text-white/50">
                        {new Date(review.created_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {user && user.id === review.user_id && (
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingReviewId === review.id}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          {deletingReviewId === review.id ? '删除中...' : '删除'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-white/90 ml-13 pl-13 leading-relaxed">{review.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showReviewForm && dish && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">写评价</h3>
              <button
                onClick={() => setShowReviewForm(false)}
                className="text-white/60 hover:text-white text-2xl transition-colors"
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
