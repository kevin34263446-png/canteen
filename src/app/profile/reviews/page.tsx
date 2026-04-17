'use client';

import { useState, useEffect } from "react";
import { Review, getCanteenById, getUserReviews, deleteReview } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Star, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<(Review & { canteenName: string })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

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
            
            // 获取用户评价历史
            const userReviews = await getUserReviews(userId);

            // 获取食堂名称
            const reviewsWithCanteenName = await Promise.all(
              userReviews.map(async (review) => {
                const canteen = await getCanteenById(review.canteen_id);
                return {
                  ...review,
                  canteenName: canteen?.name || '未知食堂'
                };
              })
            );

            setReviews(reviewsWithCanteenName);
          } catch (error) {
            // 清除无效的存储数据
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
        // 从列表中移除删除的评价
        setReviews(reviews.filter(review => review.id !== reviewId));
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

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* 头部导航 */}
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

      {/* 评价历史列表 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">评价历史</h2>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500">暂无评价记录</p>
            <p className="text-gray-400 text-sm mt-2">去评价食堂，记录你的美食体验吧！</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 非匿名评价 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span>👤</span>
                非匿名评价
              </h3>
              <div className="space-y-4">
                {reviews.filter(review => !review.is_anonymous).length > 0 ? (
                  reviews.filter(review => !review.is_anonymous).map((review) => (
                    <div key={review.id} className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Link 
                          href={`/canteen/${review.canteen_id}`} 
                          className="font-semibold text-gray-900 hover:text-blue-500 transition-colors"
                        >
                          {review.canteenName}
                        </Link>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-400">
                            {new Date(review.created_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
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
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <p className="text-gray-500">暂无非匿名评价</p>
                  </div>
                )}
              </div>
            </div>

            {/* 匿名评价 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span>😶</span>
                匿名评价
              </h3>
              <div className="space-y-4">
                {reviews.filter(review => review.is_anonymous).length > 0 ? (
                  reviews.filter(review => review.is_anonymous).map((review) => (
                    <div key={review.id} className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/canteen/${review.canteen_id}`} 
                            className="font-semibold text-gray-900 hover:text-blue-500 transition-colors"
                          >
                            {review.canteenName}
                          </Link>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                            匿名
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-400">
                            {new Date(review.created_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
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
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <p className="text-gray-500">暂无匿名评价</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
