import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  Calendar, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  X,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../App';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export default function History() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDecision, setFilterDecision] = useState('ALL');
  const [filterDate, setFilterDate] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteModalRecord, setDeleteModalRecord] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    setFeedbackMessage(null);
    try {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (user?.id) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Error fetching history:', error.message);
      }
      setRecords(data || []);
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete an individual record
  const handleDeleteRecord = async () => {
    if (!deleteModalRecord || !supabase) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', deleteModalRecord.id);

      if (error) throw error;

      setRecords(prev => prev.filter(r => r.id !== deleteModalRecord.id));
      setFeedbackMessage({ type: 'success', text: 'Scan record deleted successfully from database.' });
      setDeleteModalRecord(null);
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: `Failed to delete record: ${err.message}` });
    } finally {
      setDeleting(false);
    }
  };

  // Filter records
  const filteredRecords = records.filter(item => {
    // Search
    const searchMatch = !searchTerm.trim() || 
      (item.sender && item.sender.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.message_text && item.message_text.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.detected_url && item.detected_url.toLowerCase().includes(searchTerm.toLowerCase()));

    // Decision
    const decisionMatch = filterDecision === 'ALL' || item.decision === filterDecision;

    // Date
    let dateMatch = true;
    if (filterDate !== 'ALL') {
      const recordDate = new Date(item.created_at);
      const now = new Date();
      const diffHours = (now - recordDate) / (1000 * 60 * 60);

      if (filterDate === '24H') dateMatch = diffHours <= 24;
      else if (filterDate === '7D') dateMatch = diffHours <= 24 * 7;
      else if (filterDate === '30D') dateMatch = diffHours <= 24 * 30;
    }

    return searchMatch && decisionMatch && dateMatch;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = ['ID', 'Date', 'Sender', 'Message Text', 'Detected URL', 'Risk Score', 'Decision'];
    const rows = filteredRecords.map(r => [
      `"${r.id}"`,
      `"${new Date(r.created_at).toISOString()}"`,
      `"${(r.sender || '').replace(/"/g, '""')}"`,
      `"${(r.message_text || '').replace(/"/g, '""')}"`,
      `"${(r.detected_url || '').replace(/"/g, '""')}"`,
      `${r.risk_score || 0}`,
      `"${r.decision || 'HAM'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sentinelai_threat_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0d1527] border border-slate-800">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-cyan-400" />
            Detection Logs & Incident Audit
          </h2>
          <p className="text-xs text-slate-400">
            {records.length} historical scans recorded for this account
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-2 disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedbackMessage && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 border ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {feedbackMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="p-4 rounded-2xl bg-[#0d1527] border border-slate-800 flex flex-col md:flex-row items-center gap-4">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by sender (e.g. HDFCBK, SBI), phone, or text content..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        {/* Decision Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Filter className="h-3 w-3" /> Decision:
          </span>
          {['ALL', 'SPAM', 'HAM'].map(dec => (
            <button
              key={dec}
              onClick={() => { setFilterDecision(dec); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterDecision === dec
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {dec === 'ALL' ? 'All' : dec === 'SPAM' ? 'Phishing' : 'Legitimate'}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Time</option>
            <option value="24H">Last 24 Hours</option>
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-3xl bg-[#0d1527] border border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-500 space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin text-cyan-400 mx-auto" />
            <div className="text-xs">Loading detection logs from database...</div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-3">
            <HistoryIcon className="h-10 w-10 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No matching threat records found</div>
            <p className="text-xs max-w-sm mx-auto text-slate-500">
              {searchTerm || filterDecision !== 'ALL' || filterDate !== 'ALL'
                ? 'Try adjusting your search criteria or clearing active filters.'
                : 'Scans you perform will be saved here automatically with deep multi-modal explainability.'}
            </p>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 transition mt-2 shadow-glow"
            >
              Run First Analysis
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Sender ID</th>
                  <th className="py-3.5 px-4">Message Excerpt</th>
                  <th className="py-3.5 px-4 text-center">Threat Risk</th>
                  <th className="py-3.5 px-4 text-center">Decision</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedRecords.map((item) => {
                  const isSpam = item.decision === 'SPAM';
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {item.sender || 'UNKNOWN'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                        {item.message_text || (item.detected_url ? `[URL: ${item.detected_url}]` : '(Screenshot OCR analysis)')}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span className={isSpam ? 'text-red-400' : 'text-emerald-400'}>
                          {Math.round((item.risk_score || 0) * 100)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase ${
                          isSpam
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {item.decision}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedRecord(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                            title="View Full Incident Dossier"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModalRecord(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredRecords.length > pageSize && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length} records
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono px-2 font-bold text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Incident Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0d1527] border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${
                selectedRecord.decision === 'SPAM' 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}>
                {selectedRecord.decision === 'SPAM' ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Incident Dossier Details</h3>
                <span className="text-[11px] font-mono text-slate-400">ID: {selectedRecord.id}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Message Content</span>
                <p className="text-slate-200 leading-relaxed break-words">{selectedRecord.message_text || '(OCR Image Upload)'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Sender Header</span>
                  <div className="font-mono font-bold text-white mt-0.5">{selectedRecord.sender || 'UNKNOWN'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Threat Score</span>
                  <div className={`font-mono font-bold mt-0.5 ${selectedRecord.decision === 'SPAM' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {Math.round((selectedRecord.risk_score || 0) * 100)}% ({selectedRecord.decision})
                  </div>
                </div>
              </div>

              {selectedRecord.detected_url && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Detected URL</span>
                  <div className="font-mono text-cyan-400 break-all mt-0.5">{selectedRecord.detected_url}</div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0d1527] border border-red-500/30 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 w-fit">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Detection Log?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to permanently delete this scan record? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalRecord(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteRecord}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
