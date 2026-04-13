import { NextRequest, NextResponse } from 'next/server';
import { supabase, User } from '@/lib/supabase';

// 验证 token 的函数
function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = atob(token);
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

// 鉴权中间件
async function authMiddleware(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, user_type, student_id, created_at, updated_at')
    .eq('id', decoded.userId)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function POST(request: NextRequest) {
  // 验证用户是否登录
  const user = await authMiddleware(request);
  if (!user) {
    return NextResponse.json({ error: '未登录用户不能提交评价' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { canteen_id, rating, content } = body;

    // 验证请求数据
    if (!canteen_id || !rating || !content) {
      return NextResponse.json({ error: '缺少必要的请求参数' }, { status: 400 });
    }

    // 提交评价
    const { data: newReview, error } = await supabase
      .from('reviews')
      .insert({
        canteen_id,
        rating,
        content,
        user_name: user.name
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `提交评价失败: ${error.message || JSON.stringify(error)}` }, { status: 500 });
    }

    return NextResponse.json({ review: newReview, error: null }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: `提交评价失败: ${error instanceof Error ? error.message : JSON.stringify(error)}` }, { status: 500 });
  }
}
