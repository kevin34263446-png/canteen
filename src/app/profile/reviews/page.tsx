'use client';

import { useState, useEffect, useMemo } from "react";
import { Review, DishReview, getCanteenById, getUserReviews, deleteReview, getDishById, getDishReviews, deleteDishReview, getUserDishReviews } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Star, Trash2 } from "lucide-react";
import Link from "next/link";

interface ReviewWithCanteen extends Review {
  canteenName: string;
}

interface DishReviewWithDish extends DishReview {
  dishName: string;
  canteenName: string;
}

export default function ReviewsPage() {
  const [canteenReviews, setCanteenReviews] = useState<ReviewWithCanteen[]>([]);
  const [dishReviews, setDishReviews] = useState<DishReviewWithDish[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'canteen' | 'dish'>('canteen');

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const userJson = localStorage.getItem('auth_user');
        if (token && userJson) {
          try {
            const decoded = JSON.parse(atob(token));
            const userId = decoded.userId;
            setUser(JSON.parse(userJson));

            const userReviews = await getUserReviews(userId);

            const reviewsWithCanteenName = await Promise.all(
              userReviews.map(async (review) => {
                const canteen = await getCanteenById(review.canteen_id);
                return {
                  ...review,
                  canteenName: canteen?.name || '未知食堂'
                };
              })
            );

            setCanteenReviews(reviewsWithCanteenName);

            const userDishReviewsData = await getUserDishReviews(userId);

            const dishReviewsWithInfo: DishReviewWithDish[] = await Promise.all(
              userDishReviewsData.map(async (review) => {
                const dish = await getDishById(review.dish_id);
                const canteen = await getCanteenById(review.canteen_id);
                return {
                  ...review,
                  dishName: dish?.name || '未知菜品',
                  canteenName: canteen?.name || '未知食堂'
                };
              })
            );

            setDishReviews(dishReviewsWithInfo);
          } catch (error) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }
      } catch (error) {
        console.error("获取评价历史失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleDeleteCanteenReview = async (reviewId: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (!confirm('确定要删除这条评价吗？')) {
      return;
    }

    setDeletingReviewId(reviewId);
    try {
      const result = await deleteReview(reviewId);
      if (result.success) {
        setCanteenReviews(canteenReviews.filter(review => review.id !== reviewId));
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

  const handleDeleteDishReview = async (reviewId: string) => {
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
        setDishReviews(dishReviews.filter(review => review.id !== reviewId));
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

  const canteenNonAnonymous = useMemo(() =>
    canteenReviews.filter(review => !review.is_anonymous),
    [canteenReviews]
  );

  const canteenAnonymous = useMemo(() =>
    canteenReviews.filter(review => review.is_anonymous),
    [canteenReviews]
  );

  const dishNonAnonymous = useMemo(() =>
    dishReviews.filter(review => !review.is_anonymous),
    [dishReviews]
  );

  const dishAnonymous = useMemo(() =>
    dishReviews.filter(review => review.is_anonymous),
    [dishReviews]
  );

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

  const renderReviewSection = (
    title: string,
    emoji: string,
    reviews: ReviewWithCanteen[] | DishReviewWithDish[],
    isAnonymous: boolean,
    onDelete: (id: string) => void,
    linkTo?: string | ((review: any) => string),
    extraInfo?: (review: any) => React.ReactNode
  ) => {
    const displayReviews = isAnonymous ? reviews.filter(r => r.is_anonymous) : reviews.filter(r => !r.is_anonymous);

    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span>{emoji}</span>
          {title}
        </h3>
        <div className="space-y-4">
          {displayReviews.length > 0 ? (
            displayReviews.map((review: any) => (
              <div key={review.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  {linkTo ? (
                    <div className="flex items-center gap-2">
                      {typeof linkTo === 'function' ? (
                        <Link
                          href={linkTo(review)}
                          className="font-semibold text-gray-900 hover:text-blue-500 transition-colors"
                        >
                          {review.dishName || review.canteenName}
                        </Link>
                      ) : (
                        <Link
                          href={linkTo}
                          className="font-semibold text-gray-900 hover:text-blue-500 transition-colors"
                        >
                          {review.dishName || review.canteenName}
                        </Link>
                      )}
                      {isAnonymous && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                          匿名
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{review.dishName || review.canteenName}</span>
                      {isAnonymous && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                          匿名
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                      {new Date(review.created_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => onDelete(review.id)}
                      disabled={deletingReviewId === review.id}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="删除评价"
                    >
                      {deletingReviewId === review.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-500"></div>
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-200'}`}
                    />
                  ))}
                </div>

                <p className="text-gray-600">{review.content}</p>

                {extraInfo && extraInfo(review)}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-gray-500">暂无{isAnonymous ? '匿名' : ''}{title.replace('非匿名', '').replace('匿名', '')}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回个人中心</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">评价历史</h2>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('canteen')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'canteen'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            食堂评价 ({canteenReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('dish')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'dish'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            菜品评价 ({dishReviews.length})
          </button>
        </div>

        {activeTab === 'canteen' && (
          <>
            {canteenReviews.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <p className="text-gray-500">暂无食堂评价记录</p>
                <p className="text-gray-400 text-sm mt-2">去评价食堂，记录你的美食体验吧！</p>
              </div>
            ) : (
              <div className="space-y-8">
                {renderReviewSection(
                  '非匿名评价',
                  '👤',
                  canteenReviews,
                  false,
                  handleDeleteCanteenReview,
                  (review: ReviewWithCanteen) => `/canteen/${review.canteen_id}`
                )}
                {renderReviewSection(
                  '匿名评价',
                  '😶',
                  canteenReviews,
                  true,
                  handleDeleteCanteenReview,
                  (review: ReviewWithCanteen) => `/canteen/${review.canteen_id}`
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'dish' && (
          <>
            {dishReviews.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <p className="text-gray-500">暂无菜品评价记录</p>
                <p className="text-gray-400 text-sm mt-2">去评价菜品，记录你的美食体验吧！</p>
              </div>
            ) : (
              <div className="space-y-8">
                {renderReviewSection(
                  '非匿名评价',
                  '👤',
                  dishReviews as any,
                  false,
                  handleDeleteDishReview,
                  (review: DishReviewWithDish) => `/dish/${review.dish_id}`,
                  (review: DishReviewWithDish) => (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-500">
                        所属食堂: {review.canteenName}
                      </span>
                    </div>
                  )
                )}
                {renderReviewSection(
                  '匿名评价',
                  '😶',
                  dishReviews as any,
                  true,
                  handleDeleteDishReview,
                  (review: DishReviewWithDish) => `/dish/${review.dish_id}`,
                  (review: DishReviewWithDish) => (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-500">
                        所属食堂: {review.canteenName}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
