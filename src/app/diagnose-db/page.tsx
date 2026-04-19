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

      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: checkData1 } = await supabase
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

      addLog("\n=== 测试2: 尝试使用 upsert ===");
      
      const testValue2 = `UPTEST_${Date.now()}`;
      
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

      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: checkData2 } = await supabase
        .from('users')
        .select('name')
        .eq('id', testUserId)
        .single();

      addLog(`\nupsert 后查询结果:`);
      addLog(`  - name: ${checkData2?.name}`);

      addLog("\n=== 测试3: 分析当前认证状态 ===");
      
      const { data: { session } } = await supabase.auth.getSession();
      addLog(`当前会话:`);
      addLog(`  - 是否有会话: ${!!session}`);
      if (session) {
        addLog(`  - 用户ID: ${session.user?.id}`);
        addLog(`  - 角色: ${session.user?.role}`);
        
        if (session.user?.role === 'anon') {
          addLog(`\n💡 发现问题: 当前使用的是 anon (匿名) 角色!`);
          addLog(`   建议: 需要在 Supabase Dashboard 中修改 RLS 策略`);
        }
      }

      addLog("\n=== 恢复原始数据 ===");
      await supabase
        .from('users')
        .update({ name: 'kevin666' })
        .eq('id', testUserId);
      
      addLog("✅ 已尝试恢复数据");

    } catch (error: any) {
      addLog(`💥 诊断过程异常: ${error.message || error}`);
    }

    addLog("\n🔍 ===== 诊断完成 =====");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-mono">
      <h1 className="text-2xl font-bold mb-4">🔬 数据库更新诊断工具</h1>
      <p className="text-gray-600 mb-6">诊断为什么 UPDATE 操作成功但数据未真正改变</p>

      <div className="mb-6">
        <label className="block mb-2 font-bold">用户ID:</label>
        <input
          type="text"
          value={testUserId}
          onChange={(e) => setTestUserId(e.target.value)}
          className="w-full p-3 border rounded text-sm font-mono"
        />
      </div>

      <button 
        onClick={runDiagnosis}
        className="px-6 py-3 bg-red-600 text-white rounded cursor-pointer text-lg mb-6 hover:bg-red-700"
      >
        🔬 运行诊断
      </button>

      <div className="bg-gray-100 p-4 rounded font-mono text-sm max-h-[600px] overflow-y-auto border">
        <h3 className="font-bold mb-2">📋 诊断日志:</h3>
        <pre className="whitespace-pre-wrap break-all m-0">
          {logs.join('\n') || '点击按钮开始诊断...'}
        </pre>
      </div>

      <div className="mt-8 p-4 bg-green-50 rounded">
        <h3 className="font-bold mb-3">🎯 可能的问题和解决方案:</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li><strong>RLS (Row Level Security) 策略阻止</strong> - anon 角色可能只有 SELECT 权限</li>
          <li><strong>数据库触发器</strong> - 可能存在 BEFORE/AFTER UPDATE 触发器恢复原值</li>
          <li><strong>字段默认值约束</strong> - 某些字段可能有 DEFAULT 值覆盖更新</li>
          <li><strong>缓存问题</strong> - Supabase 可能返回缓存的数据</li>
        </ol>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded">
        <h3 className="font-bold mb-3">⚡ 快速修复方案:</h3>
        <p className="mb-2">
          访问你的 
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 mx-1">
            Supabase Dashboard
          </a>:
        </p>
        <ol className="list-decimal list-inside space-y-1">
          <li>进入项目 → Authentication → Policies</li>
          <li>找到 users 表的策略列表</li>
          <li>添加新的策略：Allow users to update their own profile</li>
          <li>或者临时禁用 RLS（仅用于测试）</li>
        </ol>
      </div>
    </div>
  );
}
