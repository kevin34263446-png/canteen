"use client";

import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Star, Clock, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCanteenById, getCanteenReviews, getCanteenRating, Review } from "@/lib/supabase";
import ReviewForm from "@/components/ReviewForm";
import Navbar from "@/components/Navbar";

interface CanteenDetailPageProps {
  params: {
    id: string;
  };
}

export default function CanteenDetailPage({ params }: CanteenDetailPageProps) {
  const [canteen, setCanteen] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [canteenData, reviewsData, ratingData] = await Promise.all([
          getCanteenById(params.id),
          getCanteenReviews(params.id),
          getCanteenRating(params.id),
        ]);

        if (!canteenData) {
          notFound();
        }

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
  }, [params.id]);

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
            <ArrowLeft className="w-5 h-5" />
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
              <img
                src={canteen.image_url}
                alt={canteen.name}
                className="w-full h-full object-cover"
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
                  <MapPin className="w-5 h-5" />
                  <span>{canteen.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span>营业时间: 06:30 - 22:00</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-gray-500">({reviews.length} 条评价)</span>
              </div>
            </div>

            {canteen.description && (
              <div className="prose max-w-none">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">食堂介绍</h2>
                <p className="text-gray-600 leading-relaxed">{canteen.description}</p>
              </div>
            )}
          </div>
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
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-sm text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
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
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
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
