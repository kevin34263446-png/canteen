"use client";

import { useState, useEffect } from "react";
import { Canteen, getCanteenById, getCanteenRating } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Star, Heart } from "lucide-react";
import Link from "next/link";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<(Canteen & { rating: number })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const decoded = JSON.parse(atob(token));
          const userId = decoded.userId;
          
          // 从本地存储获取收藏列表
          const favoritesKey = `favorites_${userId}`;
          const favoriteIds = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
          
          // 获取每个食堂的详情和评分
          const favoritesWithDetails = await Promise.all(
            favoriteIds.map(async (id: string) => {
              const canteen = await getCanteenById(id);
              if (canteen) {
                const rating = await getCanteenRating(id);
                return {
                  ...canteen,
                  rating
                };
              }
              return null;
            })
          );
          
          // 过滤掉 null 值
          const validFavorites = favoritesWithDetails.filter((item): item is (Canteen & { rating: number }) => item !== null);
          
          setFavorites(validFavorites);
        }
      } catch (error) {
        console.error("获取收藏失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

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

      {/* 收藏列表 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">我的收藏</h2>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无收藏</p>
            <p className="text-gray-400 text-sm mt-2">去发现并收藏你喜欢的食堂吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {favorites.map((canteen) => (
              <Link
                key={canteen.id}
                href={`/canteen/${canteen.id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-48 bg-gray-200 relative">
                  {canteen.image_url ? (
                    <img
                      src={canteen.image_url}
                      alt={canteen.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <Heart className="w-16 h-16 text-blue-300" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{canteen.name}</h3>
                  {canteen.location && (
                    <p className="text-gray-500 text-sm mb-4">{canteen.location}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-gray-600">{canteen.rating.toFixed(1)}</span>
                    </div>
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
