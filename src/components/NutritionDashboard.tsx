'use client';

import { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface NutritionDashboardProps {
  items: FoodItem[];
}

const NutritionDashboard = ({ items }: NutritionDashboardProps) => {
  const [totalNutrition, setTotalNutrition] = useState({
    carbs: 0,
    protein: 0,
    fat: 0,
    fiber: 0,
    calories: 0
  });

  const [goals] = useState({
    carbs: 300,
    protein: 150,
    fat: 80,
    fiber: 30,
    calories: 2000
  });

  const chartRef = useRef<any>(null);

  useEffect(() => {
    const totals = items.reduce(
      (acc, item) => ({
        carbs: acc.carbs + item.nutrition.carbs,
        protein: acc.protein + item.nutrition.protein,
        fat: acc.fat + item.nutrition.fat,
        fiber: acc.fiber + item.nutrition.fiber,
        calories: acc.calories + item.nutrition.calories
      }),
      { carbs: 0, protein: 0, fat: 0, fiber: 0, calories: 0 }
    );
    setTotalNutrition(totals);
  }, [items]);

  const getOption = () => {
    const maxValues = [goals.carbs, goals.protein, goals.fat, goals.fiber, goals.calories / 20];
    const values = [
      Math.min(totalNutrition.carbs / goals.carbs * 100, 100),
      Math.min(totalNutrition.protein / goals.protein * 100, 100),
      Math.min(totalNutrition.fat / goals.fat * 100, 100),
      Math.min(totalNutrition.fiber / goals.fiber * 100, 100),
      Math.min(totalNutrition.calories / goals.calories * 100, 100)
    ];

    return {
      backgroundColor: 'transparent',
      radar: {
        indicator: [
          { name: '碳水化合物', max: 100, color: '#67e8f9' },
          { name: '蛋白质', max: 100, color: '#a78bfa' },
          { name: '脂肪', max: 100, color: '#f472b6' },
          { name: '膳食纤维', max: 100, color: '#4ade80' },
          { name: '热量', max: 100, color: '#fbbf24' }
        ],
        center: ['50%', '55%'],
        radius: '65%',
        splitNumber: 5,
        axisName: {
          color: '#e2e8f0',
          fontSize: 12,
          fontWeight: 'bold'
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(148, 163, 184, 0.2)'
          }
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(148, 163, 184, 0.05)', 'transparent']
          }
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(148, 163, 184, 0.3)'
          }
        }
      },
      series: [
        {
          name: '营养摄入',
          type: 'radar',
          data: [
            {
              value: values,
              name: '今日摄入',
              areaStyle: {
                color: 'rgba(99, 102, 241, 0.3)'
              },
              lineStyle: {
                color: '#6366f1',
                width: 3
              },
              itemStyle: {
                color: '#818cf8'
              }
            }
          ],
          animationEasing: 'elasticOut',
          animationDelay: function (idx: number) {
            return idx * 100;
          }
        }
      ]
    };
  };

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage >= 90) return 'from-green-500 to-emerald-500';
    if (percentage >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-cyan-500 to-blue-500';
  };

  const nutrients = [
    { key: 'protein' as const, name: '蛋白质', icon: '💪', unit: 'g' },
    { key: 'carbs' as const, name: '碳水化合物', icon: '⚡', unit: 'g' },
    { key: 'fat' as const, name: '脂肪', icon: '🔥', unit: 'g' },
    { key: 'fiber' as const, name: '膳食纤维', icon: '🌿', unit: 'g' },
    { key: 'calories' as const, name: '热量', icon: '☀️', unit: 'kcal' }
  ];

  return (
    <div className="fixed top-20 right-6 z-40 w-80">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/10">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🎯</span>
            精准营养战力看板
          </h3>
          <p className="text-gray-400 text-sm mt-1">今日营养摄入追踪</p>
        </div>

        <div className="p-4">
          <div className="h-64 mb-4">
            <ReactECharts
              ref={chartRef}
              option={getOption()}
              style={{ height: '100%', width: '100%' }}
              notMerge={false}
              lazyUpdate={true}
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <span>📊</span>
              今日健身目标
            </h4>
            {nutrients.map((nutrient, index) => {
              const current = totalNutrition[nutrient.key];
              const goal = goals[nutrient.key];
              const percentage = Math.min((current / goal) * 100, 100);

              return (
                <motion.div
                  key={nutrient.key}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 rounded-xl p-3 border border-white/5"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300 flex items-center gap-2">
                      <span>{nutrient.icon}</span>
                      {nutrient.name}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {current.toFixed(0)} / {goal} {nutrient.unit}
                      <span className="text-xs text-gray-400 ml-1">
                        ({percentage.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${getProgressColor(current, goal)} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">总战力指数</p>
              <motion.p
                key={items.length}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
              >
                {Math.round(
                  ((totalNutrition.protein / goals.protein +
                    totalNutrition.carbs / goals.carbs +
                    totalNutrition.fat / goals.fat +
                    totalNutrition.fiber / goals.fiber +
                    totalNutrition.calories / goals.calories) /
                    5) *
                    1000
                )}
              </motion.p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">已选菜品</p>
              <p className="text-2xl font-bold text-white">{items.length}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NutritionDashboard;
