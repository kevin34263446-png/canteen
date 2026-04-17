'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getCanteens, getCanteenRating, getCanteenDisplayName } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";
import NebulaBackground from "@/components/NebulaBackground";
import CanteenHeatmap from "@/components/CanteenHeatmap";
import NutritionDashboard from "@/components/NutritionDashboard";
import AIAssistant from "@/components/AIAssistant";
import { Sparkles } from "lucide-react";

interface FoodItem {
  id: string;
  name: string;
  color: string;
  emoji: string;
  nutrition: {
    carbs: number;
    protein: number;
    fat: number;
    fiber: number;
    calories: number;
  };
}

export default function Home() {
  const [canteenData, setCanteenData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showNutrition, setShowNutrition] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const fetchCanteenData = async () => {
    try {
      const canteens = await getCanteens();
      
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
    
    const interval = setInterval(fetchCanteenData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <NebulaBackground />
      <Navbar />
      <div className="fixed top-20 left-6 z-40 flex flex-col gap-2">
        <button
          onClick={() => setShowNutrition(!showNutrition)}
          className={`px-4 py-3 rounded-2xl backdrop-blur-xl border transition-all ${
            showNutrition 
              ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white border-transparent shadow-lg' 
              : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>🎯</span>
            <span>营养看板</span>
            {showNutrition && <span>✓</span>}
          </span>
        </button>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-4 py-3 rounded-2xl backdrop-blur-xl border transition-all ${
            showHeatmap 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-transparent shadow-lg' 
              : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>📊</span>
            <span>热力图</span>
            {showHeatmap && <span>✓</span>}
          </span>
        </button>
      </div>

      {showNutrition && <NutritionDashboard />}
      {showHeatmap && <CanteenHeatmap />}
      <AIAssistant isOpen={showAIAssistant} onClose={() => setShowAIAssistant(false)} />
      
      <button
        onClick={() => setShowAIAssistant(true)}
        className="fixed bottom-8 right-8 z-[999] w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:shadow-[0_0_40px_rgba(139,92,246,0.8)] hover:scale-110 transition-all flex items-center justify-center animate-pulse"
      >
        <Sparkles className="w-8 h-8" />
      </button>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 rounded-[2rem] border border-white/15 bg-white/8 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] px-6 py-8">
          <p className="text-sm tracking-[0.2em] text-cyan-300/80 uppercase mb-3">Gastronomy Galaxy</p>
          <h2 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            美食星云
          </h2>
          <p className="text-gray-300">探索美食宇宙，发现校园美味的无限可能</p>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white/5 backdrop-blur-xl rounded-[1.75rem] shadow-[0_16px_50px_rgba(0,0,0,0.3)] border border-white/10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-gray-300">加载中...</p>
          </div>
        ) : canteenData.length === 0 ? (
          <div className="text-center py-12 bg-white/5 backdrop-blur-xl rounded-[1.75rem] shadow-[0_16px_50px_rgba(0,0,0,0.3)] border border-white/10">
            <span className="text-5xl block mb-4">🚀</span>
            <p className="text-gray-300">暂无食堂数据</p>
            <p className="text-gray-400 text-sm mt-2">请在 Supabase 数据库中添加食堂信息</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canteenData.map((canteen) => (
              <Link
                key={canteen.id}
                href={`/canteen/${canteen.id}`}
                className="group bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_22px_60px_rgba(0,255,255,0.15)] hover:border-cyan-400/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden block"
              >
                <div className="h-48 bg-gradient-to-br from-slate-800/50 to-slate-900/50 relative overflow-hidden">
                  {canteen.image_url ? (
                    <Image
                      src={canteen.image_url}
                      alt={canteen.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-6xl opacity-50 animate-pulse">✨</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {getCanteenDisplayName(canteen.id, canteen.name)}
                  </h3>

                  {canteen.location && (
                    <div className="flex items-center gap-1 text-gray-400 text-sm mb-2">
                      <span>📍</span>
                      <span>{canteen.location}</span>
                    </div>
                  )}

                  {canteen.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {canteen.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <StarRating score={canteen.rating} size="md" />
                      <span className="text-sm font-medium text-gray-300">
                        {canteen.rating !== null ? `${canteen.rating}分` : "暂无评分"}
                      </span>
                    </div>
                    <span className="text-cyan-400 text-sm font-medium hover:text-cyan-300 flex items-center gap-1">
                      探索 <span className="transition-transform group-hover:translate-x-1">→</span>
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
