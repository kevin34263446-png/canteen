"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DiagnosePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testUserId, setTestUserId] = useState("1f53a526-4068-4788-8beb-a0a66f496577");

  const addLog = (msg: string) => {
    console.log(msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const runDiagnosis = async () => {
    setLogs([]);
    addLog("🔍 开始数据库更新诊断...");

    try {
      // 测试1: 直接使用 supabase 客户端
      addLog("\n=== 测试1: 标准 UPDATE ===");
      
      const testValue = `TEST_${Date.now()}`;
      addLog(`📝 尝试将 name 更新为: ${testValue}`);
      
      const { data: updateData1, error: error1 } = await supabase
        .from('users')
        .update({ 
          name: testValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', testUserId)
        .select();
      
      addLog(`UPDATE 结果:`);
      addLog(`  - error: ${JSON.stringify(error1)}`);
      addLog(`  - data: ${JSON.stringify(updateData1)}`);
      addLog(`  - data 类型: ${typeof updateData1}`);
      addLog(`  - 是否为数组: ${Array.isArray(updateData1)}`);

      // 立即查询验证
      await new Promise(resolve => setTimeout(resolve, 500)); // 等待500ms
      
      const { data: checkData1, error: checkError1 } = await supabase
        .from('users')
        .select('name, student_id, updated_at')
        .eq('id', testUserId)
        .single();

      addLog(`\n查询结果 (等待500ms后):`);
      addLog(`  - name: ${checkData1?.name}`);
      addLog(`  - 是否等于测试值: ${checkData1?.name === testValue ? '✅ 是' : '❌ 否'}`);
      
      if (checkData1?.name !== testValue) {
        addLog(`⚠️ 警告: 数据库中的值未改变!`);
      }

      // 测试2: 使用 rpc 调用（如果可用）
      addLog("\n=== 测试2: 尝试使用 upsert ===");
      
      const testValue2 = `UPTEST_${Date.now()}`;
      addLog(`📝 尝试 upsert name 为: ${testValue2}`);
      
      const { data: upsertData, error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: testUserId,
          name: testValue2,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select();
      
      addLog(`upsert 结果:`);
      addLog(`  - error: ${JSON.stringify(upsertError)}`);
      addLog(`  - data: ${JSON.stringify(upsertData)}`);

      // 查询验证
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: checkData2 } = await supabase
        .from('users')
        .select('name')
        .eq('id', testUserId)
        .single();

      addLog(`\nupsert 后查询结果:`);
      addLog(`  - name: ${checkData2?.name}`);
      addLog(`  - 是否等于测试值: ${checkData2?.name === testValue2 ? '✅ 是' : '❌ 否'}`);

      // 测试3: 检查 RLS 策略
      addLog("\n=== 测试3: 检查表信息和权限 ===");
      
      try {
        // 尝试获取表的元信息
        const { data: tableInfo, error: tableError } = await supabase
          .rpc('get_table_info', { table_name: 'users' })
          .maybeSingle();
        
        if (tableError) {
          addLog(`⚠️ 无法获取表信息 (这是正常的，RPC可能不存在): ${tableError.message}`);
        } else {
          addLog(`表信息: ${JSON.stringify(tableInfo)}`);
        }
      } catch (e) {
        addLog(`RPC 调用异常: ${e.message}`);
      }

      // 测试4: 使用 service role key 的可能性检查
      addLog("\n=== 测试4: 分析当前认证状态 ===");
      
      const { data: { session } } = await supabase.auth.getSession();
      addLog(`当前会话:`);
      addLog(`  - 是否有会话: ${!!session}`);
      if (session) {
        addLog(`  - 用户ID: ${session.user?.id}`);
        addLog(`  - 角色: ${session.user?.role}`);
        addLog(`  - 是否是 anon 角色: ${session.user?.role === 'anon'}`);
        
        if (session.user?.role === 'anon') {
          addLog(`\n💡 发现问题: 当前使用的是 anon (匿名) 角色!`);
          addLog(`   anon 角色可能没有足够的权限更新 users 表`);
          addLog(`   建议: 需要在 Supabase Dashboard 中修改 RLS 策略`);
        }
      }

      // 最终测试: 尝试直接 SQL (通过 rpc)
      addLog("\n=== 测试5: 尝试原始 SQL 更新 ===");
      
      try {
        const finalTestValue = `SQLTEST_${Date.now()}`;
        addLog(`📝 尝试通过 RPC 执行原始 SQL...`);
        
        // 注意：这需要你在 Supabase 中创建对应的 RPC 函数
        const { data: sqlResult, error: sqlError } = await supabase
          .rpc('update_user_name', {
            user_id: testUserId,
            new_name: finalTestValue
          });
        
        if (sqlError) {
          addLog(`❌ RPC 失败 (预期中，如果函数不存在): ${sqlError.message}`);
          addLog(`   这说明需要创建自定义 RPC 函数或修改 RLS 策略`);
        } else {
          addLog(`✅ RPC 成功: ${JSON.stringify(sqlResult)}`);
          
          // 验证
          const { data: finalCheck } = await supabase
            .from('users')
            .select('name')
            .eq('id', testUserId)
            .single();
          
          addLog(`SQL 更新后查询: name = ${finalCheck?.name}`);
        }
      } catch (e) {
        addLog(`RPC 异常: ${e.message}`);
      }

      // 恢复原始数据
      addLog("\n=== 恢复原始数据 ===");
      await supabase
        .from('users')
        .update({ name: 'kevin666' })
        .eq('id', testUserId);
      
      addLog("✅ 已尝试恢复数据为 kevin666");

    } catch (error) {
      addLog(`💥 诊断过程异常: ${error.message || error}`);
    }

    addLog("\n🔍 ===== 诊断完成 =====");
    addLog("\n💡 请查看上方日志，找出为什么 UPDATE 不生效的原因");
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>🔬 数据库更新诊断工具</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        诊断为什么 UPDATE 操作成功但数据未真正改变
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          用户ID:
        </label>
        <input
          type="text"
          value={testUserId}
          onChange={(e) => setTestUserId(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}
        />
      </div>

      <button 
        onClick={runDiagnosis}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        🔬 运行诊断
      </button>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '16px',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '13px',
        maxHeight: '600px',
        overflowY: 'auto',
        border: '1px solid #dee2e6'
      }}>
        <h3>📋 诊断日志:</h3>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
          {logs.join('\n') || '点击按钮开始诊断...'}
        </pre>
      </div>

      <div style={{ marginTop: '30px', padding: '16px', backgroundColor: '#d4edda', borderRadius: '6px' }}>
        <h3>🎯 可能的问题和解决方案:</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li><strong>RLS (Row Level Security) 策略阻止</strong>
            <ul>
              <li>anon 角色可能只有 SELECT 权限，没有 UPDATE 权限</li>
              <li>解决方案：在 Supabase Dashboard → Authentication → Policies 中添加允许更新的策略</li>
            </ul>
          </li>
          <li><strong>数据库触发器</strong>
            <ul>
              <li>可能存在 BEFORE/AFTER UPDATE 触发器恢复原值</li>
              <li>解决方案：检查并修改触发器逻辑</li>
            </ul>
          </li>
          <li><strong>字段默认值约束</strong>
            <ul>
              <li>某些字段可能有 DEFAULT 值覆盖了我们的更新</li>
              <li>解决方案：移除或修改 DEFAULT 约束</li>
            </ul>
          </li>
          <li><strong>缓存问题</strong>
            <ul>
              <li>Supabase 可能返回缓存的数据</li>
              <li>解决方案：在查询中使用 `.headers({'Cache-Control': 'no-cache'})`</li>
            </ul>
          </li>
        </ol>
      </div>

      <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fff3cd', borderRadius: '6px' }}>
        <h3>⚡ 快速修复方案:</h3>
        <p>访问你的 <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>Supabase Dashboard</a>:</p>
        <ol style={{ lineHeight: '1.8' }}>
          <li>进入项目 → Authentication → Policies</li>
          <li>找到 <code>users</code> 表的策略列表</li>
          <li>添加新的策略：
            <pre style={{ background: '#fff', padding: '10px', marginTop: '8px', borderRadius: '4px' }}>
{`Policy Name: Allow users to update their own profile
Table: users
Operation: UPDATE
WITH CHECK: auth.uid() = id`}
            </pre>
          </li>
          <li>或者临时禁用 RLS（仅用于测试）：</li>
          <li>在 Table Editor → users → RLS 设置 → 关闭 "Enable RLS"</li>
        </ol>
      </div>
    </div>
  );
}
