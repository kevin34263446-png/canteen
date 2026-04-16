import { NextResponse } from 'next/server';
import { changePassword } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId, oldPassword, newPassword } = await request.json();

    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json({ success: false, message: '参数不完整' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: '新密码长度不能少于6位' }, { status: 400 });
    }

    const result = await changePassword(userId, oldPassword, newPassword);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    return NextResponse.json({ success: false, message: '密码修改失败' }, { status: 500 });
  }
}
