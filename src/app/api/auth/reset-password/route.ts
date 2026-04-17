import { NextResponse } from 'next/server';
import { resetPassword, getUserByEmail } from '@/lib/supabase';
import { codeStore } from '@/lib/smsCodeStore';

export async function POST(request: Request) {
  try {
    const { email, phone, code, newPassword } = await request.json();

    if (!email || !phone || !code || !newPassword) {
      return NextResponse.json({ success: false, message: '参数不完整' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: '新密码长度不能少于6位' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 400 });
    }

    const stored = codeStore.get(phone);

    if (!stored) {
      return NextResponse.json({ success: false, message: '请先获取验证码' }, { status: 400 });
    }

    if (Date.now() > stored.expiresAt) {
      codeStore.delete(phone);
      return NextResponse.json({ success: false, message: '验证码已过期' }, { status: 400 });
    }

    if (stored.code !== code) {
      return NextResponse.json({ success: false, message: '验证码错误' }, { status: 400 });
    }

    codeStore.delete(phone);

    const result = await resetPassword(email, newPassword);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: '密码重置成功' });
  } catch (error) {
    return NextResponse.json({ success: false, message: '密码重置失败' }, { status: 500 });
  }
}