"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageSquare, Plus, X, Image as ImageIcon, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import NebulaBackground from "@/components/NebulaBackground";
import ReactECharts from "echarts-for-react";

interface Post {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  tags: string[];
  ratings: {
    value: number;
    appearance: number;
    taste: number;
    portion: number;
    health: number;
  };
  canteen: string;
  stall: string;
  createdAt: string;
  commentList: {
    author: string;
    content: string;
    time: string;
  }[];
}

const mockPosts: Post[] = [
  {
    id: "1",
    title: "一食堂的宫保鸡丁绝了！",
    description: "今天终于吃到了传说中的宫保鸡丁，鸡肉嫩滑，花生香脆，辣中带甜，超级下饭！",
    imageUrl: "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=delicious%20kung%20pao%20chicken%20in%20canteen%20with%20chopsticks&image_size=square",
    author: { name: "美食探索家", avatar: "美" },
    likes: 128,
    comments: 23,
    tags: ["川菜", "下饭"],
    ratings: {
      value: 4.5,
      appearance: 4.0,
      taste: 4.8,
      portion: 4.2,
      health: 3.5
    },
    canteen: "第一食堂",
    stall: "川味炒菜",
    createdAt: "2小时前",
    commentList: [
      { author: "吃货小王", content: "看起来好好吃！", time: "1小时前" },
      { author: "美食达人", content: "下次去试试", time: "30分钟前" }
    ]
  },
  {
    id: "2",
    title: "轻食沙拉，减脂期的救星！",
    description: "第三食堂的轻食西餐档口，鸡胸肉凯撒沙拉分量超足，搭配秘制酱汁，健康又美味！",
    imageUrl: "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=healthy%20salad%20bowl%20with%20chicken%20breast%20and%20vegetables&image_size=portrait_4_3",
    author: { name: "健身达人", avatar: "健" },
    likes: 89,
    comments: 15,
    tags: ["轻食", "健康"],
    ratings: {
      value: 4.8,
      appearance: 4.5,
      taste: 4.2,
      portion: 4.0,
      health: 5.0
    },
    canteen: "第三食堂",
    stall: "轻食西餐",
    createdAt: "5小时前",
    commentList: [
      { author: "减脂少女", content: "这个颜值太高了！", time: "4小时前" }
    ]
  },
  {
    id: "3",
    title: "隐藏菜单：双拼烧腊饭",
    description: "一般人我不告诉他！第二食堂的烧腊饭窗口可以双拼，叉烧加烧鸭，双倍快乐！",
    imageUrl: "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=roast%20pork%20and%20duck%20rice%20set%20meal&image_size=landscape_4_3",
    author: { name: "吃货小王", avatar: "吃" },
    likes: 256,
    comments: 47,
    tags: ["烧腊", "隐藏菜单"],
    ratings: {
      value: 4.3,
      appearance: 4.2,
      taste: 5.0,
      portion: 4.8,
      health: 3.0
    },
    canteen: "第二食堂",
    stall: "烧腊饭",
    createdAt: "1天前",
    commentList: [
      { author: "烧腊爱好者", content: "这个真的绝了！", time: "20小时前" },
      { author: "美食记者", content: "已收藏，明天就去！", time: "18小时前" }
    ]
  },
  {
    id: "4",
    title: "杨枝甘露，下午茶首选！",
    description: "第二食堂的小吃甜品档口，杨枝甘露真的绝了！芒果超多，椰奶超浓，解腻又清爽～",
    imageUrl: "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=mango%20pomelo%20dessert%20yangzhiganlu%20in%20glass%20cup&image_size=square",
    author: { name: "甜品控", avatar: "甜" },
    likes: 145,
    comments: 28,
    tags: ["甜品", "下午茶"],
    ratings: {
      value: 4.1,
      appearance: 4.8,
      taste: 4.9,
      portion: 3.8,
      health: 3.5
    },
    canteen: "第二食堂",
    stall: "小吃甜品",
    createdAt: "2天前",
    commentList: [
      { author: "奶茶少女", content: "这个好好看！", time: "1天前" }
    ]
  }
];

const categories = [
  { id: "all", name: "✨ 全部" },
  { id: "hot", name: "🔥 热门" },
  { id: "light", name: "🥗 轻食主义" },
  { id: "spicy", name: "🌶️ 嗜辣星人" },
  { id: "dessert", name: "🧁 甜点控" }
];

export default function DiscoverPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);

  const toggleLike = (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newLiked = new Set(likedPosts);
    if (newLiked.has(postId)) {
      newLiked.delete(postId);
    } else {
      newLiked.add(postId);
    }
    setLikedPosts(newLiked);
  };

  const radarOption = (ratings: Post["ratings"]) => ({
    radar: {
      indicator: [
        { name: "性价比", max: 5 },
        { name: "颜值", max: 5 },
        { name: "口味", max: 5 },
        { name: "分量", max: 5 },
        { name: "健康度", max: 5 }
      ],
      shape: "polygon",
      splitNumber: 5,
      axisName: {
        color: "#9ca3af",
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: "#374151"
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ["rgba(255,255,255,0.02)", "rgba(255,255,255,0.03)", "rgba(255,255,255,0.02)", "rgba(255,255,255,0.03)", "rgba(255,255,255,0.02)"]
        }
      },
      axisLine: {
        lineStyle: {
          color: "#4b5563"
        }
      }
    },
    series: [
      {
        name: "评分",
        type: "radar",
        data: [
          {
            value: [
              ratings.value,
              ratings.appearance,
              ratings.taste,
              ratings.portion,
              ratings.health
            ],
            areaStyle: {
              color: "rgba(139, 92, 246, 0.3)"
            },
            lineStyle: {
              color: "#a78bfa",
              width: 2
            },
            itemStyle: {
              color: "#c4b5fd"
            }
          }
        ]
      }
    ]
  });

  return (
    <main className="min-h-screen relative overflow-hidden">
      <NebulaBackground />
      <Navbar />
      
      <header className="sticky top-16 z-20 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              ✨ Flavor Square
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full text-sm font-medium hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              发布
            </button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  activeCategory === category.id
                    ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          layout
          className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
        >
          <AnimatePresence>
            {mockPosts.map((post, index) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="break-inside-avoid mb-6"
              >
                <motion.div
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedPost(post)}
                  className="bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_22px_60px_rgba(139,92,246,0.2)] hover:border-purple-400/30 border border-white/10 transition-all duration-300 cursor-pointer group"
                >
                  <div className="relative overflow-hidden">
                    <div className="aspect-[4/3] bg-gradient-to-br from-slate-800/50 to-slate-900/50 relative">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-medium border border-white/20">
                          查看详情
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      {post.tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-white/10 backdrop-blur-sm text-gray-200 text-xs font-medium rounded-full border border-white/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-cyan-300 transition-colors">{post.title}</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                          {post.author.avatar}
                        </div>
                        <span className="text-sm text-gray-400">{post.author.name}</span>
                      </div>
                      <button
                        onClick={(e) => toggleLike(post.id, e)}
                        className="flex items-center gap-1 text-gray-400 hover:text-pink-400 transition-colors"
                      >
                        <motion.div
                          animate={{ scale: likedPosts.has(post.id) ? [1, 1.3, 1] : 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              likedPosts.has(post.id) ? "fill-pink-500 text-pink-500" : ""
                            }`}
                          />
                        </motion.div>
                        <span className="text-sm">{post.likes}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedPost(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white/5 backdrop-blur-xl rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.5)] border border-white/10"
            >
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-gray-300 hover:text-white z-10 border border-white/10 hover:border-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid md:grid-cols-2">
                <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30">
                  <div className="aspect-square relative">
                    <img
                      src={selectedPost.imageUrl}
                      alt={selectedPost.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  </div>
                </div>

                <div className="p-8 overflow-y-auto max-h-[90vh]">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedPost.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-4 py-1 bg-purple-500/20 text-purple-300 text-sm font-medium rounded-full border border-purple-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-3">{selectedPost.title}</h2>
                  <p className="text-gray-300 mb-6 leading-relaxed">{selectedPost.description}</p>

                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">五维评分</h3>
                    <div className="h-64">
                      <ReactECharts option={radarOption(selectedPost.ratings)} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400 mb-6 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span>📍 {selectedPost.canteen}</span>
                      <span>·</span>
                      <span>🏪 {selectedPost.stall}</span>
                    </div>
                    <span>{selectedPost.createdAt}</span>
                  </div>

                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                        {selectedPost.author.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{selectedPost.author.name}</p>
                        <p className="text-sm text-gray-400">美食探索家</p>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-6">
                      <button
                        onClick={(e) => toggleLike(selectedPost.id, e)}
                        className="flex items-center gap-2 text-gray-300 hover:text-pink-400 transition-colors"
                      >
                        <Heart
                          className={`w-6 h-6 ${
                            likedPosts.has(selectedPost.id) ? "fill-pink-500 text-pink-500" : ""
                          }`}
                        />
                        <span className="font-medium">{selectedPost.likes}</span>
                      </button>
                      <div className="flex items-center gap-2 text-gray-300">
                        <MessageSquare className="w-6 h-6" />
                        <span className="font-medium">{selectedPost.comments}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">评论</h3>
                    <div className="space-y-4">
                      {selectedPost.commentList.map((comment, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-xs font-medium flex-shrink-0 border border-cyan-500/30">
                            {comment.author.charAt(0)}
                          </div>
                          <div className="flex-1 bg-white/5 rounded-2xl rounded-tl-none px-4 py-3 border border-white/5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-white">{comment.author}</span>
                              <span className="text-xs text-gray-500">{comment.time}</span>
                            </div>
                            <p className="text-sm text-gray-300">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white/5 backdrop-blur-xl rounded-3xl max-w-lg w-full shadow-[0_25px_80px_rgba(0,0,0,0.5)] border border-white/10"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">发布新动态</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">上传图片</label>
                    <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
                      <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">点击或拖拽上传图片</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">标题</label>
                    <input
                      type="text"
                      placeholder="给你的美食起个吸引人的标题吧"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">描述</label>
                    <textarea
                      placeholder="分享你的美食体验..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">标签</label>
                    <div className="flex flex-wrap gap-2">
                      {["川菜", "轻食", "甜点", "早餐", "下午茶"].map((tag) => (
                        <button
                          key={tag}
                          className="px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-gray-300 hover:bg-purple-500/20 hover:text-purple-300 border border-white/10 hover:border-purple-500/30 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-3 rounded-xl text-gray-300 font-medium hover:bg-white/5 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        alert("发布成功！（演示）");
                        setShowCreateModal(false);
                      }}
                      className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all"
                    >
                      发布
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
