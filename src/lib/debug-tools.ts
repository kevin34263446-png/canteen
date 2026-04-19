// 调试工具：用于验证用户数据流
// 在浏览器控制台中使用: window.debugUserDataFlow()

declare global {
  interface Window {
    debugUserDataFlow: () => void;
    checkLocalStorage: () => void;
    verifyDatabaseSync: () => Promise<void>;
  }
}

export function initDebugTools() {
  // 调试用户数据流
  window.debugUserDataFlow = () => {
    console.log('🔍 ===== 用户数据流调试工具 =====');
    
    // 检查 localStorage
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    
    console.log('📦 localStorage 状态:');
    console.log('  - Token:', token ? '✅ 存在' : '❌ 不存在');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token));
        console.log('  - Token 解码:', decoded);
      } catch (e) {
        console.error('  - Token 解码失败:', e);
      }
    }
    
    console.log('  - User Data:', userStr ? '✅ 存在' : '❌ 不存在');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        console.log('  - User 对象:', userData);
        console.log('  - 关键字段:', {
          id: userData.id,
          name: userData.name,
          student_id: userData.student_id,
          email: userData.email
        });
      } catch (e) {
        console.error('  - User 数据解析失败:', e);
      }
    }
    
    console.log('🔍 ===== 调试结束 =====');
  };

  // 检查 localStorage 详细信息
  window.checkLocalStorage = () => {
    console.log('📋 ===== localStorage 详细检查 =====');
    
    const keys = ['auth_token', 'auth_user'];
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`\n📁 ${key}:`);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          console.log('  类型: JSON');
          console.log('  内容:', parsed);
          console.log('  大小:', (value.length / 1024).toFixed(2), 'KB');
        } catch {
          console.log('  类型: 字符串');
          console.log('  长度:', value.length);
          console.log('  前50字符:', value.substring(0, 50));
        }
      } else {
        console.log('  ⚠️ 不存在');
      }
    });
    
    console.log('\n📋 ===== 检查结束 =====');
  };

  // 验证数据库同步（需要在已登录状态下使用）
  window.verifyDatabaseSync = async () => {
    console.log('🔄 ===== 验证数据库同步 =====');
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ 未登录，无法验证数据库同步');
      return;
    }

    try {
      const decoded = JSON.parse(atob(token));
      console.log('📊 用户 ID:', decoded.userId);
      
      // 动态导入 getUserById
      const { getUserById } = await import('./supabase');
      
      console.log('⏳ 正在从数据库获取最新数据...');
      const dbUser = await getUserById(decoded.userId);
      
      const localUserStr = localStorage.getItem('auth_user');
      const localUser = localUserStr ? JSON.parse(localUserStr) : null;
      
      console.log('\n📊 数据对比:');
      console.log('  数据库数据:', dbUser);
      console.log('  本地数据:', localUser);
      
      if (dbUser && localUser) {
        console.log('\n✅ 字段对比:');
        const fields = ['name', 'student_id', 'avatar_url', 'email'];
        
        let isSynced = true;
        fields.forEach(field => {
          const dbValue = dbUser[field];
          const localValue = localUser[field];
          const match = dbValue === localValue;
          
          console.log(`  ${field}:`, match ? '✅ 匹配' : '❌ 不匹配');
          if (!match) {
            console.log(`    - 数据库: ${dbValue}`);
            console.log(`    - 本地: ${localValue}`);
            isSynced = false;
          }
        });
        
        console.log('\n🎯 同步状态:', isSynced ? '✅ 完全同步' : '⚠️ 存在差异');
        
        if (!isSynced) {
          console.log('\n💡 建议:');
          console.log('  1. 刷新页面以重新加载数据');
          console.log('  2. 如果问题持续存在，清除浏览器缓存后重新登录');
        }
      }
      
    } catch (error) {
      console.error('❌ 验证过程出错:', error);
    }
    
    console.log('\n🔄 ===== 验证结束 =====');
  };

  // 自动初始化日志
  console.log('🛠️ 调试工具已加载！');
  console.log('可用命令:');
  console.log('  - window.debugUserDataFlow()     # 查看当前用户数据流状态');
  console.log('  - window.checkLocalStorage()     # 检查 localStorage 详细信息');
  console.log('  - window.verifyDatabaseSync()    # 验证数据库与本地数据同步');
}

// 在客户端自动初始化
if (typeof window !== 'undefined') {
  initDebugTools();
}
