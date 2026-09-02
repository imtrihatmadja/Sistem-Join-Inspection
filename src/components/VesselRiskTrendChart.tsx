import React, { useMemo, useState } from 'react';
import { Vessel, InspectionRecord } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  MapPin,
  Clock,
  Info,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';

interface VesselRiskTrendChartProps {
  vessel: Vessel;
  inspections: InspectionRecord[];
  onOpenInspectionDetail?: (inspectionId: string) => void;
}

export const VesselRiskTrendChart: React.FC<VesselRiskTrendChartProps> = ({
  vessel,
  inspections,
}) => {
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Filter and sort inspections chronologically (Oldest -> Newest)
  const chartData = useMemo(() => {
    const vesselInspections = inspections.filter((i) => i.vesselId === vessel.id);

    if (vesselInspections.length === 0) {
      // If no recorded inspections, create an initial baseline data point from vessel current state
      return [
        {
          index: 1,
          id: 'initial',
          date: vessel.lastInspectionDate || vessel.createdAt?.split('T')[0] || 'Awal Terdaftar',
          formattedDate: vessel.lastInspectionDate || 'Awal',
          port: vessel.lastInspectionPort || vessel.homePort || 'Pangkalan',
          score: vessel.riskScore || 0,
          riskLevel: vessel.riskLevel || 'LOW',
          recommendation: vessel.lastRecommendation || 'Pendaftaran awal',
          violationsCount: 0,
          inspectors: '-',
          followUpStatus: 'RESOLVED',
          isBaseline: true
        }
      ];
    }

    // Sort ascending by date / timestamp
    const sorted = [...vesselInspections].sort((a, b) => {
      const dateA = new Date(a.inspectionDate || a.createdAt).getTime();
      const dateB = new Date(b.inspectionDate || b.createdAt).getTime();
      return dateA - dateB;
    });

    return sorted.map((insp, idx) => {
      // Standardize score
      const rawScore = insp.riskEvaluation?.score ?? vessel.riskScore ?? 0;
      const score = Math.round(Number(rawScore));
      
      return {
        index: idx + 1,
        id: insp.id,
        date: insp.inspectionDate || insp.createdAt?.split('T')[0] || `Sesi #${idx + 1}`,
        formattedDate: insp.inspectionDate,
        port: insp.inspectionPort || vessel.homePort,
        score: score,
        riskLevel: insp.riskEvaluation?.riskLevel || 'LOW',
        recommendation: insp.riskEvaluation?.recommendation || '-',
        violationsCount: insp.violations?.length || 0,
        inspectors: insp.inspectors || '-',
        followUpStatus: insp.followUpStatus || 'PENDING',
        officialNotes: insp.officialNotes || '',
        isBaseline: false
      };
    });
  }, [vessel, inspections]);

  // Calculations for Summary Cards
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        firstScore: 0,
        latestScore: 0,
        minScore: 0,
        maxScore: 0,
        avgScore: 0,
        diff: 0,
        trend: 'neutral' as 'up' | 'down' | 'neutral',
        totalSessions: 0
      };
    }

    const first = chartData[0].score;
    const latest = chartData[chartData.length - 1].score;
    const scores = chartData.map((d) => d.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = Math.round(scores.reduce((acc, curr) => acc + curr, 0) / scores.length);
    const diff = latest - first;

    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (diff > 0) trend = 'up'; // Risiko naik (memburuk)
    else if (diff < 0) trend = 'down'; // Risiko turun (membaik)

    return {
      firstScore: first,
      latestScore: latest,
      minScore: min,
      maxScore: max,
      avgScore: avg,
      diff: Math.abs(diff),
      trend,
      totalSessions: chartData.length
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      const getBadge = (level: string) => {
        if (level === 'HIGH' || level === 'TINGGI') {
          return { bg: 'bg-rose-500 text-white', label: 'Tinggi (Merah)' };
        }
        if (level === 'MEDIUM' || level === 'SEDANG') {
          return { bg: 'bg-amber-500 text-white', label: 'Sedang (Kuning)' };
        }
        return { bg: 'bg-emerald-500 text-white', label: 'Rendah (Hijau)' };
      };

      const badge = getBadge(data.riskLevel);

      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 max-w-xs backdrop-blur-xs z-50">
          <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2">
            <div className="flex items-center gap-1.5 font-bold">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>{data.date}</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg}`}>
              {badge.label}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-slate-300">
              <span>Skor Risiko:</span>
              <span className="text-base font-extrabold text-white font-mono">{data.score} / 100</span>
            </div>
            <div className="flex justify-between items-center text-slate-300 text-[11px]">
              <span>Pelabuhan Inspeksi:</span>
              <span className="font-semibold text-slate-200">{data.port}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300 text-[11px]">
              <span>Jumlah Temuan:</span>
              <span className={`font-semibold ${data.violationsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {data.violationsCount} Temuan
              </span>
            </div>
            {data.followUpStatus && (
              <div className="flex justify-between items-center text-slate-300 text-[11px]">
                <span>Status Tindak Lanjut:</span>
                <span className="font-medium text-slate-200">{data.followUpStatus}</span>
              </div>
            )}
          </div>

          {data.recommendation && data.recommendation !== '-' && (
            <div className="pt-1.5 border-t border-slate-700/80 text-[11px] text-slate-300">
              <span className="text-teal-400 font-semibold block mb-0.5">Rekomendasi:</span>
              <p className="line-clamp-2 italic text-slate-300">"{data.recommendation}"</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      
      {/* Header Info & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Monitoring Fluktuasi Risiko Kapal</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-mono">
                {chartData.length} Titik Rekaman
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Grafik garis kronologis mencatat riwayat skor risiko (0–100) per tanggal inspeksi di pelabuhan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              chartType === 'area'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Area Gradien
          </button>
          <button
            type="button"
            onClick={() => setChartType('line')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              chartType === 'line'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Garis Bersih
          </button>
        </div>
      </div>

      {/* KPI Cards: Tren & Rangkuman Skor */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Skor Terkini */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">Skor Terkini</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 font-mono">
              {stats.latestScore}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              stats.latestScore >= 65 ? 'bg-rose-100 text-rose-800' :
              stats.latestScore >= 30 ? 'bg-amber-100 text-amber-800' :
              'bg-emerald-100 text-emerald-800'
            }`}>
              {stats.latestScore >= 65 ? 'Tinggi' : stats.latestScore >= 30 ? 'Sedang' : 'Rendah'}
            </span>
          </div>
        </div>

        {/* Tren Perubahan */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">Pergerakan Tren</span>
          <div className="flex items-center gap-1.5">
            {stats.trend === 'down' ? (
              <div className="flex items-center gap-1 text-emerald-700 font-bold text-sm">
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                <span>Membaik (-{stats.diff} poin)</span>
              </div>
            ) : stats.trend === 'up' ? (
              <div className="flex items-center gap-1 text-rose-700 font-bold text-sm">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>Meningkat (+{stats.diff} poin)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-600 font-bold text-sm">
                <Minus className="w-4 h-4 text-slate-400" />
                <span>Stabil / Konsisten</span>
              </div>
            )}
          </div>
        </div>

        {/* Skor Tertinggi & Terendah */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">Rentang Skor (Min - Max)</span>
          <div className="text-sm font-bold text-slate-800 font-mono flex items-center gap-1.5">
            <span className="text-emerald-700">{stats.minScore}</span>
            <span className="text-slate-400">s/d</span>
            <span className="text-rose-700">{stats.maxScore}</span>
            <span className="text-[10px] text-slate-400 font-normal">Poin</span>
          </div>
        </div>

        {/* Rata-rata Skor */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">Rata-rata Skor Historis</span>
          <div className="text-base font-bold text-slate-900 font-mono">
            {stats.avgScore} <span className="text-xs text-slate-400 font-normal">Poin / Inspeksi</span>
          </div>
        </div>

      </div>

      {/* Main Chart Container */}
      <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
        
        {/* Legend & Threshold Guide */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>Grafik Fluktuasi Skor Risiko (Sumbu Y: 0–100)</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Tinggi (65–100)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Sedang (30–64)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Rendah (0–29)</span>
            </div>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-[280px] sm:h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 15, left: -15, bottom: 25 }}
              >
                <defs>
                  <linearGradient id="riskScoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                
                {/* Threshold lines with descriptive labels */}
                <ReferenceLine
                  y={65}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: 'Batas Risiko Tinggi (≥65)', fill: '#e11d48', fontSize: 10, position: 'insideTopRight' }}
                />
                <ReferenceLine
                  y={30}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: 'Batas Risiko Sedang (≥30)', fill: '#d97706', fontSize: 10, position: 'insideTopRight' }}
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  angle={-15}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 30, 50, 65, 75, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#riskScoreGradient)"
                  dot={{ r: 4, fill: '#0f766e', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#0d9488', strokeWidth: 2, stroke: '#ffffff' }}
                />
              </AreaChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 15, left: -15, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                
                <ReferenceLine
                  y={65}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: 'Batas Risiko Tinggi (≥65)', fill: '#e11d48', fontSize: 10, position: 'insideTopRight' }}
                />
                <ReferenceLine
                  y={30}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: 'Batas Risiko Sedang (≥30)', fill: '#d97706', fontSize: 10, position: 'insideTopRight' }}
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  angle={-15}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 30, 50, 65, 75, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0f766e', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#0d9488', strokeWidth: 2, stroke: '#ffffff' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Arahkan kursor / sentuh titik grafik untuk melihat rincian pelabuhan, temuan, dan rekomendasi.</span>
          </span>
          <span className="font-mono text-slate-400">Total: {chartData.length} Inspeksi</span>
        </div>
      </div>

      {/* Timeline List of Historical Points */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Rincian Kronologis Nilai Skor per Tanggal Pelaksanaan</span>
        </h4>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {chartData.map((item, idx) => {
            const isHigh = item.score >= 65;
            const isMedium = item.score >= 30 && item.score < 65;
            
            return (
              <div
                key={item.id || idx}
                className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                    isHigh ? 'bg-rose-100 text-rose-800' :
                    isMedium ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    #{item.index}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.date}</span>
                      <span className="text-slate-500 font-mono text-[11px]">({item.port})</span>
                      {idx === chartData.length - 1 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800">
                          Terkini
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                      <span>Temuan Pelanggaran: <strong>{item.violationsCount}</strong></span>
                      {item.inspectors && item.inspectors !== '-' && (
                        <span className="hidden sm:inline">• Tim: {item.inspectors}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-sm text-slate-900">
                      {item.score} <span className="text-[10px] font-normal text-slate-400">Poin</span>
                    </div>
                    <div className={`text-[10px] font-bold ${
                      isHigh ? 'text-rose-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {isHigh ? 'Risiko Tinggi' : isMedium ? 'Risiko Sedang' : 'Risiko Rendah'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
