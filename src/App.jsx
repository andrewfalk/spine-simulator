import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  FileText, 
  BarChart2, 
  User, 
  Briefcase, 
  Activity,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  Clipboard,
  Sparkles,
  Loader2,
  ArrowRight,
  ImageIcon,
  Menu,
  X
} from 'lucide-react';

// --- Gemini API Key Configuration ---
const apiKey = "AIzaSyC352T_AmianH9ygQv0jet0Nzz0PlhRs-0"; // The execution environment provides the key at runtime.

// --- Constants & Data Models ---

const GENDER = {
  MALE: 'male',
  FEMALE: 'female'
};

const POSE_DB = {
  G1: { 
    code: 'G1', 
    name: '똑바로(<20°) → 똑바로(<20°)', 
    category: 'lifting', 
    b: 800, m: 45, 
    applyCorrection: true, 
    desc: '서서 똑바로 들기',
    imgFrom: 'G1_From.png', 
    imgTo: 'G1_To.png' 
  },
  G2: { 
    code: 'G2', 
    name: '약간 굴곡(20-45°) → 똑바로(<20°)', 
    category: 'lifting', 
    b: 1100, m: 80, 
    applyCorrection: true, 
    desc: '약간 숙여 들기',
    imgFrom: 'G2_From.png', 
    imgTo: 'G2_to.png' 
  },
  G3: { 
    code: 'G3', 
    name: '심한 굴곡(>45°) → 똑바로(<20°)', 
    category: 'lifting', 
    b: 1900, m: 70, 
    applyCorrection: true, 
    desc: '깊게 숙여 들기',
    imgFrom: 'G3_from.png', 
    imgTo: 'G3_to.png' 
  },
  G4: { 
    code: 'G4', 
    name: '약간 굴곡(20-45°) → 약간 굴곡(20-45°)', 
    category: 'lifting', 
    b: 1100, m: 75, 
    applyCorrection: true, 
    desc: '숙인 채 유지',
    imgFrom: 'G4_from.png', 
    imgTo: 'G4_to.png' 
  },
  G5: { 
    code: 'G5', 
    name: '심한 굴곡(>45°) → 약간 굴곡(20-45°)', 
    category: 'lifting', 
    b: 1900, m: 65, 
    applyCorrection: true, 
    desc: '깊게 → 약간',
    imgFrom: 'G5_from.png', 
    imgTo: 'G5_to.png' 
  },
  G6: { 
    code: 'G6', 
    name: '심한 굴곡(>45°) → 심한 굴곡(>45°)', 
    category: 'lifting', 
    b: 1900, m: 60, 
    applyCorrection: true, 
    desc: '깊게 숙인 채 유지',
    imgFrom: 'G6_from.png', 
    imgTo: 'G6_to.png' 
  },
  G7: { code: 'G7', name: '몸 앞·양옆 운반', category: 'carrying', b: 800, m: 95, applyCorrection: false, desc: '양손 운반', imgFrom: 'G7.png', imgTo: null },
  G8: { code: 'G8', name: '한쪽·한 손 운반', category: 'carrying', b: 800, m: 180, applyCorrection: false, desc: '한손 운반', imgFrom: 'G8.png', imgTo: null },
  G9: { code: 'G9', name: '어깨·등에 올려 운반', category: 'carrying', b: 1100, m: 60, applyCorrection: false, desc: '어깨/등 운반', imgFrom: 'G9.png', imgTo: null },
  G10: { code: 'G10', name: '들고 있기(양손)', category: 'holding', b: 800, m: 45, applyCorrection: false, desc: '양손 들고 있기', imgFrom: 'G10.png', imgTo: null },
  G11: { code: 'G11', name: '들고 있기(한손)', category: 'holding', b: 800, m: 85, applyCorrection: false, desc: '한손 들고 있기', imgFrom: 'G11.png', imgTo: null },
};

const CORRECTION_FACTORS = [
  { code: 'NONE', name: '보정 없음', value: 1.0 },
  { code: 'F1', name: '한 손 작업(1.9)', value: 1.9 },
  { code: 'F2', name: '비대칭 작업(1.9)', value: 1.9 },
  { code: 'F3', name: '몸에서 멀리-똑바로~약간(1.3)', value: 1.3 },
  { code: 'F4', name: '몸에서 멀리-심한 굴곡(1.1)', value: 1.1 },
];

const THRESHOLDS = {
  singleForce: { male: 2700, female: 2000 }, 
  criticalForce: 6000, 
  dailyDose: { male: 2.0, female: 0.5 }, 
  lifetimeDose: {
    mddm: { male: 25, female: 17 },
    court: { male: 12.5, female: 8.5 },
    dws2: { male: 7.0, female: 3.0 }
  }
};

// --- Helper Functions ---

const calculateBMI = (weight, height) => {
  if (!weight || !height) return '';
  const heightM = height / 100;
  return (weight / (heightM * heightM)).toFixed(1);
};

const calculateForce = (task) => {
  const pose = POSE_DB[task.pose];
  if (!pose) return 0;

  const b = pose.b;
  let m = pose.m;
  
  const cf = parseFloat(task.correctionFactor || 1.0);
  const weight = parseFloat(task.weight || 0);

  if (pose.applyCorrection) {
    m = m * cf;
  }

  return b + (m * weight);
};

// --- Components ---

const InputField = ({ label, value, onChange, type = "text", placeholder, suffix, min, max, readOnly, error }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        readOnly={readOnly}
        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${readOnly ? 'bg-gray-100 text-gray-500' : 'bg-white'} ${error ? 'border-red-500' : 'border-gray-300'} transition-all`}
        placeholder={placeholder}
      />
      {suffix && <span className="absolute right-3 top-2.5 text-gray-500 text-sm">{suffix}</span>}
    </div>
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
);

const SelectField = ({ label, value, onChange, options, disabled = false }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-base bg-white"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const PoseImage = ({ src, alt, label, large = false }) => {
  const [error, setError] = useState(false);
  const placeholderUrl = `https://placehold.co/120x150/e2e8f0/475569?text=${label || alt}`;
  const imgPath = `${import.meta.env.BASE_URL}images/${src}`;

  console.log('PoseImage loading:', { src, imgPath, alt, large, baseUrl: import.meta.env.BASE_URL });

  // G7~G11용 크기: 더 넓고 높게
  const containerClass = large
    ? "w-full max-w-[400px] h-48 sm:h-64"
    : "w-full max-w-[200px] h-32 sm:h-40";

  return (
    <div className="flex flex-col items-center w-full">
      <div className={`${containerClass} bg-gray-200 rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center relative group`}>
        {!error ? (
          <img
            src={imgPath}
            alt={alt}
            className="w-full h-full object-contain p-1"
            onError={(e) => {
              console.error('Image load error:', imgPath, e);
              e.target.onerror = null;
              e.target.src = placeholderUrl;
            }}
          />
        ) : (
          <div className="flex flex-col items-center text-gray-400 p-2 text-center">
            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-1" />
            <span className="text-[10px] leading-tight">{src}</span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-[10px] sm:text-xs font-semibold text-gray-600 mt-1.5 text-center max-w-[200px] leading-tight">{label}</span>
      )}
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState('input'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 1. Personal Info
  const [personalInfo, setPersonalInfo] = useState({
    name: '홍길동',
    age: '45',
    gender: 'male',
    height: '175',
    weight: '75',
    smoking: 'non',
    drinking: 'non'
  });

  // 2. Job Info
  const [jobInfo, setJobInfo] = useState({
    jobName: '물류 센터 작업자',
    workDaysPerYear: 250,
    inputMode: 'ym',
    years: '10',
    months: '0',
    totalMonths: '120',
    totalDays: '2000'
  });

  // 3. Tasks
  const [tasks, setTasks] = useState([
    { id: 1, name: '박스 상하차 (무거움)', pose: 'G3', weight: '25', duration: '5', durationUnit: 'sec', frequency: '300', correctionFactor: 1.0 },
    { id: 2, name: '소형 부품 정리 (가벼움)', pose: 'G1', weight: '5', duration: '3', durationUnit: 'sec', frequency: '100', correctionFactor: 1.0 },
    { id: 3, name: '자재 이동 (중간, 유지)', pose: 'G4', weight: '15', duration: '1', durationUnit: 'min', frequency: '20', correctionFactor: 1.3 } 
  ]);

  // 4. Results & Assessment
  const [results, setResults] = useState(null);
  const [assessmentText, setAssessmentText] = useState('');
  const [assessmentStyle, setAssessmentStyle] = useState('professional');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- Handlers ---
  const handlePersonalChange = (field, value) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };

  const bmi = useMemo(() => calculateBMI(personalInfo.weight, personalInfo.height), [personalInfo.weight, personalInfo.height]);

  const handleDurationChange = (mode, field, value) => {
    const val = value === '' ? 0 : parseFloat(value);
    let newJobInfo = { ...jobInfo, inputMode: mode };

    if (mode === 'ym') {
      if (field === 'years') {
        const currentMonths = parseFloat(jobInfo.months || 0);
        newJobInfo.years = value;
        const totalM = (val * 12) + currentMonths;
        newJobInfo.totalMonths = totalM.toFixed(0);
        newJobInfo.totalDays = (totalM * 16.67).toFixed(0);
      } else {
        const currentYears = parseFloat(jobInfo.years || 0);
        newJobInfo.months = value;
        const totalM = (currentYears * 12) + val;
        newJobInfo.totalMonths = totalM.toFixed(0);
        newJobInfo.totalDays = (totalM * 16.67).toFixed(0);
      }
    } else if (mode === 'm') {
      newJobInfo.totalMonths = value;
      const y = Math.floor(val / 12);
      const m = val % 12;
      newJobInfo.years = y;
      newJobInfo.months = m;
      newJobInfo.totalDays = (val * 16.67).toFixed(0);
    } else if (mode === 'd') {
      newJobInfo.totalDays = value;
      const totalM = val / 16.67;
      newJobInfo.totalMonths = totalM.toFixed(1);
      newJobInfo.years = (val / 200).toFixed(1);
      const mCalc = ((val % 200) / 16.67).toFixed(0);
      newJobInfo.months = mCalc;
    }

    setJobInfo(newJobInfo);
  };

  const addTask = () => {
    const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    setTasks([...tasks, { id: newId, name: `작업 ${newId}`, pose: 'G1', weight: '', duration: '', durationUnit: 'sec', frequency: '', correctionFactor: 1.0 }]);
  };

  const removeTask = (id) => {
    if (tasks.length === 1) return; 
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const copyTask = (task) => {
    const newId = Math.max(...tasks.map(t => t.id)) + 1;
    setTasks([...tasks, { ...task, id: newId, name: `${task.name} (복사)` }]);
  };

  const generateRuleBasedAssessment = (calcResults, gender) => {
    const { dailyDoseKNh, lifetimeDoseMNh, isDailyDoseSignificant, potentialLifetimeDoseMNh } = calcResults;
    const dailyThreshold = THRESHOLDS.dailyDose[gender];
    const courtThreshold = THRESHOLDS.lifetimeDose.court[gender];
    const dws2Threshold = THRESHOLDS.lifetimeDose.dws2[gender];
    
    let text = `[규칙 기반 자동 생성 소견]\n`;
    text += `평가 대상: ${personalInfo.name} (${personalInfo.age}세/${gender === 'male' ? '남' : '여'})\n`;
    text += `직업: ${jobInfo.jobName} (총 직업력: 약 ${(calcResults.yearsDuration).toFixed(1)}년)\n\n`;

    text += `1. 일일 노출량 평가:\n`;
    if (isDailyDoseSignificant) {
        text += `   - 일일 누적 압박력은 ${dailyDoseKNh.toFixed(2)} kNh로 기준치(${dailyThreshold} kNh)를 초과하였습니다.\n`;
        text += `   - 이는 척추에 유의미한 생물학적 부담을 주는 수준으로 판단되어 평생 누적 용량 계산에 포함됩니다.\n\n`;
    } else {
        text += `   - 일일 누적 압박력은 ${dailyDoseKNh.toFixed(2)} kNh로 기준치(${dailyThreshold} kNh) 미만입니다.\n`;
        text += `   - 현재의 작업 강도 및 빈도는 척추 질환을 유발할 만한 유의미한 수준에 도달하지 않은 것으로 판단됩니다.\n`;
        text += `   - (참고: 단순 환산 시 평생 용량은 약 ${potentialLifetimeDoseMNh.toFixed(1)} MNh이나, 공식적으로는 0으로 간주됨)\n\n`;
        text += `종합 의견: 업무관련성 낮음 (Low Probability)\n`;
        return text;
    }

    text += `2. 평생 누적 노출량 평가:\n`;
    text += `   - 산출된 평생 누적 용량: ${lifetimeDoseMNh.toFixed(1)} MNh\n`;
    
    if (lifetimeDoseMNh >= courtThreshold) {
        text += `   - 평가: 독일 법원 기준(${courtThreshold} MNh)을 초과함.\n\n`;
        text += `3. 종합 의견:\n`;
        text += `   - Mainz-Dortmund Dose Model 기준에 의거하여 분석한 결과, 대상자의 작업은 척추 질환 발생과 '상당한 인과관계(Probable)'가 있는 것으로 평가됩니다.\n`;
        text += `   - 특히 ${lifetimeDoseMNh >= THRESHOLDS.lifetimeDose.mddm[gender] ? 'MDDM 제안 기준마저 초과하는 고위험군입니다.' : '법적 인정 기준을 상회하는 노출 수준입니다.'}`;
    } else if (lifetimeDoseMNh >= dws2Threshold) {
        text += `   - 평가: DWS2 보수적 기준(${dws2Threshold} MNh)은 초과하였으나, 법원 기준(${courtThreshold} MNh)에는 미치지 못함.\n\n`;
        text += `3. 종합 의견:\n`;
        text += `   - 대상자의 작업 노출량은 업무관련성 판단의 '회색 지대(Possible)'에 해당합니다.\n`;
        text += `   - 단독적인 직업병 인정 근거로는 부족할 수 있으며, 임상적 소견 및 타 위험 요인(진동, 불량 자세 지속 등)에 대한 종합적인 검토가 필요합니다.`;
    } else {
        text += `   - 평가: DWS2 보수적 기준(${dws2Threshold} MNh) 미만임.\n\n`;
        text += `3. 종합 의견:\n`;
        text += `   - 대상자의 누적 노출량은 관련 기준치에 미달하여 업무관련성이 낮은(Unlikely) 것으로 판단됩니다.`;
    }

    return text;
  };

  const generateGeminiAssessment = async () => {
    if (!results) return;
    setIsAiLoading(true);

    try {
        const genderKor = personalInfo.gender === 'male' ? '남성' : '여성';
        
        // Define style instructions based on selection
        let styleInstruction = "";
        switch (assessmentStyle) {
            case 'summary':
                styleInstruction = `
1. 핵심 결론부터 먼저 제시하는 '두괄식'으로 작성할 것.
2. 불필요한 미사여구를 배제하고 개조식(bullet points) 위주로 간결하게 요약할 것.
3. 전체 길이는 500자 이내로 핵심만 전달할 것.`;
                break;
            case 'easy':
                styleInstruction = `
1. 의학 비전문가인 근로자도 쉽게 이해할 수 있도록 친절하고 풀어서 쓴 어조를 사용할 것.
2. 전문 용어 사용 시 괄호 안에 쉬운 설명을 덧붙일 것.
3. 수치보다는 '위험함', '안전함' 등의 직관적인 표현을 함께 사용할 것.`;
                break;
            case 'legal':
                styleInstruction = `
1. 법원이나 근로복지공단 제출용 서류처럼 매우 격식 있고 건조한 문체를 사용할 것 ('~함', '~임' 등으로 끝맺음 지양, '~하였습니다', '~으로 사료됩니다' 사용).
2. 판단의 근거가 되는 수치와 기준을 명확히 명시하여 객관성을 확보할 것.
3. 감정적인 표현을 배제하고 사실 관계 위주로 기술할 것.`;
                break;
            case 'professional':
            default:
                styleInstruction = `
1. 산업의학 전문의가 작성한 듯한 전문적인 어조를 사용할 것.
2. '1. 작업 분석', '2. 노출량 평가', '3. 의학적/종합적 판단' 섹션으로 나누어 체계적으로 작성할 것.
3. 작업의 강도와 빈도가 척추 생체역학에 미치는 영향을 구체적으로 서술할 것.`;
                break;
        }

        const prompt = `
당신은 산업의학 및 인체공학 전문가입니다. 다음 MDDM(Mainz-Dortmund Dose Model) 평가 결과를 바탕으로 '업무관련성 평가 소견서'를 작성해주세요.

[평가 대상자 정보]
- 이름: ${personalInfo.name}
- 나이: ${personalInfo.age}세
- 성별: ${genderKor}
- 직업: ${jobInfo.jobName}
- 근무 경력: 약 ${(results.yearsDuration).toFixed(1)}년
- 흡연/음주: ${personalInfo.smoking}/${personalInfo.drinking}

[주요 작업 내용]
${results.taskResults.map((t, i) => `- 작업${i+1} (${t.name}): ${POSE_DB[t.pose].name}, 중량 ${t.weight}kg, 1회 ${t.durationInSeconds}초, 하루 ${t.frequency}회`).join('\n')}

[평가 결과]
1. 일일 누적 용량 (Daily Dose): ${results.dailyDoseKNh.toFixed(2)} kNh
   - 기준치 (${THRESHOLDS.dailyDose[personalInfo.gender]} kNh) 초과 여부: ${results.isDailyDoseSignificant ? '초과 (유의미함)' : '미만 (무의미함)'}

2. 평생 누적 용량 (Lifetime Dose): ${results.lifetimeDoseMNh.toFixed(1)} MNh
   - 독일 법원 기준 (${THRESHOLDS.lifetimeDose.court[personalInfo.gender]} MNh): ${results.lifetimeDoseMNh >= THRESHOLDS.lifetimeDose.court[personalInfo.gender] ? '초과' : '미만'}
   - DWS2 보수적 기준 (${THRESHOLDS.lifetimeDose.dws2[personalInfo.gender]} MNh): ${results.lifetimeDoseMNh >= THRESHOLDS.lifetimeDose.dws2[personalInfo.gender] ? '초과' : '미만'}

[작성 스타일 가이드]
${styleInstruction}

[공통 요청 사항]
- 최종적으로 업무관련성이 '높음(상당 인과관계)', '가능성 있음(회색지대)', '낮음' 중 어디에 해당하는지 명확히 결론 내릴 것.
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (aiText) {
            setAssessmentText(aiText);
        } else {
            throw new Error('No response generated');
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        alert("AI 소견 생성 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 기본 소견을 사용해주세요.");
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleCalculate = () => {
    if (!personalInfo.name) return alert('평가 대상자 이름을 입력해주세요.');
    if (!jobInfo.totalDays) return alert('직업력(근무기간)을 입력해주세요.');

    const taskResults = tasks.map(task => {
      const forceN = calculateForce(task);
      const forceKN = forceN / 1000;
      const threshold = THRESHOLDS.singleForce[personalInfo.gender];
      const isIncluded = forceN >= threshold;
      const isCritical = forceN >= THRESHOLDS.criticalForce;
      
      const durationValue = parseFloat(task.duration) || 0;
      const durationInSeconds = task.durationUnit === 'min' ? durationValue * 60 : durationValue;

      const dailyTotalTimeSec = durationInSeconds * (parseFloat(task.frequency) || 0);
      const partialDose = isIncluded ? Math.pow(forceN, 2) * dailyTotalTimeSec : 0;

      return {
        ...task,
        forceN,
        forceKN,
        isIncluded,
        isCritical,
        partialDose,
        dailyTotalTimeSec,
        durationInSeconds
      };
    });

    const sumPartialDose = taskResults.reduce((acc, curr) => acc + curr.partialDose, 0);
    const dailyDoseNs = Math.sqrt(sumPartialDose); 
    const dailyDoseKNh = dailyDoseNs / 60 / 1000; 

    const dailyThreshold = THRESHOLDS.dailyDose[personalInfo.gender];
    const isDailyDoseSignificant = dailyDoseKNh >= dailyThreshold;

    const workDaysPerYear = parseFloat(jobInfo.workDaysPerYear || 250);
    let totalCareerDays = 0;

    if (jobInfo.inputMode === 'd') {
      totalCareerDays = parseFloat(jobInfo.totalDays || 0);
    } else {
      const years = parseFloat(jobInfo.years || 0);
      const months = parseFloat(jobInfo.months || 0);
      const totalYears = years + (months / 12);
      
      const totalM = parseFloat(jobInfo.totalMonths || 0);
      const effectiveYears = jobInfo.inputMode === 'm' ? (totalM / 12) : totalYears;

      totalCareerDays = effectiveYears * workDaysPerYear;
    }

    const lifetimeDoseMNh = isDailyDoseSignificant 
      ? (dailyDoseKNh * totalCareerDays) / 1000 
      : 0;
      
    const potentialLifetimeDoseMNh = (dailyDoseKNh * totalCareerDays) / 1000;
    const yearsDuration = totalCareerDays / 200;

    const finalResults = {
      taskResults,
      dailyDoseKNh,
      isDailyDoseSignificant,
      lifetimeDoseMNh,
      potentialLifetimeDoseMNh,
      totalCareerDays,
      yearsDuration
    };

    setResults(finalResults);
    setAssessmentText(generateRuleBasedAssessment(finalResults, personalInfo.gender));
    setActiveTab('result');
  };

  const getRiskLevel = (val, limit) => {
    const ratio = (val / limit) * 100;
    if (ratio <= 70) return { color: 'text-green-600', bg: 'bg-green-100', bar: 'bg-green-500', label: '안전' };
    if (ratio <= 100) return { color: 'text-yellow-600', bg: 'bg-yellow-100', bar: 'bg-yellow-500', label: '주의' };
    return { color: 'text-red-600', bg: 'bg-red-100', bar: 'bg-red-500', label: '위험' };
  };
  
  const downloadCSV = () => {
    if (!results) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Type,Category,Value\n";
    csvContent += `Info,Name,${personalInfo.name}\n`;
    csvContent += `Info,Gender,${personalInfo.gender}\n`;
    csvContent += `Result,Daily Dose (kNh),${results.dailyDoseKNh.toFixed(4)}\n`;
    csvContent += `Result,Lifetime Dose (MNh),${results.lifetimeDoseMNh.toFixed(2)}\n`;
    csvContent += `Result,Lifetime Dose Ref (MNh),${results.potentialLifetimeDoseMNh.toFixed(2)}\n`;
    csvContent += "\nTask,Pose,Weight,Force(kN),Duration(sec),Included?\n";
    
    results.taskResults.forEach(t => {
      csvContent += `${t.name},${t.pose},${t.weight},${t.forceKN.toFixed(2)},${t.durationInSeconds},${t.isIncluded ? 'Yes' : 'No'}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${personalInfo.name}_assessment.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(assessmentText);
    alert("소견서 내용이 복사되었습니다.");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
            <div className="flex flex-col sm:flex-row sm:items-baseline">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-tight">척추 압박력 평가</h1>
              <span className="text-blue-200 text-xs sm:text-sm font-normal sm:ml-2">MDD Model v1.1</span>
            </div>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden sm:flex space-x-2">
            <button 
              onClick={() => setActiveTab('input')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'input' ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-600'}`}
            >
              입력 및 평가
            </button>
            <button 
              onClick={() => {
                if(!results) { alert('먼저 계산을 실행해주세요.'); return; }
                setActiveTab('result');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'result' ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-600'}`}
            >
              결과 보고서
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-blue-100 hover:bg-blue-600 rounded">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-blue-800 border-t border-blue-600">
            <div className="px-4 py-2 space-y-1">
              <button 
                onClick={() => { setActiveTab('input'); setIsMobileMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${activeTab === 'input' ? 'bg-blue-900 text-white' : 'text-blue-100 hover:bg-blue-700'}`}
              >
                입력 및 평가
              </button>
              <button 
                onClick={() => { 
                  if(!results) { alert('먼저 계산을 실행해주세요.'); return; }
                  setActiveTab('result'); 
                  setIsMobileMenuOpen(false); 
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${activeTab === 'result' ? 'bg-blue-900 text-white' : 'text-blue-100 hover:bg-blue-700'}`}
              >
                결과 보고서
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        
        {/* INPUT TAB */}
        {activeTab === 'input' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 1. Personal Information */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <h2 className="font-bold text-gray-800 text-lg">1. 인적사항</h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <InputField label="성명/ID" placeholder="홍길동" value={personalInfo.name} onChange={(e) => handlePersonalChange('name', e.target.value)} />
                
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">성별</label>
                  <div className="flex space-x-4 mt-1 h-11 items-center">
                    <label className="flex items-center space-x-2 cursor-pointer bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                      <input type="radio" name="gender" checked={personalInfo.gender === GENDER.MALE} onChange={() => handlePersonalChange('gender', GENDER.MALE)} className="form-radio text-blue-600 w-4 h-4" />
                      <span className="text-sm font-medium text-blue-900">남성</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer bg-pink-50 px-3 py-2 rounded-lg border border-pink-100 hover:bg-pink-100 transition-colors">
                      <input type="radio" name="gender" checked={personalInfo.gender === GENDER.FEMALE} onChange={() => handlePersonalChange('gender', GENDER.FEMALE)} className="form-radio text-pink-600 w-4 h-4" />
                      <span className="text-sm font-medium text-pink-900">여성</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField label="연령" suffix="세" type="number" value={personalInfo.age} onChange={(e) => handlePersonalChange('age', e.target.value)} />
                  <InputField label="신장" suffix="cm" type="number" value={personalInfo.height} onChange={(e) => handlePersonalChange('height', e.target.value)} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="체중" suffix="kg" type="number" value={personalInfo.weight} onChange={(e) => handlePersonalChange('weight', e.target.value)} />
                  <InputField label="BMI" readOnly value={bmi} />
                </div>

                <SelectField 
                  label="흡연 여부" 
                  value={personalInfo.smoking} 
                  onChange={(e) => handlePersonalChange('smoking', e.target.value)}
                  options={[
                    {value: 'non', label: '비흡연'},
                    {value: 'current', label: '현재 흡연'},
                    {value: 'past', label: '과거 흡연'}
                  ]}
                />
              </div>
            </section>

            {/* 2. Job Information */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-gray-500" />
                <h2 className="font-bold text-gray-800 text-lg">2. 직업 정보</h2>
              </div>
              <div className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="직업명" placeholder="예: 물류 센터 작업자" value={jobInfo.jobName} onChange={(e) => setJobInfo({...jobInfo, jobName: e.target.value})} />
                  <InputField label="연간 평균 근무일수" suffix="일" type="number" value={jobInfo.workDaysPerYear} onChange={(e) => setJobInfo({...jobInfo, workDaysPerYear: e.target.value})} />
                </div>

                <div className="bg-blue-50 p-4 sm:p-5 rounded-lg border border-blue-100">
                  <label className="block text-sm font-bold text-gray-800 mb-3">직업력 (근무 기간 환산기)</label>
                  
                  {/* Input Mode Tabs */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      {id: 'ym', label: '년/개월 입력'},
                      {id: 'm', label: '개월만 입력'},
                      {id: 'd', label: '일수만 입력'}
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setJobInfo({...jobInfo, inputMode: mode.id})}
                        className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all ${jobInfo.inputMode === mode.id ? 'bg-blue-600 text-white shadow-md transform scale-105' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                    
                    {jobInfo.inputMode === 'ym' && (
                      <>
                         <InputField label="년" suffix="년" type="number" value={jobInfo.years} onChange={(e) => handleDurationChange('ym', 'years', e.target.value)} />
                         <InputField label="개월" suffix="개월" type="number" min="0" max="11" value={jobInfo.months} onChange={(e) => handleDurationChange('ym', 'months', e.target.value)} />
                      </>
                    )}

                    {jobInfo.inputMode === 'm' && (
                       <InputField label="총 개월수" suffix="개월" type="number" value={jobInfo.totalMonths} onChange={(e) => handleDurationChange('m', 'totalMonths', e.target.value)} />
                    )}

                    {jobInfo.inputMode === 'd' && (
                       <InputField label="총 근무일수" suffix="일" type="number" value={jobInfo.totalDays} onChange={(e) => handleDurationChange('d', 'totalDays', e.target.value)} />
                    )}

                    {/* Readonly Conversions */}
                    <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 pt-4 border-t border-blue-200">
                      <div className="text-center bg-white py-2 px-3 rounded border border-blue-100 shadow-sm">
                        <span className="block text-xs text-gray-500 mb-1">환산: 년/개월</span>
                        <div className="font-mono font-medium text-blue-800">
                          {jobInfo.years || 0}년 {jobInfo.months || 0}개월
                        </div>
                      </div>
                      <div className="text-center bg-white py-2 px-3 rounded border border-blue-100 shadow-sm">
                        <span className="block text-xs text-gray-500 mb-1">환산: 총 개월</span>
                        <div className="font-mono font-medium text-blue-800">
                          {jobInfo.totalMonths || 0}개월
                        </div>
                      </div>
                      <div className="text-center bg-white py-2 px-3 rounded border border-blue-100 shadow-sm">
                        <span className="block text-xs text-gray-500 mb-1">환산: 총 일수</span>
                        <div className="font-mono font-medium text-blue-800">
                          {parseInt(jobInfo.totalDays || 0).toLocaleString()}일
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </section>

            {/* 3. Task Details */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-gray-500" />
                  작업 내용 입력 <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{tasks.length}개</span>
                </h2>
                <button 
                  onClick={addTask}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transform active:scale-95 transition-all text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> 작업 추가
                </button>
              </div>

              {tasks.map((task, index) => (
                <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded">#{index + 1}</span>
                      <input 
                        type="text" 
                        value={task.name} 
                        onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                        className="bg-transparent border-none focus:ring-0 font-medium text-gray-700 p-0 hover:bg-gray-100 rounded px-2 w-full max-w-[200px] sm:max-w-xs transition-colors"
                        placeholder="작업명 입력"
                      />
                    </div>
                    <div className="flex space-x-1">
                      <div className="relative group">
                        <button onClick={() => copyTask(task)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          작업 복사
                        </span>
                      </div>
                      <div className="relative group">
                        <button onClick={() => removeTask(task.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          작업 삭제
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Visual & Pose Selection */}
                    <div className="lg:col-span-5 space-y-4">
                      <label className="text-sm font-medium text-gray-700 block">작업 자세 선택</label>
                      <div className="relative">
                        <select 
                          value={task.pose}
                          onChange={(e) => updateTask(task.id, 'pose', e.target.value)}
                          className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-base"
                        >
                          {Object.values(POSE_DB).map(p => (
                            <option key={p.code} value={p.code}>[{p.code}] {p.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
                      </div>
                      
                      {/* Visual Feedback for Pose with Arrows */}
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        {POSE_DB[task.pose] ? (
                          <>
                            <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                              {POSE_DB[task.pose].imgTo ? (
                                <>
                                  {/* G1~G6: 두 개의 이미지 (From → To) */}
                                  <PoseImage src={POSE_DB[task.pose].imgFrom} label="시작 (From)" alt={`${task.pose} Start`} />
                                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
                                  <PoseImage src={POSE_DB[task.pose].imgTo} label="종료 (To)" alt={`${task.pose} End`} />
                                </>
                              ) : (
                                /* G7~G11: 하나의 이미지만, label 없음, 더 크게 */
                                <PoseImage src={POSE_DB[task.pose].imgFrom} label="" alt={task.pose} large={true} />
                              )}
                            </div>
                            <div className="text-center mt-3 pt-3 border-t border-gray-200">
                              <p className="font-bold text-gray-700">{POSE_DB[task.pose].code}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{POSE_DB[task.pose].desc}</p>
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-red-600 p-4">
                            <p className="font-bold">오류: 자세 데이터를 찾을 수 없습니다</p>
                            <p className="text-sm">task.pose = {task.pose}</p>
                            <p className="text-xs">POSE_DB에 '{task.pose}'가 존재하지 않습니다</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Numeric Inputs */}
                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InputField 
                        label="취급 중량" suffix="kg" type="number" 
                        value={task.weight} onChange={(e) => updateTask(task.id, 'weight', e.target.value)} 
                        placeholder="0.0"
                      />
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">보정 계수</label>
                        <select
                          value={task.correctionFactor}
                          onChange={(e) => updateTask(task.id, 'correctionFactor', e.target.value)}
                          disabled={!POSE_DB[task.pose].applyCorrection}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 bg-white"
                        >
                          {CORRECTION_FACTORS.map(cf => (
                            <option key={cf.code} value={cf.value}>{cf.name}</option>
                          ))}
                        </select>
                        {!POSE_DB[task.pose].applyCorrection && <span className="text-xs text-gray-400 px-1">*이 자세는 보정계수 미적용</span>}
                      </div>

                      {/* 1회 작업 시간 (Unit Selection Added) */}
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          1회 작업 시간
                        </label>
                        <div className="flex space-x-2">
                           <div className="relative flex-grow">
                            <input
                              type="number"
                              value={task.duration}
                              onChange={(e) => updateTask(task.id, 'duration', e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                           </div>
                           <select
                              value={task.durationUnit || 'sec'}
                              onChange={(e) => updateTask(task.id, 'durationUnit', e.target.value)}
                              className="w-20 px-2 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-medium"
                            >
                              <option value="sec">초</option>
                              <option value="min">분</option>
                            </select>
                        </div>
                      </div>

                      <InputField 
                        label="일일 취급 횟수" suffix="회" type="number" 
                        value={task.frequency} onChange={(e) => updateTask(task.id, 'frequency', e.target.value)} 
                        placeholder="하루 총 횟수"
                      />
                      
                      <div className="sm:col-span-2 bg-indigo-50 rounded-lg p-4 text-indigo-900 border border-indigo-100 flex justify-between items-center shadow-sm">
                         <span className="text-sm font-medium">예상 피크 압박력(실시간):</span>
                         <span className="font-bold text-lg text-indigo-700">
                           {(calculateForce(task) / 1000).toFixed(2)} kN
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* Action Bar (Fixed Bottom) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 safe-area-pb">
              <div className="max-w-5xl mx-auto flex justify-end">
                <button 
                  onClick={handleCalculate}
                  className="flex items-center justify-center w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg transform active:scale-95 transition-all"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  평가 실행
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS TAB */}
        {activeTab === 'result' && results && (
          <div className="space-y-8 animate-fade-in pb-20">
            
            {/* 1. Dashboard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Daily Dose Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">일일 누적 용량</h3>
                <div className="flex items-end space-x-2">
                  <span className="text-4xl font-extrabold text-gray-900">{results.dailyDoseKNh.toFixed(2)}</span>
                  <span className="text-lg text-gray-500 mb-1">kN·h</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
                  {results.isDailyDoseSignificant ? (
                    <span className="text-green-600 flex items-center font-medium"><CheckCircle className="w-4 h-4 mr-1" /> 평생 누적 계산에 포함됨</span>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-red-500 flex items-center font-semibold"><AlertTriangle className="w-4 h-4 mr-1" /> 기준치 미만 (0 처리)</span>
                      <p className="text-xs text-gray-400">일일 2.0kNh 미만은 인체 부담이 경미하여 평생 용량에 누적하지 않습니다.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lifetime Dose Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 md:col-span-2">
                <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">평생 누적 용량 (총 직업력: {results.yearsDuration.toFixed(1)}년 환산)</h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-0">
                   <div className="flex flex-col mb-4 sm:mb-0">
                    <div className="flex items-end space-x-2">
                      <span className="text-4xl font-extrabold text-blue-900">{results.lifetimeDoseMNh.toFixed(1)}</span>
                      <span className="text-lg text-gray-500 mb-1">MN·h</span>
                    </div>
                    {!results.isDailyDoseSignificant && results.potentialLifetimeDoseMNh > 0 && (
                      <span className="text-xs text-gray-400 mt-1">
                        (단순 환산 시 약 {results.potentialLifetimeDoseMNh.toFixed(1)} MN·h)
                      </span>
                    )}
                  </div>
                  <div className="text-left sm:text-right bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                    <p className="text-sm text-gray-500">독일 법원 기준 대비</p>
                    <p className={`text-xl font-bold ${getRiskLevel(results.lifetimeDoseMNh, THRESHOLDS.lifetimeDose.court[personalInfo.gender]).color}`}>
                      {(results.lifetimeDoseMNh / THRESHOLDS.lifetimeDose.court[personalInfo.gender] * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                
                {/* Comparison Bars */}
                <div className="mt-6 space-y-4">
                  {[
                    { label: 'DWS2 (보수적)', key: 'dws2' },
                    { label: '독일 법원 (표준)', key: 'court' },
                    { label: 'MDDM (기존)', key: 'mddm' },
                  ].map(std => {
                    const threshold = THRESHOLDS.lifetimeDose[std.key][personalInfo.gender];
                    const rawRatio = (results.lifetimeDoseMNh / threshold) * 100;
                    const widthPercent = Math.min(rawRatio, 100);
                    const risk = getRiskLevel(results.lifetimeDoseMNh, threshold);
                    
                    return (
                      <div key={std.key} className="relative">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-gray-600">{std.label} 기준 ({threshold} MN·h)</span>
                          <span className={`font-bold ${risk.color}`}>{risk.label}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                          <div 
                            className={`h-3 rounded-full ${risk.bar}`} 
                            style={{ width: `${widthPercent}%` }}
                          ></div>
                        </div>
                        {/* Current Value Marker if in range */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-black h-5 mt-4 opacity-30 z-10" 
                          style={{ left: `${widthPercent}%`, display: rawRatio > 100 ? 'none' : 'block' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Detailed Task Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-800">작업별 상세 분석</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3">작업명</th>
                      <th className="px-6 py-3">자세</th>
                      <th className="px-6 py-3">중량/보정</th>
                      <th className="px-6 py-3">압박력 (Peak)</th>
                      <th className="px-6 py-3">평가</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.taskResults.map((t) => (
                      <tr key={t.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{t.name}</td>
                        <td className="px-6 py-4">
                          <span className="block">{t.pose}</span>
                          <span className="text-xs text-gray-500">{POSE_DB[t.pose].name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span>{t.weight} kg</span>
                            <span className="text-xs text-gray-500">x{t.correctionFactor}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold ${t.isCritical ? 'text-red-600' : 'text-gray-900'}`}>
                              {t.forceKN.toFixed(2)} kN
                            </span>
                            {t.isCritical && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {t.isIncluded ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              포함됨
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              제외 (임계치 미만)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

             {/* 3. Bar Chart (Peak Force) - Scrollable on Mobile */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center">
                  <BarChart2 className="w-5 h-5 mr-2 text-gray-500" />
                  작업별 피크 압박력 비교
                </h3>
                
                {/* Scroll Wrapper */}
                <div className="overflow-x-auto pb-4">
                  <div className="relative h-64 flex items-end space-x-8 px-4 border-b border-gray-200 min-w-[600px]">
                    {/* Y-Axis Grid Lines */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between text-xs text-gray-400 pb-8 pl-8">
                      <div className="border-b border-gray-100 w-full h-0 flex items-center"><span>6kN (위험)</span></div>
                      <div className="border-b border-gray-100 w-full h-0 flex items-center"><span>3.2kN (임계)</span></div>
                      <div className="border-b border-gray-100 w-full h-0 flex items-center"><span>0</span></div>
                    </div>
                    
                    {/* Bars */}
                    {results.taskResults.map((t) => {
                      const heightPct = Math.min((t.forceKN / 7) * 100, 100); 
                      let barColor = 'bg-gray-400';
                      if (t.isCritical) barColor = 'bg-red-500';
                      else if (t.isIncluded) barColor = 'bg-blue-500';
                      else barColor = 'bg-green-400 opacity-50';

                      return (
                        <div key={t.id} className="flex-1 flex flex-col items-center justify-end h-full z-10 group relative min-w-[60px]">
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap z-20">
                            {t.name}: {t.forceKN.toFixed(2)} kN
                          </div>
                          <div 
                            className={`w-full max-w-[60px] rounded-t-lg transition-all duration-500 ${barColor}`} 
                            style={{ height: `${heightPct}%` }}
                          ></div>
                          <span className="text-xs text-gray-600 mt-2 truncate w-full text-center px-1">{t.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
                  <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded mr-2"></div> 위험 (≥6.0kN)</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded mr-2"></div> 포함 (≥임계치)</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-green-400 opacity-50 rounded mr-2"></div> 제외 (&lt;임계치)</div>
                </div>
             </div>

            {/* 4. Automated Assessment Text Area (Moved to Bottom) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-blue-700" />
                        <h3 className="font-bold text-blue-900">종합 평가 소견</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-2">
                        {/* Style Selector */}
                        <select
                            value={assessmentStyle}
                            onChange={(e) => setAssessmentStyle(e.target.value)}
                            className="text-xs font-medium text-gray-700 border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="professional">전문가용 (상세)</option>
                            <option value="summary">핵심 요약 (간결)</option>
                            <option value="easy">일반인용 (친절)</option>
                            <option value="legal">행정/법원 제출용 (격식)</option>
                        </select>

                        <button 
                            onClick={generateGeminiAssessment}
                            disabled={isAiLoading}
                            className="flex-1 sm:flex-none justify-center flex items-center text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 px-4 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50 whitespace-nowrap"
                        >
                            {isAiLoading ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            ) : (
                                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            {isAiLoading ? "작성 중..." : "AI 소견 생성"}
                        </button>
                        <button 
                            onClick={copyToClipboard}
                            className="flex-none flex items-center justify-center text-xs font-medium text-blue-700 hover:text-blue-900 bg-white px-3 py-2 rounded-lg border border-blue-200 shadow-sm whitespace-nowrap"
                        >
                            <Clipboard className="w-3.5 h-3.5 mr-1.5" />
                            복사
                        </button>
                    </div>
                </div>
                <div className="p-0 relative">
                    {isAiLoading && (
                        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                            <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3 border border-purple-100">
                                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                                <span className="text-sm font-medium text-purple-800">Gemini가 소견서를 작성하고 있습니다...</span>
                            </div>
                        </div>
                    )}
                    <textarea 
                        className="w-full h-96 p-6 bg-white text-gray-800 text-sm leading-relaxed focus:outline-none resize-none"
                        value={assessmentText}
                        onChange={(e) => setAssessmentText(e.target.value)}
                        spellCheck="false"
                        placeholder="평가 실행 후 소견이 자동으로 생성됩니다. 'AI 소견 생성' 버튼을 눌러 더 전문적인 소견을 받아보세요."
                    />
                </div>
            </div>

             <div className="flex justify-center space-x-4 pt-8 pb-10">
                <button 
                  onClick={() => setActiveTab('input')}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  수정하기
                </button>
                <button 
                  onClick={downloadCSV}
                  className="flex items-center px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  결과 저장 (CSV)
                </button>
             </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 text-xs py-8 text-center safe-area-pb">
        <p>© 2024 Spinal Compression Force Evaluation System. Prototype v1.0</p>
        <p className="mt-1">Based on Mainz-Dortmund Dose Model (MDDM)</p>
      </footer>
    </div>
  );
}