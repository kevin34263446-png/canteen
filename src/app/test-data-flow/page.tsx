"use client";

import { useState, useEffect } from "react";
import { getUserById, updateUserBasicInfo, login, User } from "@/lib/supabase";

export default function TestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testUser, setTestUser] = useState<User | null>(null);
  const [testResult, setTestResult] = useState<string>("");

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTest = async () => {
    setLogs([]);
    setTestResult("");
    
    try {
      // 步骤 1: 登录
      addLog("🔄 开始登录...");
      const loginResult = await login("1508158461@qq.com", "123456", "student");
      
      if (loginResult.error) {
        addLog(`❌ 登录失败: ${loginResult.error}`);
        return;
      }
      
      if (!loginResult.user || !loginResult.token) {
        addLog("❌ 登录返回数据为空");
        return;
      }
      
      addLog(`✅ 登录成功! 用户ID: ${loginResult.user.id}`);
      addLog(`📊 登录返回的用户信息: ${JSON.stringify(loginResult.user)}`);

      // 保存 token 和用户信息到 localStorage
      localStorage.setItem('auth_token', loginResult.token);
      localStorage.setItem('auth_user', JSON.stringify(loginResult.user));
      
      // 步骤 2: 从数据库获取最新用户信息
      addLog("\n🔄 从数据库获取最新用户信息...");
      const decoded = JSON.parse(atob(loginResult.token));
      addLog(`📝 解码后的Token: userId=${decoded.userId}`);
      
      const dbUser = await getUserById(decoded.userId);
      if (dbUser) {
        addLog(`✅ 获取成功!`);
        addLog(`📊 数据库中的用户信息: ${JSON.stringify(dbUser)}`);
        setTestUser(dbUser);
        
        // 对比登录返回的数据和数据库的数据
        addLog("\n🔍 对比数据:");
        addLog(`  姓名 - 登录: ${loginResult.user.name} | 数据库: ${dbUser.name} | 匹配: ${loginResult.user.name === dbUser.name ? '✅' : '❌'}`);
        addLog(`  学号 - 登录: ${loginResult.user.student_id} | 数据库: ${dbUser.student_id} | 匹配: ${loginResult.user.student_id === dbUser.student_id ? '✅' : '❌'}`);
      } else {
        addLog("❌ 无法从数据库获取用户信息");
      }

      // 步骤 3: 测试更新操作
      addLog("\n🔄 测试更新用户信息...");
      const testStudentId = `TEST_${Date.now()}`;
      addLog(`📝 测试学号: ${testStudentId}`);
      
      const updateResult = await updateUserBasicInfo(decoded.userId, {
        name: dbUser?.name || "TestUser",
        student_id: testStudentId,
      });
      
      if (updateResult.success) {
        addLog(`✅ 更新成功!`);
        addLog(`📊 更新结果: ${JSON.stringify(updateResult)}`);
        
        // 步骤 4: 再次从数据库读取，验证更新是否生效
        addLog("\n🔄 验证更新是否写入数据库...");
        const updatedDbUser = await getUserById(decoded.userId);
        
        if (updatedDbUser) {
          addLog(`✅ 获取成功!`);
          addLog(`📊 更新后的数据库数据: ${JSON.stringify(updatedDbUser)}`);
          
          if (updatedDbUser.student_id === testStudentId) {
            addLog(`✅✅✅ 数据库已正确更新! 学号匹配: ${updatedDbUser.student_id}`);
            setTestResult("SUCCESS: 数据库更新和读取都正常!");
          } else {
            addLog(`❌❌❌ 数据库未正确更新! 预期: ${testStudentId}, 实际: ${updatedDbUser.student_id}`);
            setTestResult("FAIL: 数据库更新失败!");
          }
          
          // 恢复原始数据
          addLog("\n🔄 恢复原始数据...");
          await updateUserBasicInfo(decoded.userId, {
            name: updatedDbUser.name,
            student_id: dbUser?.student_id || "",
          });
          addLog("✅ 原始数据已恢复");
        } else {
          addLog("❌ 无法验证更新结果");
          setTestResult("ERROR: 无法验证更新");
        }
      } else {
        addLog(`❌ 更新失败: ${updateResult.error}`);
        setTestResult(`ERROR: ${updateResult.error}`);
      }
      
    } catch (error) {
      addLog(`💥 测试过程异常: ${error.message || error}`);
      setTestResult(`EXCEPTION: ${error.message || error}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>🧪 用户数据流测试工具</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        此工具用于诊断用户资料编辑后重新登录数据丢失的问题
      </p>

      <button 
        onClick={runTest}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        🚀 运行完整测试
      </button>

      {testResult && (
        <div style={{
          padding: '16px',
          borderRadius: '6px',
          marginBottom: '20px',
          backgroundColor: testResult.includes('SUCCESS') ? '#d4edda' : '#f8d7da',
          color: testResult.includes('SUCCESS') ? '#155724' : '#721c24',
          fontWeight: 'bold'
        }}>
          {testResult}
        </div>
      )}

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '16px',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '14px',
        maxHeight: '600px',
        overflowY: 'auto'
      }}>
        <h3>📋 测试日志:</h3>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {logs.join('\n') || '点击按钮开始测试...'}
        </pre>
      </div>

      {testUser && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#e3f2fd',
          borderRadius: '6px'
        }}>
          <h3>👤 当前数据库中的用户信息:</h3>
          <pre>{JSON.stringify(testUser, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '16px', backgroundColor: '#fff3cd', borderRadius: '6px' }}>
        <h3>💡 使用说明:</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>点击"运行完整测试"按钮</li>
          <li>观察日志输出，特别关注：
            <ul>
              <li><strong>步骤2:</strong> 检查登录时获取的用户信息是否来自数据库</li>
              <li><strong>步骤4:</strong> 检查更新后的数据是否真正写入了数据库</li>
            </ul>
          </li>
          <li>如果显示"SUCCESS"，说明数据库操作正常</li>
          <li>如果显示"FAIL"，说明存在数据同步问题</li>
        </ol>
      </div>
    </div>
  );
}
