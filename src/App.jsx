import React, { useState, useMemo } from 'react';
import { Calculator, CheckCircle, Plus, Upload, Save } from 'lucide-react';
import g1Start from './assets/G1_from.png';
import g1End from './assets/G1_to.png';
import g2Start from './assets/G2_from.png';
import g2End from './assets/G2_to.png';
import g3Start from './assets/G3_from.png';
import g3End from './assets/G3_to.png';
import g4Start from './assets/G4_from.png';
import g4End from './assets/G4_to.png';
import g5Start from './assets/G5_from.png';
import g5End from './assets/G5_to.png';
import g6Start from './assets/G6_from.png';
import g6End from './assets/G6_to.png';
import g7Img from './assets/G7.png';
import g8Img from './assets/G8.png';
import g9Img from './assets/G9.png';
import g10ImgRight from './assets/G10_right.png';
import g10ImgLeft from './assets/G10_left.png';
import g11Img from './assets/G11.png';

const App = () => {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      weight: 10,
      activity: 'G3',
      factors: [],
      duration: 10,
      timeUnit: 'sec',
      frequency: 360
    }
  ]);

  const [daysPerYear, setDaysPerYear] = useState(220);
  const [workYears, setWorkYears] = useState(10);
  const [activeTaskId, setActiveTaskId] = useState(1);
  const [mobileTab, setMobileTab] = useState('list'); // 'list' or 'editor'

  const activities = {
    G1: { code: 'G1', type: 'lift', b: 800, m: 45, label: '똑바로 → 똑바로', imageStart: g1Start, imageEnd: g1End },
    G2: { code: 'G2', type: 'lift', b: 1100, m: 80, label: '약간 굴곡 → 똑바로', imageStart: g2Start, imageEnd: g2End },
    G3: { code: 'G3', type: 'lift', b: 1900, m: 70, label: '심한 굴곡 → 똑바로', imageStart: g3Start, imageEnd: g3End },
    G4: { code: 'G4', type: 'lift', b: 1100, m: 75, label: '약간 굴곡 → 약간 굴곡', imageStart: g4Start, imageEnd: g4End },
    G5: { code: 'G5', type: 'lift', b: 1900, m: 65, label: '심한 굴곡 → 약간 굴곡', imageStart: g5Start, imageEnd: g5End },
    G6: { code: 'G6', type: 'lift', b: 1900, m: 60, label: '심한 굴곡 → 심한 굴곡', imageStart: g6Start, imageEnd: g6End },
    G7: { code: 'G7', type: 'carry', b: 800, m: 95, label: '몸 앞·양옆 운반', image: g7Img },
    G8: { code: 'G8', type: 'carry', b: 800, m: 180, label: '한쪽·한 손 운반', image: g8Img },
    G9: { code: 'G9', type: 'carry', b: 1100, m: 60, label: '어깨·등에 멤', image: g9Img },
    G10: { code: 'G10', type: 'hold', b: 800, m: 45, label: '몸 앞·양옆·어깨·등 유지', imageStart: g10ImgLeft, imageEnd: g10ImgRight },
    G11: { code: 'G11', type: 'hold', b: 800, m: 85, label: '한쪽·한 손 유지', image: g11Img }
  };

  const correctionFactors = {
    F1: { code: 'F1', val: 1.9, label: '한 손' },
    F2: { code: 'F2', val: 1.9, label: '비대칭' },
    F3: { code: 'F3', val: 1.3, label: '몸에서 멀리 (약간)' },
    F4: { code: 'F4', val: 1.1, label: '몸에서 멀리 (심함)' }
  };

  const LIMITS = {
    force: { male: 2700, female: 2000 },
    daily: { male: 2000, female: 500 },
    life: { male: 7000000, female: 3000000 }
  };

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
    if (unit === 'sec') hoursPerUnit = duration / 3600;
    else if (unit === 'min') hoursPerUnit = duration / 60;
    else if (unit === 'hr') hoursPerUnit = duration;
    return hoursPerUnit * freq;
  };

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
    const newFactors = currentFactors.includes(factorCode)
      ? currentFactors.filter(f => f !== factorCode)
      : [...currentFactors, factorCode];
    updateTask(taskId, 'factors', newFactors);
  };

  const result = useMemo(() => {
    let maxForce = 0;
    let sumForceSquaredTime = 0;

    const tempResults = tasks.map(task => {
      const force = calculateForce(task.activity, task.weight, task.factors);
      if (force > maxForce) maxForce = force;

      const totalHours = calculateTotalHours(task.duration, task.timeUnit, task.frequency);
      const squaredDose = Math.pow(force, 2) * totalHours;
      sumForceSquaredTime += squaredDose;

      return { ...task, force, totalHours, squaredDose };
    });

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

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* TOP HEADER */}
      <div className="bg-white border-b border-slate-200 px-3 md:px-6 py-3 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-0 justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <Calculator className="w-5 h-5 md:w-6 md:h-6 text-slate-700" />
          <h1 className="text-base md:text-lg font-bold text-slate-900">척추 압박력 시뮬레이터</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-6 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <Upload className="w-4 h-4 text-slate-600" />
            <button className="text-slate-700 hover:text-slate-900">불러오기</button>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <Save className="w-4 h-4 text-slate-600" />
            <button className="text-slate-700 hover:text-slate-900">저장</button>
          </div>
          <div className="h-6 w-px bg-slate-300 hidden md:block"></div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <label className="text-slate-600">연간 근무</label>
            <input
              type="number"
              value={daysPerYear}
              onChange={(e) => setDaysPerYear(Number(e.target.value))}
              className="w-12 md:w-16 px-2 py-1 border border-slate-300 rounded text-slate-900 text-center"
            />
            <span className="text-slate-600">일</span>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <label className="text-slate-600">근속 연수</label>
            <input
              type="number"
              value={workYears}
              onChange={(e) => setWorkYears(Number(e.target.value))}
              className="w-12 md:w-16 px-2 py-1 border border-slate-300 rounded text-slate-900 text-center"
            />
            <span className="text-slate-600">년</span>
          </div>
        </div>
      </div>

      {/* MOBILE TAB NAVIGATION - Only visible < md (768px) */}
      <div className="md:hidden bg-white border-b border-slate-200">
        <div className="flex">
          <button
            onClick={() => setMobileTab('list')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              mobileTab === 'list'
                ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            작업 목록
          </button>
          <button
            onClick={() => setMobileTab('editor')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              mobileTab === 'editor'
                ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            상세 편집
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <div className={`w-full md:w-96 bg-white border-r border-slate-200 flex flex-col ${
          mobileTab === 'editor' ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Task List Header */}
          <div className="p-3 md:p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="bg-slate-100 p-1 rounded">
                  <Calculator className="w-4 h-4" />
                </span>
                작업 리스트
              </h2>
              <button
                onClick={addTask}
                disabled={tasks.length >= 10}
                className="text-xs flex items-center gap-1 bg-white text-slate-700 px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3" /> 추가
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="overflow-y-auto p-2 md:p-3" style={{ maxHeight: 'calc(100vh - 420px)' }}>
            <div className="space-y-2">
              {result.taskResults.map((task) => {
                const isActive = activeTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => {
                      setActiveTaskId(task.id);
                      // 모바일에서 작업 선택 시 편집 탭으로 자동 전환
                      if (window.innerWidth < 768) {
                        setMobileTab('editor');
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-900'}`}>
                          {task.activity}
                        </div>
                        <div className={`text-xs mt-1 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                          무게: {task.weight}kg
                        </div>
                        <div className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                          시간: {task.totalHours.toFixed(2)}hr
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                          {(task.individualDose / 1000).toFixed(2)} kNh
                        </div>
                        <div className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                          {task.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    {tasks.length > 1 && !isActive && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                        className="text-xs text-slate-400 hover:text-red-600 mt-1"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="p-3 md:p-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-slate-100 p-1 rounded">
                <CheckCircle className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-800">종합 분석</h3>
              <button className="ml-auto text-xs text-blue-600 hover:underline">남여 기준</button>
            </div>

            {/* 최대 압박력 */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <div className="text-xs text-slate-600 mb-1">최대 압박력 (N)</div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl md:text-2xl font-bold text-slate-900">{result.maxForce.toLocaleString()}</span>
              </div>
              <div className="mt-2">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                  result.maxForce > LIMITS.force.male
                    ? 'bg-red-200 text-slate-900 border border-red-400'
                    : result.maxForce > LIMITS.force.female
                    ? 'bg-yellow-200 text-slate-900 border border-yellow-400'
                    : 'bg-slate-200 text-slate-900 border border-slate-300'
                }`}>
                  {result.maxForce > LIMITS.force.male ? '위험' : result.maxForce > LIMITS.force.female ? '주의' : '안전'}
                </span>
              </div>
            </div>

            {/* 일일 용량 */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <div className="text-xs text-slate-600 mb-1">일일 용량 (kNh)</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-xl md:text-2xl font-bold text-slate-900">{(result.dailyDose / 1000).toFixed(2)}</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className={`px-1.5 py-0.5 rounded ${
                  result.dailyDose > LIMITS.daily.male ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  남 {result.dailyDose > LIMITS.daily.male ? '초과' : '적합'}
                </span>
                <span className={`px-1.5 py-0.5 rounded ${
                  result.dailyDose > LIMITS.daily.female ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  여 {result.dailyDose > LIMITS.daily.female ? '초과' : '적합'}
                </span>
              </div>
            </div>

            {/* 평생 용량 */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <div className="text-xs text-slate-600 mb-1">평생 용량 (MNh)</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-xl md:text-2xl font-bold text-slate-900">{(result.lifeDose / 1000000).toFixed(2)}</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className={`px-1.5 py-0.5 rounded ${
                  result.lifeDose > LIMITS.life.male ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  남 {result.lifeDose > LIMITS.life.male ? '초과' : '적합'}
                </span>
                <span className={`px-1.5 py-0.5 rounded ${
                  result.lifeDose > LIMITS.life.female ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  여 {result.lifeDose > LIMITS.life.female ? '초과' : '적합'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN EDITOR */}
        <div className={`flex-1 overflow-y-auto bg-slate-50 ${
          mobileTab === 'list' ? 'hidden md:block' : 'block'
        }`}>
          {activeTask ? (
            <div className="p-3 md:p-6">
              {/* Editor Header */}
              <div className="bg-white rounded-lg border border-slate-200 mb-3 md:mb-4 p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white px-2 py-1 rounded font-bold text-sm">
                    {activeTask.activity}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">작업 상세 설정</h2>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  아래 항목을 수정하여 결과가 자동 계산됩니다.
                </p>
                {/* 모바일 뒤로가기 버튼 */}
                <div className="md:hidden mt-2">
                  <button
                    onClick={() => setMobileTab('list')}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    ← 작업 목록으로 돌아가기
                  </button>
                </div>
              </div>

              {/* Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                {/* 중량물 무게 */}
                <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                    <span className="text-slate-500">⚖️</span>
                    중량물 무게 (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={activeTask.weight}
                    onChange={(e) => updateTask(activeTask.id, 'weight', Number(e.target.value))}
                    className="w-full px-2 md:px-3 py-2 border-2 border-slate-300 rounded text-xl md:text-2xl font-bold text-slate-900 bg-white text-center"
                  />
                </div>

                {/* 단위 작업 시간 */}
                <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                    <span className="text-slate-500">⏱️</span>
                    단위 작업 시간
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={activeTask.duration}
                      onChange={(e) => updateTask(activeTask.id, 'duration', Number(e.target.value))}
                      className="flex-1 px-2 md:px-3 py-2 border-2 border-slate-300 rounded text-xl md:text-2xl font-bold text-slate-900 bg-white text-center"
                    />
                    <select
                      value={activeTask.timeUnit}
                      onChange={(e) => updateTask(activeTask.id, 'timeUnit', e.target.value)}
                      className="w-20 px-3 py-2 border-2 border-slate-300 rounded text-sm font-semibold text-slate-900 bg-white"
                    >
                      <option value="sec">초</option>
                      <option value="min">분</option>
                      <option value="hr">시간</option>
                    </select>
                  </div>
                </div>

                {/* 일일 반복 횟수 */}
                <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                    <span className="text-slate-500">🔄</span>
                    일일 반복 (회)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={activeTask.frequency}
                    onChange={(e) => updateTask(activeTask.id, 'frequency', Number(e.target.value))}
                    className="w-full px-2 md:px-3 py-2 border-2 border-slate-300 rounded text-xl md:text-2xl font-bold text-slate-900 bg-white text-center"
                  />
                  <div className="text-xs text-slate-500 mt-2 text-right">
                    = 일 {activeTask.totalHours?.toFixed(2)}시간 수행
                  </div>
                </div>
              </div>

              {/* 작업 자세 선택 */}
              <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4 mb-4 md:mb-6">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                  <span className="text-slate-500">🧍</span>
                  작업 자세 선택
                  <span className="ml-auto text-xs font-normal bg-slate-900 text-white px-2 py-1 rounded">
                    현재: {activeTask.activity} ({activities[activeTask.activity].label})
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {Object.values(activities).map((act) => {
                    const isSelected = activeTask.activity === act.code;
                    const hasTwoImages = act.imageStart && act.imageEnd;
                    const isG10 = act.code === 'G10';

                    return (
                      <button
                        key={act.code}
                        onClick={() => updateTask(activeTask.id, 'activity', act.code)}
                        className={`border-2 rounded-lg p-2 md:p-3 transition-all ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 shadow-lg'
                            : 'bg-white border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <div className={`text-base md:text-lg font-bold mb-2 md:mb-3 text-center ${
                          isSelected ? 'text-white' : 'text-slate-900'
                        }`}>
                          {act.code}
                        </div>

                        {/* Image Display */}
                        <div className="bg-slate-100 rounded p-2 md:p-3 mb-2 md:mb-3 border border-slate-200 min-h-[120px] md:min-h-[180px] flex items-center justify-center">
                          {isG10 ? (
                            <div className="flex gap-2 w-full h-[110px] md:h-[170px]">
                              {act.imageStart && (
                                <div className="flex-1 flex items-center justify-center">
                                  <img src={act.imageStart} alt={`${act.code}-left`} className="w-full h-full object-contain" />
                                </div>
                              )}
                              {act.imageEnd && (
                                <div className="flex-1 flex items-center justify-center">
                                  <img src={act.imageEnd} alt={`${act.code}-right`} className="w-full h-full object-contain" />
                                </div>
                              )}
                            </div>
                          ) : hasTwoImages ? (
                            <div className="flex items-center gap-1 w-full h-[110px] md:h-[170px]">
                              {act.imageStart && (
                                <div className="flex-1 flex items-center justify-center">
                                  <img src={act.imageStart} alt={`${act.code}-start`} className="w-full h-full object-contain" />
                                </div>
                              )}
                              <span className="text-lg text-slate-400 font-bold shrink-0">→</span>
                              {act.imageEnd && (
                                <div className="flex-1 flex items-center justify-center">
                                  <img src={act.imageEnd} alt={`${act.code}-end`} className="w-full h-full object-contain" />
                                </div>
                              )}
                            </div>
                          ) : (
                            act.image && (
                              <img src={act.image} alt={act.code} className="w-full max-h-[110px] md:max-h-[170px] object-contain px-2" />
                            )
                          )}
                        </div>

                        <div className={`text-xs text-center leading-tight ${
                          isSelected ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          {act.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 보정 계수 */}
              <div className={`bg-white rounded-lg border border-slate-200 p-3 md:p-4 ${
                activities[activeTask.activity].type !== 'lift' ? 'opacity-40 pointer-events-none' : ''
              }`}>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                  <span className="text-slate-500">⚠️</span>
                  보정 계수
                  <span className="text-xs font-normal text-slate-500">
                    {activities[activeTask.activity].type === 'lift' ? '최대치 1개 자동적용' : 'G1~G6만 적용'}
                  </span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  {Object.values(correctionFactors).map(f => (
                    <label
                      key={f.code}
                      className={`flex items-center gap-2 p-2 md:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        activeTask.factors.includes(f.code)
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={activeTask.factors.includes(f.code)}
                        onChange={() => toggleFactor(activeTask.id, f.code)}
                        disabled={activities[activeTask.activity].type !== 'lift'}
                        className="w-4 h-4 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-bold">{f.code}</div>
                        <div className="text-xs opacity-80">{f.label}</div>
                        <div className="text-xs font-mono opacity-60">({f.val})</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500">왼쪽에서 작업을 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
