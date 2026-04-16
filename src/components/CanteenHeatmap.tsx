'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CanteenData {
  name: string;
  capacity: number;
  current: number;
  queue: number;
  status: 'low' | 'medium' | 'high';
}

const CanteenHeatmap = () => {
  const [canteens, setCanteens] = useState<CanteenData[]>([]);
  const [currentTime, setCurrentTime] = useState('');

  const canteenNames = [
    '学一食堂-麻辣烫',
    '二楼西餐窗口',
    '清真餐厅',
    '学二食堂-早餐',
    '三楼特色餐厅',
    '南区美食广场'
  ];

  const generateCanteenData = () => {
    const hour = new Date().getHours();
    let multiplier = 0.3;

    if (hour >= 11 && hour < 13) multiplier = 1;
    else if (hour >= 17 && hour < 19) multiplier = 1;
    else if (hour >= 7 && hour < 9) multiplier = 0.8;
    else if (hour >= 9 && hour < 11) multiplier = 0.4;
    else if (hour >= 13 && hour < 17) multiplier = 0.3;
    else if (hour >= 19 && hour < 21) multiplier = 0.5;

    return canteenNames.map(name => {
      const capacity = 100 + Math.floor(Math.random() * 150);
      const current = Math.floor(capacity * multiplier * (0.6 + Math.random() * 0.4));
      const queue = Math.floor((current / capacity) * 15 * (0.5 + Math.random()));
      
      let status: 'low' | 'medium' | 'high' = 'low';
      const ratio = current / capacity;
      if (ratio > 0.7) status = 'high';
      else if (ratio > 0.4) status = 'medium';

      return { name, capacity, current, queue, status };
    });
  };

  const updateTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  useEffect(() => {
    setCanteens(generateCanteenData());
    updateTime();

    const timeInterval = setInterval(updateTime, 1000);
    const dataInterval = setInterval(() => {
      setCanteens(generateCanteenData());
    }, 10000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'from-green-500 to-emerald-500';
      case 'medium': return 'from-yellow-500 to-orange-500';
      case 'high': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'low': return '畅通';
      case 'medium': return '适中';
      case 'high': return '拥挤';
      default: return '未知';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-5xl mx-auto px-4 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-6 pointer-events-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📊</span>
                食堂热力图 · IoT 数据可视化
              </h3>
              <p className="text-gray-400 text-sm mt-1">实时监控食堂拥挤度与排队情况</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {currentTime}
              </div>
              <div className="text-xs text-gray-500">实时更新</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {canteens.map((canteen, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 rounded-2xl border border-white/10 p-4 overflow-hidden relative"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getStatusColor(canteen.status)}`} />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-white text-sm line-clamp-1">
                      {canteen.name}
                    </h4>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${getStatusColor(canteen.status)} text-white`}>
                      {getStatusText(canteen.status)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>拥挤度</span>
                        <span>{Math.round((canteen.current / canteen.capacity) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${getStatusColor(canteen.status)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(canteen.current / canteen.capacity) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>👥</span>
                        <span>{canteen.current}/{canteen.capacity}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>🕐</span>
                        <span>排队 {canteen.queue} 人</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center gap-8 mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
              <span className="text-xs text-gray-400">畅通 (&lt;40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500" />
              <span className="text-xs text-gray-400">适中 (40%-70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500" />
              <span className="text-xs text-gray-400">拥挤 (&gt;70%)</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CanteenHeatmap;
