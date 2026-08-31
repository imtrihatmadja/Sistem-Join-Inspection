import React, { useState } from 'react';
import { AuditLogEntry, FieldChange, InspectionRecord } from '../types';
import { formatFullDateTimeWIB } from '../utils/diffAuditor';
import {
  History,
  Clock,
  User,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers
} from 'lucide-react';

interface AuditLogViewerProps {
  inspection: InspectionRecord;
  className?: string;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  inspection,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  const changeLogs = inspection.changeLogs || [];
  const hasLogs = changeLogs.length > 0;

  // Kumpulkan semua perubahan unik jika ada
  const allChanges = changeLogs.flatMap((log) => log.changes || []);
  const categories = Array.from(new Set(allChanges.map((c) => c.category || 'Lainnya')));

  const filteredChanges = activeCategoryFilter === 'ALL'
    ? allChanges
    : allChanges.filter((c) => (c.category || 'Lainnya') === activeCategoryFilter);

  const lastUpdatedDisplay = formatFullDateTimeWIB(inspection.updatedAt || inspection.createdAt);

  return (
    <div className={`rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs ${className}`}>
      {/* Header Stempel Waktu & Riwayat */}
      <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Update Terakhir: {lastUpdatedDisplay}</span>
            </span>

            {inspection.updatedBy && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                <User className="w-3 h-3 text-slate-500" />
                <span className="truncate max-w-[200px]">{inspection.updatedBy}</span>
              </span>
            )}

            {hasLogs && allChanges.length > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-extrabold border border-teal-200">
                <Sparkles className="w-3 h-3 text-teal-600" />
                <span>{allChanges.length} Bagian Diperbarui</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-slate-500 text-[10px] font-medium bg-slate-100">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Versi Awal Tersimpan</span>
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            Sistem merecord setiap isian yang sebelumnya tersimpan pada database dan mencatat rincian perubahannya.
          </p>
        </div>

        {/* Tombol Toggle Buka Rincian Perubahan */}
        {hasLogs && allChanges.length > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <History className="w-3.5 h-3.5" />
            <span>{isExpanded ? 'Tutup Rincian Perubahan' : 'Lihat Isian Sebelumnya & Perubahan'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Rincian Komparasi Perubahan (Expandable) */}
      {isExpanded && hasLogs && allChanges.length > 0 && (
        <div className="p-3.5 sm:p-4 space-y-3.5 bg-slate-50/40">
          
          {/* Filter Kategori Perubahan */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap pb-1">
              <span className="text-[11px] font-bold text-slate-600">Filter Bagian:</span>
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  activeCategoryFilter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200/70 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Semua ({allChanges.length})
              </button>
              {categories.map((cat) => {
                const count = allChanges.filter((c) => (c.category || 'Lainnya') === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      activeCategoryFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200/70 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Log Timeline Entri */}
          <div className="space-y-3">
            {changeLogs.map((log, lIdx) => (
              <div
                key={log.id || lIdx}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs"
              >
                <div className="p-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <strong className="text-slate-800">{log.title}</strong>
                    <span className="text-slate-500 font-mono text-[11px]">({formatFullDateTimeWIB(log.timestamp)})</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">Diperbarui oleh: <strong>{log.updatedBy}</strong></span>
                </div>

                {log.summary && (
                  <div className="px-3 py-1.5 bg-blue-50/50 text-[11px] text-blue-900 border-b border-slate-100">
                    {log.summary}
                  </div>
                )}

                {/* Tabel Perbandingan Isian Sebelum vs Sesudah */}
                <div className="divide-y divide-slate-100">
                  {log.changes
                    .filter((c) => activeCategoryFilter === 'ALL' || (c.category || 'Lainnya') === activeCategoryFilter)
                    .map((change, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-2.5 sm:p-3 hover:bg-slate-50/80 transition-colors grid grid-cols-1 md:grid-cols-12 gap-2 text-xs items-center"
                      >
                        {/* Nama Indikator / Bagian */}
                        <div className="md:col-span-4 space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1.5 py-0.2 rounded bg-slate-100 inline-block">
                            {change.category || 'Lainnya'}
                          </span>
                          <div className="font-bold text-slate-800">{change.label}</div>
                          <div className="text-[10px] font-mono text-slate-400">Field: {change.field}</div>
                        </div>

                        {/* Nilai Isian Sebelumnya */}
                        <div className="md:col-span-4 bg-rose-50/70 border border-rose-200/80 rounded-md p-2 text-rose-950">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1 mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>Isian Sebelumnya (Sebelum Update):</span>
                          </div>
                          <div className="font-medium text-[11px] break-words line-through decoration-rose-400">
                            {change.oldDisplay}
                          </div>
                        </div>

                        {/* Panah Perubahan */}
                        <div className="hidden md:flex md:col-span-1 justify-center text-slate-400">
                          <ArrowRight className="w-4 h-4 text-blue-600" />
                        </div>

                        {/* Nilai Isian Baru */}
                        <div className="md:col-span-3 bg-emerald-50/80 border border-emerald-200/80 rounded-md p-2 text-emerald-950">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1 mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Isian Baru (Tersimpan):</span>
                          </div>
                          <div className="font-bold text-[11px] break-words text-emerald-900">
                            {change.newDisplay}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
