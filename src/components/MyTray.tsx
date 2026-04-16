'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

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

interface MyTrayProps {
  items: FoodItem[];
  onAddItem: (food: FoodItem) => void;
  onRemoveItem: (id: string) => void;
  onClearTray: () => void;
}

const MyTray = ({ items, onAddItem, onRemoveItem, onClearTray }: MyTrayProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const foodOptions: FoodItem[] = [
    { 
      id: '1', 
      name: 'Tech Ramen', 
      color: '#ff6b6b', 
      emoji: '🍜',
      nutrition: { carbs: 65, protein: 25, fat: 15, fiber: 5, calories: 480 }
    },
    { 
      id: '2', 
      name: 'AI Burger', 
      color: '#ffd93d', 
      emoji: '🍔',
      nutrition: { carbs: 45, protein: 35, fat: 30, fiber: 3, calories: 620 }
    },
    { 
      id: '3', 
      name: 'Sushi Matrix', 
      color: '#4ecdc4', 
      emoji: '🍣',
      nutrition: { carbs: 38, protein: 28, fat: 8, fiber: 2, calories: 340 }
    },
    { 
      id: '4', 
      name: 'Pizza Galaxy', 
      color: '#6c5ce7', 
      emoji: '🍕',
      nutrition: { carbs: 75, protein: 22, fat: 35, fiber: 4, calories: 720 }
    },
    { 
      id: '5', 
      name: 'Taco Nova', 
      color: '#ff7675', 
      emoji: '🌮',
      nutrition: { carbs: 42, protein: 18, fat: 20, fiber: 6, calories: 410 }
    }
  ];

  const addToTray = (food: FoodItem) => {
    onAddItem({ ...food, id: `${food.id}-${Date.now()}` });
  };

  const removeFromTray = (id: string) => {
    onRemoveItem(id);
  };

  const clearTray = () => {
    onClearTray();
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        <div className="flex gap-2">
          {foodOptions.map((food) => (
            <motion.button
              key={food.id}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => addToTray(food)}
              className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-3xl shadow-lg hover:shadow-cyan-500/25 hover:border-cyan-400/50 transition-all cursor-pointer"
              title={food.name}
            >
              {food.emoji}
            </motion.button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold shadow-lg hover:shadow-cyan-500/50 transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span>我的托盘</span>
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {items.length}
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
                {items.length > 0 && (
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
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3 opacity-50">✨</div>
                  <p>托盘是空的</p>
                  <p className="text-sm">点击下方按钮添加美食吧！</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.emoji}</span>
                          <span className="text-white font-medium">{item.name}</span>
                        </div>
                        <button
                          onClick={() => removeFromTray(item.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors p-1"
                        >
                          ✕
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold shadow-lg"
                >
                  结算 ({items.length} 件)
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MyTray;
