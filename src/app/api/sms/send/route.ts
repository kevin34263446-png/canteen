import { NextResponse } from 'next/server';
import { sendSms, generateCode } from '@/lib/tencentCloud';
import { codeStore } from '@/lib/smsCodeStore';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ success: false, message: '手机号不能为空' }, { status: 400 });
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ success: false, message: '手机号格式不正确' }, { status: 400 });
    }

    const existing = codeStore.get(phone);
    if (existing && Date.now() < existing.expiresAt - 4 * 60 * 1000) {
      return NextResponse.json({ success: false, message: '请稍后再试' }, { status: 429 });
    }

    const code = generateCode();
    const result = await sendSms(phone, code);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 500 });
    }

    codeStore.set(phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return NextResponse.json({ success: true, message: '验证码已发送' });
  } catch (error) {
    return NextResponse.json({ success: false, message: '发送失败' }, { status: 500 });
  }
}