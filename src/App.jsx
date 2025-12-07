import React, { useState, useMemo } from 'react';
import { Calculator, AlertTriangle, Info, CheckCircle, Activity, ArrowRight, Clock, Calendar, Plus, Trash2, ChevronDown, ChevronUp, PieChart } from 'lucide-react';

const App = () => {
  // --- 상태 관리 ---
  const [tasks, setTasks] = useState([
    { 
      id: 1, 
      weight: 10, 
      activity: 'G1', 
      factors: [], 
      duration: 10,     // 단위 작업 시간
      timeUnit: 'sec',  // 시간 단위 ('sec', 'min', 'hr')
      frequency: 360    // 작업 횟수
    }
  ]);
  
  // 전역 설정
  const [daysPerYear, setDaysPerYear] = useState(220); // 연간 근무 일수
  const [workYears, setWorkYears] = useState(10); // 근속 연수

  // UI 상태
  const [activeTaskId, setActiveTaskId] = useState(1);

  // --- 데이터 정의 ---
  const activities = {
    G1: { code: 'G1', type: 'lift', b: 800, m: 45, label: '똑바로 → 똑바로' },
    G2: { code: 'G2', type: 'lift', b: 1100, m: 80, label: '약간 굴곡 → 똑바로' },
    G3: { code: 'G3', type: 'lift', b: 1900, m: 70, label: '심한 굴곡 → 똑바로' },
    G4: { code: 'G4', type: 'lift', b: 1100, m: 75, label: '약간 굴곡 → 약간 굴곡' },
    G5: { code: 'G5', type: 'lift', b: 1900, m: 65, label: '심한 굴곡 → 약간 굴곡' },
    G6: { code: 'G6', type: 'lift', b: 1900, m: 60, label: '심한 굴곡 → 심한 굴곡' },
    G7: { code: 'G7', type: 'carry', b: 800, m: 95, label: '몸 앞·양옆 운반' },
    G8: { code: 'G8', type: 'carry', b: 800, m: 180, label: '한쪽·한 손 운반' },
    G9: { code: 'G9', type: 'carry', b: 1100, m: 60, label: '어깨·등에 멤' },
    G10: { code: 'G10', type: 'hold', b: 800, m: 45, label: '몸 앞·양옆·어깨·등 유지' },
    G11: { code: 'G11', type: 'hold', b: 800, m: 85, label: '한쪽·한 손 유지' },
  };

  const correctionFactors = {
    F1: { code: 'F1', val: 1.9, label: '한 손 (einhändig)' },
    F2: { code: 'F2', val: 1.9, label: '비대칭 (asymmetrisch)' },
    F3: { code: 'F3', val: 1.3, label: '몸에서 멀리 (똑바로~약간 굴곡)' },
    F4: { code: 'F4', val: 1.1, label: '몸에서 멀리 (심한 굴곡)' },
  };

  const LIMITS = {
    force: { male: 2700, female: 2000 },
    daily: { male: 2000, female: 500 },
    life: { male: 7000000, female: 3000000 }
  };

  // --- 헬퍼 함수 ---
  const calculateForce = (actCode, w, factors = []) => {
    const activity = activities[actCode];
    let factorVal = 1.0;
    
    if (activity.type === 'lift' && factors.length > 0) {
       const vals = factors.map(f => correctionFactors[f]?.val || 1.0);
       factorVal = Math.max(...vals);
    }
    return activity.b + (activity.m * factorVal * w);
  };

  const calculateTotalHours = (duration, unit, freq) => {
    let hoursPerUnit = 0;
    switch(unit) {
      case 'sec': hoursPerUnit = duration / 3600; break;
      case 'min': hoursPerUnit = duration / 60; break;
      case 'hr': hoursPerUnit = duration; break;
      default: hoursPerUnit = 0;
    }
    return hoursPerUnit * freq;
  };

  // --- Task 관리 핸들러 ---
  const addTask = () => {
    if (tasks.length >= 10) return;
    const newId = Math.max(...tasks.map(t => t.id)) + 1;
    setTasks([...tasks, { 
      id: newId, 
      weight: 10, 
      activity: 'G1', 
      factors: [], 
      duration: 10, 
      timeUnit: 'sec', 
      frequency: 100 
    }]);
    setActiveTaskId(newId);
  };

  const removeTask = (id) => {
    if (tasks.length <= 1) return;
    setTasks(tasks.filter(t => t.id !== id));
    if (activeTaskId === id) setActiveTaskId(tasks[0].id);
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const toggleFactor = (taskId, factorCode) => {
    const task = tasks.find(t => t.id === taskId);
    const currentFactors = task.factors;
    let newFactors;
    if (currentFactors.includes(factorCode)) {
      newFactors = currentFactors.filter(f => f !== factorCode);
    } else {
      newFactors = [...currentFactors, factorCode];
    }
    updateTask(taskId, 'factors', newFactors);
  };

  // --- 전체 결과 계산 ---
  const result = useMemo(() => {
    let maxForce = 0;
    let sumForceSquaredTime = 0;
    
    // 1차 패스: 개별 Force 및 Squared Dose 계산
    const tempResults = tasks.map(task => {
      const force = calculateForce(task.activity, task.weight, task.factors);
      if (force > maxForce) maxForce = force;
      
      const totalHours = calculateTotalHours(task.duration, task.timeUnit, task.frequency);
      
      // 개별 작업의 "부하량" (F^2 * t)
      const squaredDose = Math.pow(force, 2) * totalHours;
      sumForceSquaredTime += squaredDose;

      return { ...task, force, totalHours, squaredDose };
    });

    // 2차 패스: 개별 Dose 및 기여도(%) 계산
    const taskResults = tempResults.map(task => {
        const individualDose = Math.sqrt(task.squaredDose); 
        const percentage = sumForceSquaredTime > 0 
            ? (task.squaredDose / sumForceSquaredTime) * 100 
            : 0;
            
        return { ...task, individualDose, percentage };
    });

    const dailyDoseRaw = Math.sqrt(sumForceSquaredTime);
    const lifeDoseRaw = dailyDoseRaw * daysPerYear * workYears;

    return {
      maxForce: Math.round(maxForce),
      dailyDose: Math.round(dailyDoseRaw),
      lifeDose: Math.round(lifeDoseRaw),
      taskResults
    };
  }, [tasks, daysPerYear, workYears]);


  // --- 매트릭스 설정 ---
  const matrixRows = [0, 5, 10, 15, 20, 25, 30, 40];
  const matrixCols = ['G1', 'G2', 'G3', 'G7', 'G8', 'G9'].map(code => ({
    label: code,
    act: code,
    factors: []
  }));

  const getRiskColor = (force) => {
    if (force <= LIMITS.force.female) return 'bg-slate-200 text-slate-700';
    if (force <= LIMITS.force.male) return 'bg-amber-400 text-slate-900 font-semibold';
    return 'bg-red-600 text-white font-bold';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 헤더 */}
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="text-blue-600" />
              척추 압박력 & 용량 평가 시뮬레이터
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              복합 작업(최대 10개) 평가 지원
            </p>
          </div>
          <div className="flex gap-4 text-sm bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
               <span className="block text-slate-500 text-xs">연간 근무일</span>
               <input 
                 type="number" value={daysPerYear} 
                 onChange={(e) => setDaysPerYear(Number(e.target.value))}
                 className="w-16 bg-white border border-slate-300 rounded px-1 py-0.5"
               /> 일
            </div>
            <div>
               <span className="block text-slate-500 text-xs">근속 연수</span>
               <input 
                 type="number" value={workYears} 
                 onChange={(e) => setWorkYears(Number(e.target.value))}
                 className="w-16 bg-white border border-slate-300 rounded px-1 py-0.5"
               /> 년
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* 입력 섹션 (Task List) - 넓게 사용 (5/12) */}
          <div className="xl:col-span-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
               <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 <Calculator className="w-5 h-5" /> 작업 목록 ({tasks.length}/10)
               </h2>
               <button
                 onClick={addTask}
                 disabled={tasks.length >= 10}
                 className="text-sm flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 <Plus className="w-4 h-4" /> 작업 추가
               </button>
            </div>

            <div className="space-y-3">
              {result.taskResults.map((task, index) => {
                const isActive = activeTaskId === task.id;
                const activityInfo = activities[task.activity];
                const isLift = activityInfo.type === 'lift';

                return (
                  <div key={task.id} className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${isActive ? 'ring-2 ring-blue-500 border-transparent shadow-md' : 'border-slate-200 shadow-sm'}`}>
                    {/* 카드 헤더 (요약 정보) */}
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                      onClick={() => setActiveTaskId(isActive ? null : task.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-800 truncate">{task.activity} - {activityInfo.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-2 gap-y-1 items-center">
                             <span>{task.weight}kg</span>
                             <span className="text-slate-300">|</span>
                             <span>{task.totalHours.toFixed(2)} hr</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Dose 및 기여도 표시 (우측) - 폰트 크기 증가 */}
                      <div className="text-right mr-3 pl-3 border-l border-slate-200 min-w-[90px]">
                          <div className="text-sm font-bold text-blue-600">
                              {(task.individualDose / 1000).toFixed(3)} kNh
                          </div>
                          <div className="text-xs text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                              <PieChart className="w-3.5 h-3.5" />
                              {task.percentage.toFixed(1)}% 기여
                          </div>
                      </div>

                      <div className="flex items-center gap-2 pl-2">
                        {tasks.length > 1 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {isActive ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* 카드 내용 (편집 폼) */}
                    {isActive && (
                      <div className="p-4 border-t border-slate-100 space-y-4 bg-white">
                        
                        {/* 1. 무게 */}
                        <div>
                           <label className="block text-xs font-semibold text-slate-500 mb-1">중량물 무게 (kg)</label>
                           <input 
                             type="number" min="0" value={task.weight}
                             onChange={(e) => updateTask(task.id, 'weight', Number(e.target.value))}
                             className="w-full p-2 border border-slate-300 rounded text-sm"
                           />
                        </div>

                        {/* 2. 시간 및 횟수 설정 */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <div className="col-span-2">
                               <label className="block text-xs font-semibold text-slate-500 mb-1">단위작업 수행 시간</label>
                               <div className="flex gap-1">
                                 <input 
                                   type="number" min="0" step="0.1" value={task.duration}
                                   onChange={(e) => updateTask(task.id, 'duration', Number(e.target.value))}
                                   className="w-full p-2 border border-slate-300 rounded text-sm"
                                 />
                                 <select 
                                    value={task.timeUnit}
                                    onChange={(e) => updateTask(task.id, 'timeUnit', e.target.value)}
                                    className="p-2 border border-slate-300 rounded text-sm bg-white"
                                 >
                                    <option value="sec">초</option>
                                    <option value="min">분</option>
                                    <option value="hr">시간</option>
                                 </select>
                               </div>
                            </div>
                            <div>
                               <label className="block text-xs font-semibold text-slate-500 mb-1">작업 횟수</label>
                               <input 
                                 type="number" min="1" value={task.frequency}
                                 onChange={(e) => updateTask(task.id, 'frequency', Number(e.target.value))}
                                 className="w-full p-2 border border-slate-300 rounded text-sm"
                               />
                            </div>
                          </div>
                          <div className="text-right text-xs text-blue-600 font-bold bg-blue-50 p-2 rounded flex justify-between items-center">
                             <span>계산된 총 작업 시간:</span>
                             <span className="text-sm">{task.totalHours.toFixed(4)} 시간</span>
                          </div>
                        </div>

                        {/* 3. 자세 선택 */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">작업 자세</label>
                          <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto custom-scrollbar border rounded p-1">
                            {Object.values(activities).map((act) => (
                              <button
                                key={act.code}
                                onClick={() => updateTask(task.id, 'activity', act.code)}
                                className={`text-left text-xs p-2 rounded ${task.activity === act.code ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
                              >
                                {act.code} <span className="opacity-75 text-[10px]">{act.label.split('→')[0]}..</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 4. 보정 계수 */}
                        <div className={`space-y-2 ${!isLift ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                           <label className="block text-xs font-semibold text-slate-500">
                             보정 계수 {isLift ? '(최대값 1개 자동적용)' : '(G1~G6만 적용)'}
                           </label>
                           <div className="grid grid-cols-1 gap-1">
                             {Object.values(correctionFactors).map(f => (
                               <label key={f.code} className={`flex items-center p-2 rounded border cursor-pointer ${task.factors.includes(f.code) ? 'bg-orange-50 border-orange-200' : 'border-slate-100'}`}>
                                 <input 
                                   type="checkbox" 
                                   checked={task.factors.includes(f.code)}
                                   onChange={() => toggleFactor(task.id, f.code)}
                                   disabled={!isLift}
                                   className="w-3.5 h-3.5 text-orange-600 rounded"
                                 />
                                 <span className="ml-2 text-xs text-slate-700">{f.code} {f.label} (x{f.val})</span>
                               </label>
                             ))}
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 결과 섹션 (7/12) */}
          <div className="xl:col-span-7 space-y-6">
            
            {/* 1. 종합 결과 카드 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 p-6 text-white">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> 종합 평가 결과 (Total Assessment)
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
                  
                  {/* 단일 압박력 (최대값) */}
                  <div>
                     <div className="text-xs text-slate-400 mb-1">최대 단일 압박력 (Max Force)</div>
                     <div className="flex items-end justify-center sm:justify-start gap-1 mb-2">
                        <span className="text-4xl font-bold">{result.maxForce.toLocaleString()}</span>
                        <span className="text-base text-slate-500 mb-1">N</span>
                     </div>
                     <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${result.maxForce > LIMITS.force.male ? 'bg-red-500' : result.maxForce > LIMITS.force.female ? 'bg-amber-500' : 'bg-green-600'}`}>
                        {result.maxForce > LIMITS.force.male ? '위험' : result.maxForce > LIMITS.force.female ? '주의' : '안전'}
                     </span>
                  </div>

                  {/* 일일 용량 */}
                  <div className="border-l border-slate-700 pl-0 sm:pl-8 border-t sm:border-t-0 pt-4 sm:pt-0">
                     <div className="text-xs text-slate-400 mb-1">총 일일 용량 (Total Daily)</div>
                     <div className="flex items-end justify-center sm:justify-start gap-1 mb-2">
                        <span className="text-3xl font-bold">{(result.dailyDose / 1000).toFixed(3)}</span>
                        <span className="text-sm text-slate-500 mb-1">kNh</span>
                     </div>
                     <div className="flex flex-col text-xs gap-0.5">
                        <span className={result.dailyDose > LIMITS.daily.male ? 'text-red-400 font-bold' : 'text-slate-500'}>
                           남: {result.dailyDose > LIMITS.daily.male ? '초과' : '적합'} (2.0)
                        </span>
                        <span className={result.dailyDose > LIMITS.daily.female ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                           여: {result.dailyDose > LIMITS.daily.female ? '초과' : '적합'} (0.5)
                        </span>
                     </div>
                  </div>

                  {/* 평생 용량 */}
                  <div className="border-l border-slate-700 pl-0 sm:pl-8 border-t sm:border-t-0 pt-4 sm:pt-0">
                     <div className="text-xs text-slate-400 mb-1">평생 용량 (Lifetime)</div>
                     <div className="flex items-end justify-center sm:justify-start gap-1 mb-2">
                        <span className="text-3xl font-bold">{(result.lifeDose / 1000000).toFixed(3)}</span>
                        <span className="text-sm text-slate-500 mb-1">MNh</span>
                     </div>
                      <div className="flex flex-col text-xs gap-0.5">
                        <span className={result.lifeDose > LIMITS.life.male ? 'text-red-400 font-bold' : 'text-slate-500'}>
                           남: {result.lifeDose > LIMITS.life.male ? '초과' : '적합'} (7)
                        </span>
                        <span className={result.lifeDose > LIMITS.life.female ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                           여: {result.lifeDose > LIMITS.life.female ? '초과' : '적합'} (3)
                        </span>
                     </div>
                  </div>
                </div>
              </div>

              {/* 상세 공식 정보 */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 text-xs text-slate-500 font-mono">
                 <p className="mb-1"><strong>[계산 로직]</strong></p>
                 <p>1. 작업 시간(hr) = 단위작업시간({tasks[0].timeUnit}) × 횟수 × 환산계수</p>
                 <p>2. Daily Dose = √[ Σ(작업별 압박력² × 작업시간) ]</p>
                 <p>3. Lifetime Dose = Daily Dose × {daysPerYear}일 × {workYears}년</p>
              </div>
            </div>

            {/* 2. 매트릭스 (요청: G1,G2,G3,G7,G8,G9 만 표시) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    단일 압박력 참조표
                    <span className="text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded border ml-2">주요 자세 6종</span>
                  </h3>
                  <div className="flex gap-4 mt-2 text-xs">
                     <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-200 rounded-sm"></span> ≤ 2.0kN (안전)</span>
                     <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-400 rounded-sm"></span> ~ 2.7kN (주의)</span>
                     <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-600 rounded-sm"></span> &gt; 2.7kN (위험)</span>
                  </div>
               </div>
               
               <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 bg-slate-800 text-white font-medium min-w-[60px] text-xs">Weight</th>
                      {matrixCols.map((col, idx) => (
                        <th key={idx} className="p-3 bg-cyan-900 text-white font-medium border-l border-cyan-800 min-w-[70px] text-xs">
                          {col.act}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixRows.map((rWeight) => (
                      <tr key={rWeight} className="hover:bg-slate-50">
                        <td className="p-2 font-bold border-b bg-slate-100 text-slate-700 text-xs">
                          {rWeight} kg
                        </td>
                        {matrixCols.map((col, cIdx) => {
                          const f = calculateForce(col.act, rWeight, col.factors);
                          const colorClass = getRiskColor(f);
                          return (
                            <td key={cIdx} className={`p-2 border-b border-l border-white/50 text-xs ${colorClass}`}>
                              {(f / 1000).toFixed(1)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;