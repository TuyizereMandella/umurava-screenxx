'use client';
import NoData from '@/components/shared/NoData';
import { Activity, Search, Filter, Download, ArrowLeft, ShieldCheck, Database, FileText, CheckCircle2, ClipboardList, Sparkles, User, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAuditLogs, AuditLog } from '../../store/slices/auditSlice';
import { AppDispatch, RootState } from '../../store/store';

export default function AuditLogPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: logs, status } = useSelector((state: RootState) => state.audit);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchAuditLogs());
    }
  }, [status, dispatch]);

  const getLogIcon = (actionType: string) => {
    const type = actionType.toLowerCase();
    if (type.includes('screening') || type.includes('analysis')) return { icon: Sparkles, color: 'text-indigo-500', bg: 'bg-indigo-50' };
    if (type.includes('candidate') || type.includes('applicant')) return { icon: Database, color: 'text-blue-500', bg: 'bg-blue-50' };
    if (type.includes('interview') || type.includes('schedule')) return { icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50' };
    if (type.includes('bias') || type.includes('flagged')) return { icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50' };
    return { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100' };
  };

  const filteredLogs = logs.filter(log => 
    log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.users?.full_name || 'System').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-4 text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#0B1B42]">AI Activity Log</h1>
          <p className="text-gray-500 mt-2">Comprehensive trail of AI decisions and automated recruitment events.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {status === 'loading' ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading audit trail...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-bold">Action</th>
                  <th className="p-4 font-bold">Details</th>
                  <th className="p-4 font-bold">User / Actor</th>
                  <th className="p-4 font-bold">Timestamp</th>
                  <th className="p-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <NoData 
                        icon={ClipboardList}
                        title="No logs found"
                        description={searchTerm ? "No activities match your search criteria." : "No platform activities have been recorded yet."}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const { icon: Icon, color, bg } = getLogIcon(log.action_type);
                    const isSystem = !log.user_id;
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg} ${color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-[#0B1B42]">{log.action_type}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-700 max-w-xs truncate" title={log.description}>{log.description}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-700">
                            {isSystem ? (
                              <>
                                <Sparkles className="w-3 h-3 text-indigo-500" />
                                <span className="font-medium">System (AI)</span>
                              </>
                            ) : (
                              <>
                                <User className="w-3 h-3 text-gray-400" />
                                <span>{log.users?.full_name || 'Unknown User'}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            log.action_type.toLowerCase().includes('flagged') || log.action_type.toLowerCase().includes('bias')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {log.action_type.toLowerCase().includes('flagged') || log.action_type.toLowerCase().includes('bias') ? 'Flagged' : 'Success'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
