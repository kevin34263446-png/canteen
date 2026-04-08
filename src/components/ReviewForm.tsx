"use client";

import { useState } from "react";
import { Star, Send } from "lucide-react";
import { createReview } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

interface ReviewFormProps {
  canteenId: string;
  onSuccess: () => void;
}

export default function ReviewForm({ canteenId, onSuccess }: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content) {
      setError("请填写评价内容");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await createReview({
        canteen_id: canteenId,
        rating,
        content,
        user_name: isAnonymous ? "匿名用户" : (user?.name || "未登录用户"),
      });

      if (result) {
        // 重置表单
        setRating(5);
        setContent("");
        setIsAnonymous(false);
        onSuccess();
      } else {
        setError("提交失败，请重试");
      }
    } catch (err) {
      setError("提交失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 评分选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-2">
          评分
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1 focus:outline-none"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                } transition-colors duration-200`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 用户名 */}
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-2">
          用户名
        </label>
        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 font-medium">
          {user?.name || "未登录用户"}
        </div>
      </div>

      {/* 匿名评价选项 */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="anonymous"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="w-4 h-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="anonymous" className="ml-2 text-sm text-gray-800 font-medium">
          匿名评价
        </label>
      </div>

      {/* 评价内容 */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-800 mb-2">
          评价内容
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请分享您的用餐体验..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-800"
          required
        />
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <span>提交中...</span>
        ) : (
          <>
            <span>提交评价</span>
            <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
