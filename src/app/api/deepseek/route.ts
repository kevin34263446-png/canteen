import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1'
});

const SYSTEM_PROMPT = `你是"美食星云"智慧食堂的首席AI推荐官，是一位懂吃又懂健康的学长。

你的职责：
1. 根据用户需求推荐菜品组合
2. 给出专业的营养建议
3. 回答关于食堂、菜品、健康饮食的问题
4. 推荐风格要亲切、专业、有活力

注意事项：
- 保持友好、积极的语气
- 回答要简洁明了，重点突出
- 如果涉及推荐套餐，遵循格式：[方案名称] + [包含菜品] + [推荐理由]
- 如果用户没有提供菜品数据，礼貌地请他们提供`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: fullMessages as any,
      temperature: 0.7,
      max_tokens: 2000
    });

    return NextResponse.json({
      content: completion.choices[0].message.content,
      usage: completion.usage
    });
  } catch (error: any) {
    console.error('DeepSeek API Error:', error);

    // 检查是否是余额不足错误
    if (error.status === 402 || error.message?.includes('Insufficient Balance')) {
      return NextResponse.json({
        error: 'AI服务暂时不可用（API余额不足），请稍后再试或联系管理员充值。',
        code: 'INSUFFICIENT_BALANCE'
      }, { status: 402 });
    }

    return NextResponse.json(
      { error: error.message || '请求失败，请稍后重试' },
      { status: 500 }
    );
  }
}
