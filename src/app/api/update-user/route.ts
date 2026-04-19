import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用 SERVICE_ROLE_KEY 绕过 RLS 限制
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    console.log('🔧 API Route 收到更新请求:', { userId, updates });

    // 创建带有 service role 的客户端（绕过 RLS）
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 执行更新
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    console.log('📊 更新结果:', { error: updateError, data: updateData });

    if (updateError) {
      console.error('❌ 更新失败:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // 立即查询验证
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('✅ 验证结果:', { data: verifyData, error: verifyError });

    if (verifyError) {
      console.warn('⚠️ 验证查询失败，但更新可能已成功');
    }

    // 返回结果（移除敏感字段）
    const { password, ...safeUserData } = verifyData || {};

    return NextResponse.json({
      success: true,
      user: safeUserData,
      updateResult: updateData,
      message: '通过 Service Role 成功更新'
    });

  } catch (error) {
    console.error('💥 API Route 异常:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `服务器错误: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

// GET 方法：用于验证当前用户数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少 userId 参数' },
        { status: 400 }
      );
    }

    // 创建带有 service role 的客户端
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ 查询失败:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 移除敏感字段
    const { password, ...safeUserData } = data;

    return NextResponse.json({
      success: true,
      user: safeUserData,
      source: 'service-role-api'
    });

  } catch (error) {
    console.error('💥 GET API 异常:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
