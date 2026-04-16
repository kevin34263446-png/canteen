"use client";

import { useState, useEffect } from "react";
import { User, Review, Dish, getAllUsers, setAdmin, adminResetPassword, deleteUser, getUserById, getCanteens, getCanteenReviews, getAllDishes, addDish, updateDish, deleteDish, replyToReview, deleteReview } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Link from "next/link";

type TabType = 'overview' | 'users' | 'reviews' | 'dishes';

interface DishFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  canteen_id: string;
  stall_id: string;
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [canteens, setCanteens] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDishModal, setShowDishModal] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishForm, setDishForm] = useState<DishFormData>({
    name: "",
    description: "",
    price: "",
    category: "",
    canteen_id: "",
    stall_id: ""
  });
  const [replyModal, setReplyModal] = useState<{ review: Review; reply: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setError("请先登录");
          return;
        }
        const decoded = JSON.parse(atob(token));
        const userData = await getUserById(decoded.userId);
        
        if (!userData || !userData.is_admin) {
          setError("无权限访问");
          return;
        }
        
        setCurrentUser(userData);
        const [usersData, canteensData, dishesData] = await Promise.all([
          getAllUsers(),
          getCanteens(),
          getAllDishes()
        ]);
        setUsers(usersData);
        setCanteens(canteensData);
        setDishes(dishesData);
        
        const allReviews: Review[] = [];
        for (const canteen of canteensData) {
          const canteenReviews = await getCanteenReviews(canteen.id);
          allReviews.push(...canteenReviews);
        }
        setReviews(allReviews);
      } catch (err) {
        setError("加载失败");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSetAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const result = await setAdmin(userId, isAdmin);
      if (result.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_admin: isAdmin } : u));
      } else {
        setError(result.error || "操作失败");
      }
    } catch (err) {
      setError("操作失败");
    }
  };

  const handleResetPassword = async (userId: string, newPassword: string) => {
    try {
      const result = await adminResetPassword(userId, newPassword);
      if (result.success) {
        alert("密码重置成功");
      } else {
        setError(result.error || "操作失败");
      }
    } catch (err) {
      setError("操作失败");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("确定删除该用户？")) return;
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        setError(result.error || "操作失败");
      }
    } catch (err) {
      setError("操作失败");
    }
  };

  const openAddDishModal = () => {
    setEditingDish(null);
    setDishForm({
      name: "",
      description: "",
      price: "",
      category: "",
      canteen_id: canteens[0]?.id || "",
      stall_id: ""
    });
    setShowDishModal(true);
  };

  const openEditDishModal = (dish: Dish) => {
    setEditingDish(dish);
    setDishForm({
      name: dish.name,
      description: dish.description,
      price: dish.price.toString(),
      category: dish.category,
      canteen_id: dish.canteen_id,
      stall_id: dish.stall_id
    });
    setShowDishModal(true);
  };

  const handleSaveDish = async () => {
    try {
      if (editingDish) {
        const result = await updateDish(editingDish.id, {
          name: dishForm.name,
          description: dishForm.description,
          price: parseFloat(dishForm.price),
          category: dishForm.category,
          canteen_id: dishForm.canteen_id,
          stall_id: dishForm.stall_id
        });
        if (result.success) {
          setDishes(dishes.map(d => d.id === editingDish.id ? { ...d, ...dishForm, price: parseFloat(dishForm.price) } : d));
          setShowDishModal(false);
        } else {
          setError(result.error || "操作失败");
        }
      } else {
        const result = await addDish({
          name: dishForm.name,
          description: dishForm.description,
          price: parseFloat(dishForm.price),
          category: dishForm.category,
          canteen_id: dishForm.canteen_id,
          stall_id: dishForm.stall_id,
          image_url: null
        });
        if (result.success && result.dish) {
          setDishes([result.dish, ...dishes]);
          setShowDishModal(false);
        } else {
          setError(result.error || "操作失败");
        }
      }
    } catch (err) {
      setError("操作失败");
    }
  };

  const handleDeleteDish = async (dishId: string) => {
    if (!confirm("确定删除该菜品？")) return;
    try {
      const result = await deleteDish(dishId);
      if (result.success) {
        setDishes(dishes.filter(d => d.id !== dishId));
      } else {
        setError(result.error || "操作失败");
      }
    } catch (err) {
      setError("操作失败");
    }
  };

  const openReplyModal = (review: Review) => {
    setReplyModal({ review, reply: review.reply || "" });
  };

  const handleSaveReply = async () => {
    if (!replyModal) return;
    try {
      const result = await replyToReview(replyModal.review.id, replyModal.reply);
      if (result.success) {
        setReviews(reviews.map(r => r.id === replyModal.review.id ? { ...r, reply: replyModal.reply } : r));
        setReplyModal(null);
      } else {
        setError(result.error || "操作失败");
      }
    } catch (err) {
      setError("操作失败");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("确定删除该评价？")) return;
    try {
      const result = await deleteReview(reviewId);
      if (result.success) {
        setReviews(reviews.filter(r => r.id !== reviewId));
      } else {
        setError(result.error || "操作失败");
      }
    } catch (err) {
      setError("操作失败");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </main>
    );
  }

  if (!currentUser || !currentUser.is_admin) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">无权限访问</h2>
          <p className="text-gray-500 mb-6">请使用管理员账户登录</p>
          <Link
            href="/"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-gray-600">总用户数</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-green-600">{users.filter(u => u.is_admin).length}</div>
              <div className="text-sm text-gray-600">管理员数</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-purple-600">{canteens.length}</div>
              <div className="text-sm text-gray-600">食堂数</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-orange-600">{reviews.length}</div>
              <div className="text-sm text-gray-600">总评价数</div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">身份</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">管理员</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.user_type === "student" ? "学生" : "教职工"} / {user.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSetAdmin(user.id, !user.is_admin)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.is_admin
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        >
                          {user.is_admin ? "是" : "否"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            const newPwd = prompt("请输入新密码（至少6位）：");
                            if (newPwd && newPwd.length >= 6) {
                              handleResetPassword(user.id, newPwd);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          重置密码
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'reviews':
        return (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">评分</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内容</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">回复</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <tr key={review.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {review.user_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          <span className="text-sm text-gray-900">{review.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        {review.content}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600 max-w-xs">
                        {(review as any).reply || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => openReplyModal(review)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {(review as any).reply ? "修改回复" : "回复"}
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'dishes':
        return (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 flex items-center justify-between border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">菜品管理</h3>
              <button
                onClick={openAddDishModal}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                + 添加菜品
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">菜品</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dishes.map((dish) => (
                    <tr key={dish.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {dish.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dish.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ¥{dish.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {dish.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => openEditDishModal(dish)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteDish(dish.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">管理员面板</h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-500"
          >
            ← 返回首页
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          {[
            { key: 'overview', label: '平台概览' },
            { key: 'users', label: '用户管理' },
            { key: 'reviews', label: '评价管理' },
            { key: 'dishes', label: '菜品管理' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {renderTabContent()}
      </div>

      {showDishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingDish ? "编辑菜品" : "添加菜品"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">菜品名称</label>
                <input
                  type="text"
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <input
                  type="text"
                  value={dishForm.category}
                  onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="如：炒菜、面食、小吃"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">价格（元）</label>
                <input
                  type="number"
                  step="0.01"
                  value={dishForm.price}
                  onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDishModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveDish}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {replyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">回复评价</h3>
            </div>
            <div className="p-6">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{replyModal.review.content}</p>
              </div>
              <textarea
                value={replyModal.reply}
                onChange={(e) => setReplyModal({ ...replyModal, reply: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={4}
                placeholder="输入回复内容..."
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setReplyModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveReply}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
