"use client";

import { useState } from "react";
import { createDishReview } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

interface DishReviewFormProps {
  dishId: string;
  canteenId: string;
  onSuccess: () => void;
}

export default function DishReviewForm({ dishId, canteenId, onSuccess }: DishReviewFormProps) {
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

    if (!user?.id) {
      setError("请先登录");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await createDishReview({
        dish_id: dishId,
        canteen_id: canteenId,
        user_id: user.id,
        rating,
        content,
        user_name: user?.name || "未登录用户",
        is_anonymous: isAnonymous,
      });

      if (result) {
        setRating(5);
        setContent("");
        setIsAnonymous(false);
        onSuccess();
      } else {
        setError("提交失败，请重试");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!user ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 text-sm mb-2">
            💡 登录后可参与评价
          </p>
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
          >
            立即登录 →
          </a>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-green-800 text-sm">
            ✓ 评价者：{user.name}
          </p>
        </div>
      )}

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
              disabled={!user}
              className={`p-1 focus:outline-none text-2xl transition-colors duration-200 ${
                !user ? 'cursor-not-allowed opacity-50' : ''
              }`}
            >
              <span
                className={`${
                  star <= rating
                    ? "text-yellow-400"
                    : "text-gray-300"
                }`}
              >
                ★
              </span>
            </button>
          ))}
        </div>
      </div>

      {user && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="anonymous" className="ml-2 text-sm text-gray-800 font-medium">
            匿名发布
          </label>
        </div>
      )}

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-800 mb-2">
          评价内容
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onClick={() => {
            if (!user) {
              setError("请先登录后再评价");
            }
          }}
          placeholder={user ? "请分享您对这道菜的体验..." : "登录后可参与评价"}
          rows={4}
          disabled={!user}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-800 ${
            !user ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          required={!!user}
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !user}
        className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
          user
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <span>提交中...</span>
        ) : user ? (
          <>
            <span>提交评价</span>
            <span>📤</span>
          </>
        ) : (
          <span>请先登录</span>
        )}
      </button>
    </form>
  );
}
