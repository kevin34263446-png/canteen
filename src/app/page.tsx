'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getCanteens, getCanteenRating, getCanteenDisplayName } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";

export default function Home() {
  const [canteenData, setCanteenData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCanteenData = async () => {
    try {
      const canteens = await getCanteens();
      
      // 并行获取所有食堂的评分
      const data = await Promise.all(
        canteens.map(async (canteen) => {
          const rating = await getCanteenRating(canteen.id);
          return { ...canteen, rating };
        })
      );
      
      setCanteenData(data);
    } catch (error) {
      console.error('获取食堂数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanteenData();
    
    // 每30秒刷新一次评分数据
    const interval = setInterval(fetchCanteenData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-transparent">
      <Navbar />

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 rounded-[2rem] border border-white/50 bg-white/55 backdrop-blur-md shadow-[0_20px_60px_rgba(120,88,58,0.08)] px-6 py-8">
          <p className="text-sm tracking-[0.2em] text-amber-700/80 uppercase mb-3">Campus Dining</p>
          <h2 className="text-3xl font-semibold text-stone-900 mb-2">食堂列表</h2>
          <p className="text-stone-600">更柔和的氛围，更有层次的校园餐饮界面。</p>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white/70 backdrop-blur-md rounded-[1.75rem] shadow-[0_16px_50px_rgba(120,88,58,0.08)] border border-white/60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        ) : canteenData.length === 0 ? (
          <div className="text-center py-12 bg-white/70 backdrop-blur-md rounded-[1.75rem] shadow-[0_16px_50px_rgba(120,88,58,0.08)] border border-white/60">
            <span className="text-4xl text-gray-300 block mb-4">🍽️</span>
            <p className="text-gray-500">暂无食堂数据</p>
            <p className="text-gray-400 text-sm mt-2">请在 Supabase 数据库中添加食堂信息</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canteenData.map((canteen) => (
              <Link
                key={canteen.id}
                href={`/canteen/${canteen.id}`}
                className="bg-white/78 backdrop-blur-md rounded-[1.5rem] border border-white/70 shadow-[0_16px_50px_rgba(120,88,58,0.08)] hover:shadow-[0_22px_60px_rgba(120,88,58,0.14)] transition-all duration-300 overflow-hidden block"
              >
                {/* 食堂图片 */}
                <div className="h-48 bg-gray-200 relative">
                  {canteen.image_url ? (
                    <Image
                      src={canteen.image_url}
                      alt={canteen.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <span className="text-4xl text-blue-300">🍽️</span>
                    </div>
                  )}
                </div>

                {/* 食堂信息 */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {getCanteenDisplayName(canteen.id, canteen.name)}
                  </h3>

                  {canteen.location && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
                      <span>📍</span>
                      <span>{canteen.location}</span>
                    </div>
                  )}

                  {canteen.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {canteen.description}
                    </p>
                  )}

                  {/* 评分和操作按钮 */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {/* 星级评分显示 */}
                      <StarRating score={canteen.rating} size="md" />
                      <span className="text-sm font-medium text-gray-700">
                        {canteen.rating !== null ? `${canteen.rating}分` : "暂无评分"}
                      </span>
                    </div>
                    <span className="text-blue-500 text-sm font-medium hover:text-blue-600">
                      查看详情 →
                    </span>
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
