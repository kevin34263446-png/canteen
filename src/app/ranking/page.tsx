'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getCanteenRanking } from '@/lib/supabase';

const RankingPage = () => {
  const [ranking, setRanking] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRanking = async () => {
    try {
      const data = await getCanteenRanking();
      
      // 实现竞争排名（1224排名）逻辑
      const rankedData = data.map((canteen, index) => {
        // 找到当前分数的第一个出现位置
        let rank = 1;
        for (let i = 0; i < index; i++) {
          if (data[i].rating > canteen.rating) {
            rank++;
          }
        }
        return {
          ...canteen,
          rank
        };
      });
      
      setRanking(rankedData);
    } catch (error) {
      console.error('获取排行榜失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
    
    // 每30秒刷新一次排行榜数据
    const interval = setInterval(fetchRanking, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* 返回按钮 */}
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span>←</span>
          <span>返回上一页</span>
        </button>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          食堂排行榜
        </h1>
        <p className="text-gray-600">
          基于用户评价的食堂排名
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ranking.map((canteen, index) => (
          <div 
            key={canteen.id} 
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="relative h-48 overflow-hidden">
              <Image
                src={canteen.image_url || 'https://via.placeholder.com/600'}
                alt={canteen.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute top-3 left-3 bg-yellow-400 text-white font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                <span>#{canteen.rank}</span>
              </div>
            </div>
            
            <div className="p-4">
              <Link href={`/canteen/${canteen.id}`} className="block">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                  {canteen.name}
                </h3>
              </Link>
              
              <div className="flex items-center mb-2">
                <div className="flex items-center mr-3">
                  <span className="text-yellow-400 mr-1">★</span>
                  <span className="font-medium text-gray-900">{canteen.rating.toFixed(1)}</span>
                </div>
                {canteen.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-1">📍</span>
                    <span>{canteen.location}</span>
                  </div>
                )}
              </div>
              
              {canteen.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {canteen.description}
                </p>
              )}
              
              <Link 
                href={`/canteen/${canteen.id}`} 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                查看详情
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {ranking.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">暂无食堂数据</p>
        </div>
      )}
    </div>
  );
};

export default RankingPage;