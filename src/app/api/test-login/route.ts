import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, userType } = await request.json();
    
    console.log('API 测试登录尝试:', { email, userType });
    
    const response = await login(email, password, userType);
    
    console.log('API 测试登录结果:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API 测试登录失败:', error);
    return NextResponse.json({ error: '测试失败' }, { status: 500 });
  }
}
