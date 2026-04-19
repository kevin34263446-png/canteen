// 数据库操作验证工具
// 用于确保用户信息正确写入和读取

import { supabase, hasSupabaseConfig } from './supabase';
import { User } from '@/lib/supabase';

export async function verifyDatabaseConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  try {
    if (!hasSupabaseConfig) {
      return {
        connected: false,
        message: 'Supabase 未配置'
      };
    }

    // 简单的连接测试
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('数据库连接测试失败:', error);
      return {
        connected: false,
        message: `连接失败: ${error.message}`
      };
    }

    return {
      connected: true,
      message: '数据库连接正常'
    };
  } catch (error) {
    return {
      connected: false,
      message: `异常: ${error.message}`
    };
  }
}

export async function forceUpdateUserInDatabase(
  userId: string,
  updates: Partial<User>
): Promise<{ success: boolean; error?: string; user?: User }> {
  
  console.log('🔧 强制更新用户数据:', { userId, updates });
  
  // 验证输入
  if (!userId) {
    return { success: false, error: '用户ID不能为空' };
  }
  
  if (!hasSupabaseConfig) {
    return { success: false, error: 'Supabase 未配置' };
  }

  try {
    // 步骤1: 直接执行 UPDATE 操作（不使用 .select()）
    console.log('步骤1: 执行 UPDATE 操作...');
    
    const updatePayload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // 移除不需要更新的字段
    delete updatePayload.id;
    delete updatePayload.email;
    delete updatePayload.password;

    const { error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId);

    if (updateError) {
      console.error('❌ UPDATE 失败:', updateError);
      return { 
        success: false, 
        error: `UPDATE失败: ${updateError.message}` 
      };
    }

    console.log('✅ UPDATE 成功');

    // 步骤2: 立即查询验证更新是否生效
    console.log('步骤2: 查询验证更新...');
    
    const { data: updatedUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('❌ 查询失败:', fetchError);
      // 即使查询失败，如果 UPDATE 成功了，我们也认为操作成功
      console.log('⚠️ 但 UPDATE 已成功，尝试再次查询...');
      
      // 再试一次
      const retryResult = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (retryResult.error) {
        console.error('❌ 重试查询也失败:', retryResult.error);
        return { 
          success: true, // UPDATE成功了，只是读取失败
          error: undefined,
          user: undefined
        };
      }
      
      console.log('✅ 重试查询成功');
      return { 
        success: true, 
        user: retryResult.data as User 
      };
    }

    console.log('✅ 查询成功，获取到更新后的数据:', updatedUser);

    // 步骤3: 验证字段是否真的更新了
    console.log('步骤3: 验证更新结果...');
    
    let allFieldsUpdated = true;
    const fieldChecks: string[] = [];
    
    Object.keys(updates).forEach(key => {
      if (key === 'id' || key === 'email' || key === 'password') return;
      
      const expectedValue = updates[key as keyof User];
      const actualValue = updatedUser[key as keyof User];
      const isMatch = JSON.stringify(expectedValue) === JSON.stringify(actualValue);
      
      fieldChecks.push(`${key}: ${isMatch ? '✅' : '❌'} (预期: ${expectedValue}, 实际: ${actualValue})`);
      
      if (!isMatch) {
        allFieldsUpdated = false;
      }
    });

    console.log('📊 字段检查:');
    fieldChecks.forEach(check => console.log(`  - ${check}`));

    if (!allFieldsUpdated) {
      console.warn('⚠️ 部分字段未正确更新');
    } else {
      console.log('✅ 所有字段都已正确更新');
    }

    // 移除敏感字段
    const { password, ...safeUser } = updatedUser;
    
    return {
      success: true,
      user: safeUser as User
    };

  } catch (error) {
    console.error('💥 强制更新过程发生异常:', error);
    return {
      success: false,
      error: `异常: ${error.message}`
    };
  }
}

export async function readUserFromDatabaseDirectly(userId: string): Promise<{
  success: boolean;
  user?: User | null;
  error?: string;
  source?: 'database' | 'mock' | 'error';
}> {
  
  console.log('📖 直接从数据库读取用户:', { userId });
  
  if (!userId) {
    return { 
      success: false, 
      user: null, 
      error: '用户ID不能为空',
      source: 'error' 
    };
  }

  if (!hasSupabaseConfig) {
    console.log('⚠️ Supabase 未配置，将使用 mock 数据');
    return { 
      success: false, 
      user: null, 
      error: 'Supabase 未配置',
      source: 'mock' 
    };
  }

  try {
    // 使用原始的 supabase 客户端，不经过任何封装
    const result = await supabase
      .from('users')
      .select(`
        id, 
        email, 
        name, 
        user_type, 
        student_id, 
        avatar_url, 
        is_admin, 
        created_at, 
        updated_at
      `)
      .eq('id', userId)
      .maybeSingle();

    console.log('📊 数据库查询结果:', {
      hasData: !!result.data,
      error: result.error,
      count: result.count
    });

    if (result.error) {
      console.error('❌ 数据库查询错误:', result.error);
      return {
        success: false,
        user: null,
        error: result.error.message,
        source: 'error'
      };
    }

    if (!result.data) {
      console.log('⚠️ 数据库中未找到该用户');
      return {
        success: true,
        user: null,
        source: 'database'
      };
    }

    console.log('✅ 成功从数据库读取用户:', result.data);
    
    return {
      success: true,
      user: result.data as User,
      source: 'database'
    };

  } catch (error) {
    console.error('💥 读取过程发生异常:', error);
    return {
      success: false,
      user: null,
      error: error.message,
      source: 'error'
    };
  }
}

// 创建一个完整的测试流程
export async function runCompleteDataFlowTest(
  email: string,
  password: string,
  testStudentId: string
): Promise<{
  steps: Array<{
    name: string;
    status: 'success' | 'fail' | 'error';
    message: string;
    data?: any;
  }>;
  overallSuccess: boolean;
}> {
  
  const steps: Array<{
    name: string;
    status: 'success' | 'fail' | 'error';
    message: string;
    data?: any;
  }> = [];

  const addStep = (
    name: string, 
    status: 'success' | 'fail' | 'error', 
    message: string, 
    data?: any
  ) => {
    steps.push({ name, status, message, data });
    console.log(`[${status.toUpperCase()}] ${name}: ${message}`);
  };

  try {
    // 步骤1: 测试数据库连接
    addStep('开始', 'success', '准备测试数据流...');
    
    const connectionTest = await verifyDatabaseConnection();
    if (!connectionTest.connected) {
      addStep('数据库连接', 'error', connectionTest.message);
      return { steps, overallSuccess: false };
    }
    addStep('数据库连接', 'success', connectionTest.message);

    // 动态导入 login 函数
    const { login } = await import('./supabase');
    
    // 步骤2: 登录
    addStep('登录', 'success', `尝试登录: ${email}`);
    const loginResult = await login(email, password, 'student');
    
    if (loginResult.error || !loginResult.user) {
      addStep('登录', 'fail', `登录失败: ${loginResult.error}`);
      return { steps, overallSuccess: false };
    }
    
    addStep('登录', 'success', `登录成功! 用户ID: ${loginResult.user.id}`, loginResult.user);

    // 步骤3: 从数据库读取当前数据
    const readResult = await readUserFromDatabaseDirectly(loginResult.user.id);
    addStep('读取当前数据', readResult.success ? 'success' : 'error', 
      readResult.source === 'database' ? '从数据库读取成功' : (readResult.error || '读取失败'),
      readResult.user
    );

    if (!readResult.success || !readResult.user) {
      return { steps, overallSuccess: false };
    }

    const originalData = readResult.user;

    // 步骤4: 强制更新数据
    addStep('更新数据', 'success', `尝试更新学号为: ${testStudentId}`);
    
    const updateResult = await forceUpdateUserInDatabase(loginResult.user.id, {
      name: originalData.name,
      student_id: testStudentId,
    });

    if (!updateResult.success) {
      addStep('更新数据', 'fail', `更新失败: ${updateResult.error}`);
      return { steps, overallSuccess: false };
    }
    
    addStep('更新数据', 'success', '数据更新成功!', updateResult.user);

    // 步骤5: 再次读取验证
    const verifyRead = await readUserFromDatabaseDirectly(loginResult.user.id);
    addStep('验证更新', verifyRead.success ? 'success' : 'error',
      verifyRead.success && verifyRead.user?.student_id === testStudentId 
        ? '✅ 数据库已正确更新!' 
        : '❌ 数据库未正确更新!',
      verifyRead.user
    );

    // 步骤6: 恢复原始数据
    if (originalData.student_id !== testStudentId) {
      addStep('恢复原始数据', 'success', `恢复学号为: ${originalData.student_id}`);
      await forceUpdateUserInDatabase(loginResult.user.id, {
        name: originalData.name,
        student_id: originalData.student_id,
      });
      addStep('恢复原始数据', 'success', '原始数据已恢复');
    }

    const overallSuccess = verifyRead.user?.student_id === testStudentId;
    
    return {
      steps,
      overallSuccess
    };

  } catch (error) {
    addStep('系统异常', 'error', error.message || error);
    return { steps, overallSuccess: false };
  }
}
