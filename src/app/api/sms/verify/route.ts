import { NextResponse } from 'next/server';
import { codeStore } from '@/lib/smsCodeStore';

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ success: false, message: '手机号和验证码不能为空' }, { status: 400 });
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

    return NextResponse.json({ success: true, message: '验证成功' });
  } catch (error) {
    return NextResponse.json({ success: false, message: '验证失败' }, { status: 500 });
  }
}