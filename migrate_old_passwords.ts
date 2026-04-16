// 临时脚本：将数据库中旧的明文密码迁移为加密密码
// 注意：由于我们无法直接批量读取并更新密码，建议：
// 方案1：让用户使用"找回密码"功能重置密码
// 方案2：或者你手动在 Supabase 中执行更新

// 这里是一个示例，说明如何更新单个用户密码
// import { supabase } from './src/lib/supabase';
// import bcrypt from 'bcryptjs';

// async function migratePassword(email: string, plainPassword: string) {
//   const hashedPassword = await bcrypt.hash(plainPassword, 10);
//   await supabase
//     .from('users')
//     .update({ password: hashedPassword })
//     .eq('email', email);
// }

// 或者使用 SQL 在 Supabase 中直接重置一个用户的密码为 '123456'
// 然后用户可以登录后修改密码

console.log('建议：');
console.log('1. 在 Supabase SQL 编辑器中执行以下语句重置你的密码为 123456：');
console.log('   UPDATE users SET password = \'$2a$10$YourHashedPasswordHere\' WHERE email = \'你的邮箱\';');
console.log('');
console.log('2. 或者使用管理员面板中的"重置密码"功能');
console.log('');
console.log('注意：$2a$10$... 是 bcrypt 加密后的密码哈希');
