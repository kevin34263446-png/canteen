// 使用 API Route 更新用户信息（绕过 RLS 限制）
// 这个函数通过服务端 API Route 调用，使用 SERVICE_ROLE_KEY

export async function updateUserViaAPI(
  userId: string,
  updates: {
    name?: string;
    student_id?: string;
    avatar_url?: string;
  }
): Promise<{
  success: boolean;
  error?: string;
  user?: any;
}> {
  
  console.log('🌐 通过 API Route 更新用户:', { userId, updates });

  try {
    const response = await fetch('/api/update-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        updates
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API 返回错误:', errorData);
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const result = await response.json();
    
    console.log('✅ API Route 更新成功:', result);
    
    return {
      success: true,
      user: result.user
    };

  } catch (error) {
    console.error('💥 API 调用失败:', error);
    return {
      success: false,
      error: `网络错误: ${error.message || '未知错误'}`
    };
  }
}

// 通过 API Route 获取用户信息（使用 Service Role）
export async function getUserViaAPI(userId: string): Promise<{
  success: boolean;
  error?: string;
  user?: any;
}> {
  
  console.log('🌐 通过 API Route 获取用户:', { userId });

  try {
    const response = await fetch(`/api/update-user?userId=${userId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const result = await response.json();
    
    console.log('✅ API Route 获取成功:', result);
    
    return {
      success: true,
      user: result.user
    };

  } catch (error) {
    console.error('💥 API 调用失败:', error);
    return {
      success: false,
      error: `网络错误: ${error.message || '未知错误'}`
    };
  }
}
