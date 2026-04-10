import Link from "next/link";
import Image from "next/image";
import { getCanteens, getCanteenRating } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default async function Home() {
  const canteens = await getCanteens();
  
  // 并行获取所有食堂的评分
  const canteenData = await Promise.all(
    canteens.map(async (canteen) => {
      const rating = await getCanteenRating(canteen.id);
      return { ...canteen, rating };
    })
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">食堂列表</h2>

        {canteenData.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <span className="text-4xl text-gray-300 block mb-4">🍽️</span>
            <p className="text-gray-500">暂无食堂数据</p>
            <p className="text-gray-400 text-sm mt-2">请在 Supabase 数据库中添加食堂信息</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canteenData.map((canteen) => (
              <Link
                key={canteen.id}
                href={`/canteen/${canteen.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden block"
              >
                {/* 食堂图片 */}
                <div className="h-48 bg-gray-200 relative">
                  {canteen.image_url ? (
                    <Image
                      src={canteen.image_url}
                      alt={canteen.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <span className="text-4xl text-blue-300">🍽️</span>
                    </div>
                  )}
                </div>

                {/* 食堂信息 */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {canteen.name}
                  </h3>

                  {canteen.location && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
                      <span>📍</span>
                      <span>{canteen.location}</span>
                    </div>
                  )}

                  {canteen.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {canteen.description}
                    </p>
                  )}

                  {/* 评分和操作按钮 */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm text-gray-600">
                        {canteen.rating > 0 ? canteen.rating.toFixed(1) : "暂无评分"}
                      </span>
                    </div>
                    <span className="text-blue-500 text-sm font-medium hover:text-blue-600">
                      查看详情 →
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
