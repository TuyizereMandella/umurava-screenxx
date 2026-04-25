'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Users, ClipboardCheck, Plus, HelpCircle, LogOut, Calendar as CalendarIcon, Zap, Mail, Shield } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Applicants', href: '/applicants', icon: Users },
  { name: 'Shortlist', href: '/shortlist', icon: ClipboardCheck },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Communications', href: '/emails', icon: Mail },
  { name: 'AI Activity', href: '/audit', icon: Shield },
];

import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { logout } from '@/store/slices/authSlice';

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/auth/signin');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Brand Section */}
      <div className="p-6 border-b border-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 shrink-0">
            <img src="/screenerx-logo.png" alt="ScreenerX Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-[#0B1B42] font-bold text-lg tracking-tight leading-none">
              ScreenerX
            </h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation - Balanced Space */}
      <nav className="flex-1 p-4 space-y-0.5 mt-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 group',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-[#0B1B42]'
              )}
            >
              <item.icon
                className={clsx('w-5 h-5 transition-colors', isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600')}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions - Pinned to absolute bottom */}
      <div className="p-4 border-t border-gray-50 bg-white mt-auto pb-10">
        <div className="space-y-1">
          <Link
            href="/jobs/create"
            className="flex items-center justify-center w-full bg-[#0B1B42] text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-blue-900 transition-all shadow-md shadow-blue-900/10 hover:shadow-lg hover:-translate-y-0.5 mb-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Job
          </Link>
          
          <button className="flex items-center w-full px-4 py-3 text-sm text-gray-400 hover:text-[#0B1B42] hover:bg-gray-50 rounded-2xl transition-all font-medium group">
            <HelpCircle className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-600 transition-colors" />
            Help Center
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all font-medium group"
          >
            <LogOut className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-500 transition-colors" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
