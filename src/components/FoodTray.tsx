'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Dish } from '@/lib/supabase';

interface FoodTrayProps {
  dishes: Dish[];
  onOrder: (order: OrderData) => void;
}

interface OrderData {
  items: OrderItem[];
  pickupTime: string;
  canteenId: string;
}

interface OrderItem {
  dishId: string;
  dishName: string;
  quantity: number;
  price: number;
}

interface TrayItem extends OrderItem {
  id: string;
  emoji: string;
}

const FoodTray = ({ dishes, onOrder }: FoodTrayProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [trayItems, setTrayItems] = useState<TrayItem[]>([]);
  const [pickupTime, setPickupTime] = useState('');
  const [canteenId, setCanteenId] = useState('');

  const foodEmojis = {
    '炒菜': '🍲',
    '面食': '🍜',
    '小吃': '🍢',
    '套餐': '🍱',
    '轻食': '🥗',
    '西餐': '🍝',
    '盖饭': '🍚',
    '粉面': '🍜',
    '早餐': '🥪',
    '饮品': '🥤',
    '沙拉': '🥗'
  };

  const getEmojiForCategory = (category: string) => {
    return foodEmojis[category as keyof typeof foodEmojis] || '🍽️';
  };

  const addToTray = (dish: Dish) => {
    const existingItem = trayItems.find(item => item.dishId === dish.id);
    
    if (existingItem) {
      setTrayItems(trayItems.map(item => 
        item.dishId === dish.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      const newItem: TrayItem = {
        id: `${dish.id}-${Date.now()}`,
        dishId: dish.id,
        dishName: dish.name,
        quantity: 1,
        price: dish.price,
        emoji: getEmojiForCategory(dish.category)
      };
      setTrayItems([...trayItems, newItem]);
    }
  };

  const removeFromTray = (id: string) => {
    setTrayItems(trayItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, change: number) => {
    setTrayItems(trayItems.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
  };

  const clearTray = () => {
    setTrayItems([]);
  };

  const calculateTotal = () => {
    return trayItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    setIsOrderModalOpen(true);
  };

  const handleConfirmOrder = () => {
    if (!pickupTime || !canteenId) {
      alert('请选择取餐时间和食堂');
      return;
    }

    const order: OrderData = {
      items: trayItems.map(item => ({
        dishId: item.dishId,
        dishName: item.dishName,
        quantity: item.quantity,
        price: item.price
      })),
      pickupTime,
      canteenId
    };

    onOrder(order);
    clearTray();
    setIsOrderModalOpen(false);
    setIsOpen(false);
  };

  // 生成未来24小时的取餐时间选项
  const generatePickupTimes = () => {
    const times = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      times.push(`${hours}:${minutes}`);
    }
    
    return times;
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold shadow-lg hover:shadow-cyan-500/50 transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span>我的托盘</span>
            {trayItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {trayItems.length}
              </span>
            )}
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-80 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🎁</span>
                  我的托盘
                </h3>
                {trayItems.length > 0 && (
                  <button
                    onClick={clearTray}
                    className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                  >
                    清空
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto p-4">
              {trayItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3 opacity-50">✨</div>
                  <p>托盘是空的</p>
                  <p className="text-sm">浏览菜品时点击添加按钮</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {trayItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.emoji}</span>
                          <div>
                            <span className="text-white font-medium block">{item.dishName}</span>
                            <span className="text-gray-400 text-sm">¥{item.price.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                          >
                            -  
                          </button>
                          <span className="text-white min-w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromTray(item.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors p-1"
                          >
                            ✕
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {trayItems.length > 0 && (
              <div className="p-4 border-t border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-medium">总计</span>
                  <span className="text-cyan-300 font-bold">¥{calculateTotal().toFixed(2)}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold shadow-lg"
                >
                  预约点餐
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {isOrderModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOrderModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📅</span>
                预约点餐
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">选择食堂</label>
                  <select
                    value={canteenId}
                    onChange={(e) => setCanteenId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">请选择食堂</option>
                    <option value="1">学一·启航</option>
                    <option value="2">学二·银河</option>
                    <option value="3">学三·极光</option>
                    <option value="4">学四·繁星</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">取餐时间</label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">请选择时间</option>
                    {generatePickupTimes().map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-2">订单详情</h4>
                  {trayItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-gray-300">{item.dishName} x{item.quantity}</span>
                      <span className="text-white">¥{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2 font-bold">
                    <span className="text-white">总计</span>
                    <span className="text-cyan-300">¥{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsOrderModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmOrder}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:shadow-cyan-500/50 transition-all"
                  >
                    确认预约
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FoodTray;