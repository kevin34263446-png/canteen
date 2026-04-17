// DeepSeek AI 集成服务

const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// AI 智能导购系统提示词
const AI_GUIDE_SYSTEM_PROMPT = `你是一个在校生活了四年的老学长，深知各个食堂哪个档口好吃。请根据用户需求（如：月底没钱了、考前补脑、练后加餐）从数据库中给出最省钱或最有营养的组合。

要求：
1. 结合学生的实际需求，给出具体的菜品推荐
2. 考虑价格因素，尤其是针对月底没钱的情况
3. 考虑营养搭配，尤其是针对考前补脑和练后加餐的情况
4. 给出推荐理由，融入校园梗，增加趣味性
5. 语言风格要符合学生口吻，亲切自然
`;

// 论坛内容审核系统提示词
const AI_MODERATION_SYSTEM_PROMPT = `你是一个校园食堂论坛的内容审核员，负责将敏感话题转化为建设性意见。

要求：
1. 识别敏感话题，如"食堂大妈手抖"、"饭菜里有异物"等
2. 不直接屏蔽这些内容，而是将其转化为建设性意见
3. 保持客观中立的态度，既要反映问题，又要给出积极的建议
4. 语言风格要礼貌、专业，符合校园氛围
`;

// 趣味解说系统提示词
const AI_FUN_COMMENTARY_SYSTEM_PROMPT = `你是一个校园食堂的趣味解说员，擅长融入校园梗进行解说。

要求：
1. 融入高数、绩点、四六级、脱单、校车等校园梗
2. 语言风格幽默风趣，符合学生口吻
3. 针对食堂的菜品、环境、服务等方面进行解说
4. 保持积极向上的态度，传递正能量
`;

// 通用AI请求函数
async function callDeepSeekAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    console.warn('DeepSeek API key not configured');
    return getMockAIResponse(systemPrompt, userPrompt);
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek AI request failed:', error);
    return getMockAIResponse(systemPrompt, userPrompt);
  }
}

// 模拟AI响应（当API key未配置时使用）
function getMockAIResponse(systemPrompt: string, userPrompt: string): string {
  if (systemPrompt.includes('智能导购')) {
    if (userPrompt.includes('月底没钱')) {
      return '老学长来给你支支招！月底没钱的时候，推荐你去学一食堂的大众快餐窗口，来一份酸辣土豆丝（¥3）+ 米饭（¥1），再配一份免费汤，总共才¥4，经济实惠又管饱。或者去学四食堂的螺蛳粉窗口，来一份小份螺蛳粉（¥8），加个煎蛋（¥1），也是不错的选择。这些都是我们当年月底的标配，懂的都懂～';
    } else if (userPrompt.includes('考前补脑')) {
      return '考前补脑必须安排上！推荐你去学三食堂的黄焖鸡窗口，来一份黄焖鸡米饭（¥15），鸡肉富含蛋白质，有助于提高记忆力。或者去学二食堂的西北面馆，来一份牛肉拉面（¥12），牛肉的营养成分对大脑也很有好处。记得搭配一份水果，学三食堂的轻食沙拉窗口有新鲜的水果盒（¥5），补充维生素C，让你考试状态满分！';
    } else if (userPrompt.includes('练后加餐')) {
      return '练后加餐要注重蛋白质和碳水的补充！推荐你去学三食堂的西式简餐窗口，来一份 grilled chicken wrap（¥18），鸡肉提供蛋白质，蔬菜提供纤维，全麦 wrap 提供碳水。或者去学一食堂的精品小炒窗口，来一份青椒炒肉（¥12）+ 米饭（¥1），也是不错的选择。记得多喝水，学四食堂的奶茶甜品窗口有无糖柠檬水（¥3），解渴又健康！';
    } else {
      return '老学长来给你推荐几个食堂的招牌菜！学一食堂的精品小炒窗口的鱼香肉丝超级下饭，学二食堂的麻辣香锅是一绝，学三食堂的黄焖鸡米饭香到不行，学四食堂的螺蛳粉是深夜必备。根据你的口味和需求，随便选一个都不会踩雷！';
    }
  } else if (systemPrompt.includes('内容审核')) {
    return '感谢您的反馈，我们已经注意到您提到的问题。食堂大妈手抖的问题确实会影响同学们的用餐体验，我们会向食堂管理部门反映，建议加强培训和管理，确保每个同学都能得到公平的份量。同时，我们也会建议食堂增加透明窗口，让同学们可以看到打菜过程，增加信任感。';
  } else if (systemPrompt.includes('趣味解说')) {
    return '欢迎来到美食星云食堂！这里的菜品就像高数题一样，种类繁多但总有解法。学一食堂的大众快餐是你的基础题，简单直接又管饱；学二食堂的麻辣香锅是你的难题，挑战你的味蕾极限；学三食堂的轻食沙拉是你的送分题，健康又美味；学四食堂的螺蛳粉是你的附加题，尝试了就停不下来。不管你是绩点大神还是摸鱼选手，这里总有适合你的那道菜！';
  } else {
    return '感谢您的提问，我会为您提供最专业的建议。';
  }
}

// 智能导购功能
export async function getAIFoodRecommendation(user需求: string): Promise<string> {
  return callDeepSeekAI(AI_GUIDE_SYSTEM_PROMPT, user需求);
}

// 内容审核功能
export async function moderateForumContent(content: string): Promise<string> {
  return callDeepSeekAI(AI_MODERATION_SYSTEM_PROMPT, content);
}

// 趣味解说功能
export async function getFunCommentary(topic: string): Promise<string> {
  return callDeepSeekAI(AI_FUN_COMMENTARY_SYSTEM_PROMPT, topic);
}
