'use client';
import { Search, Filter, Download, MoreHorizontal, User, Mail, ChevronRight, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchApplicants } from '../../store/slices/applicantsSlice';
import { AppDispatch, RootState } from '../../store/store';

import NoData from '@/components/shared/NoData';

export default function ApplicantsPoolPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: applicants, status } = useSelector((state: RootState) => state.applicants);

  useEffect(() => {
    dispatch(fetchApplicants());
  }, [dispatch]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1B42]">Talent Pool</h1>
          <p className="text-gray-500 mt-2">Manage and evaluate all applicants across your active positions.</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/applicants/import" className="flex items-center px-4 py-2.5 bg-[#0B1B42] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors shadow-sm">
            <UserPlus className="w-4 h-4 mr-2" />
            AI Batch Import
          </Link>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input 
              type="text" 
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
              placeholder="Search by name, email or skill..." 
            />
          </div>
          <div className="flex space-x-2">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          {applicants.length === 0 ? (
            <div className="p-8">
              <NoData 
                icon={Users}
                title="No applicants found"
                description="Your talent pool is currently empty. Start by importing candidates or creating a job listing."
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-bold">Candidate Name</th>
                  <th className="p-4 font-bold">Applied Role</th>
                  <th className="p-4 font-bold">Match Score</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applicants.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {app.name.charAt(0)}
                        </div>
                        <div>
                          <Link href={`/applicants/${app.id}`} className="font-bold text-[#0B1B42] hover:text-blue-600 hover:underline">
                            {app.name}
                          </Link>
                          <div className="flex items-center text-xs text-gray-500 mt-0.5">
                            <Mail className="w-3 h-3 mr-1" />
                            {app.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700">{app.jobs?.title || 'Unknown Role'}</td>
                    <td className="p-4">
                      <span className={clsx(
                        "font-bold text-sm",
                        app.match_score && app.match_score >= 90 ? "text-green-600" : app.match_score && app.match_score >= 70 ? "text-blue-600" : "text-gray-500"
                      )}>
                        {app.match_score ? `${app.match_score}%` : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={clsx(
                        "px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider",
                        app.status === 'SHORTLISTED' ? "bg-green-100 text-green-800" :
                        app.status === 'INTERVIEWING' ? "bg-purple-100 text-purple-800" :
                        app.status === 'REJECTED' ? "bg-red-100 text-red-800" :
                        "bg-blue-50 text-blue-700"
                      )}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/applicants/${app.id}`} className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
