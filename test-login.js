// 测试登录功能
const { supabase } = require('./src/lib/supabase');
const bcrypt = require('bcryptjs');

async function testLogin() {
  try {
    console.log('开始测试登录功能...');
    
    // 测试用的邮箱和密码
    const email = '2738044072@qq.com';
    const password = 'test123'; // 请替换为实际密码
    const userType = 'student';
    
    console.log('测试参数:', { email, userType });
    
    // 直接查询用户
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, user_type, student_id, password, is_admin, height, weight, age, gender, activity_level, created_at, updated_at")
      .eq("email", email)
      .single();
    
    console.log('查询结果:', { user, error });
    
    if (error || !user) {
      console.log('用户不存在或查询失败:', error);
      return;
    }
    
    // 测试密码验证
    console.log('密码验证开始:', { inputPassword: password, storedPassword: user.password });
    
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
      console.log('bcrypt验证结果:', passwordMatch);
    } catch (e) {
      console.log('bcrypt验证失败，尝试直接比较:', e);
      passwordMatch = password === user.password;
      console.log('直接比较结果:', passwordMatch);
    }
    
    if (!passwordMatch) {
      console.log('密码验证失败');
    } else {
      console.log('密码验证成功');
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testLogin();
