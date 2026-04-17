"use client";

import { useState, useEffect } from "react";
import { User, Review, Dish, getAllUsers, setAdmin, adminResetPassword, deleteUser, getUserById, getCanteens, getCanteenStalls, getCanteenReviews, getAllDishes, addDish, updateDish, deleteDish, replyToReview, deleteReview } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Link from "next/link";

type TabType = 'overview' | 'users' | 'reviews' | 'dishes';

interface DishFormData {
  name: string;
  description: string | null;
  price: string;
  category: string;
  canteen_id: string;
  stall_id: string;
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [canteens, setCanteens] = useState<any[]>([]);
  const [stalls, setStalls] = useState<any[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState<string>('');
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
        
        const allStalls: any[] = [];
        for (const canteen of canteensData) {
          const canteenStalls = await getCanteenStalls(canteen.id);
          allStalls.push(...canteenStalls);
        }
        setStalls(allStalls);
        
        const reviewsData = await getCanteenReviews();
        setReviews(reviewsData);
      } catch (err) {
        console.error("获取数据失败:", err);
        setError("获取数据失败");
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
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, is_admin: isAdmin } : u
        );
        setUsers(updatedUsers);
        alert("权限更新成功");
      } else {
        alert(result.error || "权限更新失败");
      }
    } catch (err) {
      console.error("设置管理员失败:", err);
      alert("权限更新失败");
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt("请输入新密码（至少6位）:");
    if (!newPassword || newPassword.length < 6) {
      alert("密码长度不能少于6位");
      return;
    }
    
    try {
      const result = await adminResetPassword(userId, newPassword);
      if (result.success) {
        alert("密码重置成功");
      } else {
        alert(result.error || "密码重置失败");
      }
    } catch (err) {
      console.error("重置密码失败:", err);
      alert("密码重置失败");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("确定要删除该用户吗？")) {
      return;
    }
    
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        setUsers(users.filter(u => u.id !== userId));
        alert("用户删除成功");
      } else {
        alert(result.error || "用户删除失败");
      }
    } catch (err) {
      console.error("删除用户失败:", err);
      alert("用户删除失败");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("确定要删除该评价吗？")) {
      return;
    }
    
    try {
      const result = await deleteReview(reviewId);
      if (result.success) {
        setReviews(reviews.filter(r => r.id !== reviewId));
        alert("评价删除成功");
      } else {
        alert(result.error || "评价删除失败");
      }
    } catch (err) {
      console.error("删除评价失败:", err);
      alert("评价删除失败");
    }
  };

  const handleReplyReview = async () => {
    if (!replyModal || !replyModal.reply.trim()) {
      alert("请输入回复内容");
      return;
    }
    
    try {
      const result = await replyToReview(replyModal.review.id, replyModal.reply);
      if (result.success) {
        setReviews(reviews.map(r => 
          r.id === replyModal.review.id 
            ? { ...r, admin_reply: replyModal.reply } 
            : r
        ));
        setReplyModal(null);
        alert("回复成功");
      } else {
        alert(result.error || "回复失败");
      }
    } catch (err) {
      console.error("回复评价失败:", err);
      alert("回复失败");
    }
  };

  const [showDishModal, setShowDishModal] = useState<boolean>(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  const openAddDishModal = () => {
    setEditingDish(null);
    setDishForm({
      name: "",
      description: "",
      price: "",
      category: "",
      canteen_id: "",
      stall_id: ""
    });
    setShowDishModal(true);
  };

  const openEditDishModal = (dish: Dish) => {
    setEditingDish(dish);
    setDishForm({
      name: dish.name,
      description: dish.description || "",
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
        const updates = {
          name: dishForm.name,
          description: dishForm.description,
          price: parseFloat(dishForm.price),
          category: dishForm.category,
          canteen_id: dishForm.canteen_id,
          stall_id: dishForm.stall_id
        };
        const result = await updateDish(editingDish.id, updates);
        if (result.success) {
          const updatedDishes = dishes.map(d => 
            d.id === editingDish.id 
              ? { ...d, ...updates } 
              : d
          );
          setDishes(updatedDishes);
          setShowDishModal(false);
          alert("菜品更新成功");
        } else {
          alert(result.error || "菜品更新失败");
        }
      } else {
        const result = await addDish({
          name: dishForm.name,
          description: dishForm.description,
          price: parseFloat(dishForm.price),
          category: dishForm.category,
          canteen_id: dishForm.canteen_id,
          stall_id: dishForm.stall_id,
          image_url: null,
          is_time_limited: false,
          is_spicy: 0,
          student_discount: 0
        });
        if (result.success && result.dish) {
          setDishes([...dishes, result.dish]);
          setShowDishModal(false);
          alert("菜品添加成功");
        } else {
          alert(result.error || "菜品添加失败");
        }
      }
    } catch (err) {
      console.error("保存菜品失败:", err);
      alert("保存菜品失败");
    }
  };

  const handleDeleteDish = async (dishId: string) => {
    if (!confirm("确定要删除该菜品吗？")) {
      return;
    }
    
    try {
      const result = await deleteDish(dishId);
      if (result.success) {
        setDishes(dishes.filter(d => d.id !== dishId));
        alert("菜品删除成功");
      } else {
        alert(result.error || "菜品删除失败");
      }
    } catch (err) {
      console.error("删除菜品失败:", err);
      alert("菜品删除失败");
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReviews = reviews.filter(review =>
    review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDishes = dishes.filter(dish =>
    dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dish.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">管理员面板</h1>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                概览
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                用户管理
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                评价管理
              </button>
              <button
                onClick={() => setActiveTab('dishes')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium transition-colors ${
                  activeTab === 'dishes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                菜品管理
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">总用户数</h3>
                  <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">总评价数</h3>
                  <p className="text-3xl font-bold text-green-600">{reviews.length}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">总菜品数</h3>
                  <p className="text-3xl font-bold text-purple-600">{dishes.length}</p>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="搜索用户..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.is_admin ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                管理员
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                用户
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleSetAdmin(user.id, !user.is_admin)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {user.is_admin ? '取消管理员' : '设为管理员'}
                            </button>
                            <button
                              onClick={() => handleResetPassword(user.id)}
                              className="text-green-600 hover:text-green-900"
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
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="搜索评价..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{review.user_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`${
                                star <= review.rating
                                  ? "text-yellow-400"
                                  : "text-yellow-200"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{review.content}</p>
                      {review.admin_reply && (
                        <div className="bg-blue-50 rounded p-3 mb-2">
                          <p className="text-sm text-blue-800">
                            <strong>管理员回复：</strong>{review.admin_reply}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReplyModal({ review, reply: review.admin_reply || "" })}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          回复
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'dishes' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <input
                    type="text"
                    placeholder="搜索菜品..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={openAddDishModal}
                    className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                      {filteredDishes.map((dish) => (
                        <tr key={dish.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {dish.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {dish.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ¥{dish.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {dish.description || '-'}
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
            )}
          </div>
        </div>
      </div>

      {showDishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingDish ? '编辑菜品' : '添加菜品'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">菜品名称</label>
                <input
                  type="text"
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <input
                  type="text"
                  value={dishForm.category}
                  onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                <input
                  type="number"
                  step="0.01"
                  value={dishForm.price}
                  onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={dishForm.description || ""}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">食堂</label>
                <select
                  value={dishForm.canteen_id}
                  onChange={(e) => setDishForm({ ...dishForm, canteen_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择食堂</option>
                  {canteens.map((canteen) => (
                    <option key={canteen.id} value={canteen.id}>
                      {canteen.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">档口</label>
                <select
                  value={dishForm.stall_id}
                  onChange={(e) => setDishForm({ ...dishForm, stall_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!dishForm.canteen_id}
                >
                  <option value="">选择档口</option>
                  {stalls
                    .filter(stall => stall.canteen_id === dishForm.canteen_id)
                    .map((stall) => (
                      <option key={stall.id} value={stall.id}>
                        {stall.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowDishModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveDish}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {replyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">回复评价</h3>
            <textarea
              value={replyModal.reply}
              onChange={(e) => setReplyModal({ ...replyModal, reply: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="输入回复内容..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setReplyModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReplyReview}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}