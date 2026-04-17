'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getCanteenRanking, getDishRanking } from '@/lib/supabase';

type RankingTab = 'canteen' | 'dish';

const RankingPage = () => {
  const [activeTab, setActiveTab] = useState<RankingTab>('canteen');
  const [canteenRanking, setCanteenRanking] = useState<any[]>([]);
  const [dishRanking, setDishRanking] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCanteenRanking = async () => {
    try {
      const data = await getCanteenRanking();
      
      const rankedData = data.map((canteen, index) => {
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
      
      setCanteenRanking(rankedData);
    } catch (error) {
      console.error('获取食堂排行榜失败:', error);
    }
  };

  const fetchDishRanking = async () => {
    try {
      const data = await getDishRanking();
      
      const rankedData = data.map((dish, index) => {
        let rank = 1;
        for (let i = 0; i < index; i++) {
          if (data[i].rating > dish.rating) {
            rank++;
          }
        }
        return {
          ...dish,
          rank
        };
      });
      
      setDishRanking(rankedData);
    } catch (error) {
      console.error('获取菜品排行榜失败:', error);
    }
  };

  const fetchRanking = async () => {
    setIsLoading(true);
    await Promise.all([fetchCanteenRanking(), fetchDishRanking()]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRanking();
    
    const interval = setInterval(fetchRanking, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const renderCanteenRanking = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {canteenRanking.map((canteen) => (
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
  );

  const renderDishRanking = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {dishRanking.map((dish) => (
        <div 
          key={dish.id} 
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          <div className="relative h-48 overflow-hidden">
            {dish.image_url ? (
              <Image
                src={dish.image_url}
                alt={dish.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <span className="text-6xl">🍜</span>
              </div>
            )}
            <div className="absolute top-3 left-3 bg-yellow-400 text-white font-bold px-3 py-1 rounded-full flex items-center space-x-1">
              <span>#{dish.rank}</span>
            </div>
          </div>
          
          <div className="p-4">
            <Link href={`/dish/${dish.id}`} className="block">
              <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                {dish.name}
              </h3>
            </Link>
            
            <div className="flex items-center mb-2">
              <div className="flex items-center mr-3">
                <span className="text-yellow-400 mr-1">★</span>
                <span className="font-medium text-gray-900">{dish.rating.toFixed(1)}</span>
              </div>
              <div className="text-lg font-semibold text-green-600">
                ¥{dish.price.toFixed(2)}
              </div>
            </div>
            
            {dish.tags && dish.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {dish.tags.slice(0, 3).map((tag: string, index: number) => (
                  <span 
                    key={index}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {dish.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {dish.description}
              </p>
            )}
            
            <Link 
              href={`/dish/${dish.id}`} 
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
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
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
          排行榜
        </h1>
        <p className="text-gray-600">
          基于用户评价的食堂和菜品排名
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('canteen')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'canteen'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🍽️ 食堂排行榜
          </button>
          <button
            onClick={() => setActiveTab('dish')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'dish'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🍜 菜品排行榜
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {activeTab === 'canteen' && renderCanteenRanking()}
          {activeTab === 'dish' && renderDishRanking()}
        </>
      )}

      {!isLoading && activeTab === 'canteen' && canteenRanking.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">暂无食堂数据</p>
        </div>
      )}

      {!isLoading && activeTab === 'dish' && dishRanking.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">暂无菜品数据</p>
        </div>
      )}
    </div>
  );
};

export default RankingPage;