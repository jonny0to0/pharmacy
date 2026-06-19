import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Settings, 
  Building, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  ChevronDown,
  Mail,
  ShieldCheck,
  PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermission';
import alerts from '../utils/alerts';

export default function UserDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { hasPermission } = usePermission();
  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "AD";

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const menuItems = [
    { label: 'Personal Profile', icon: User, path: '/account/personal-profile' },
    { label: 'Profile Overview', icon: PieChart, path: '/account/overview', permission: 'SETTINGS_OPERATIONAL.READ' },
    { label: 'Account Settings', icon: ShieldCheck, path: '/account/security' },
    { label: 'Business Settings', icon: Building, path: '/account/profile', permission: 'SETTINGS_BUSINESS.READ' },
    { label: 'Subscription / Plan', icon: CreditCard, path: '/account/subscription', permission: 'SETTINGS_BUSINESS.READ' },
    { label: 'Help & Support', icon: HelpCircle, path: '#' },
  ];

  const processedMenuItems = menuItems.map(item => {
    const isAuthorized = !item.permission || hasPermission(item.permission);
    if (!isAuthorized) {
      return null;
    }
    return { ...item, disabled: false };
  }).filter((item): item is typeof menuItems[number] & { disabled: boolean } => item !== null);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:shadow-blue-500/20 group-hover:scale-105 transition-all overflow-hidden">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[120px]">
            {user?.name}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {user?.roles?.[0]?.replace('_', ' ') || 'User'}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-4 duration-200 transform origin-top-right">
          {/* User Info Header */}
          <div className="px-5 py-3 mb-2 border-b border-slate-50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Account Center</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-slate-100 overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-900 truncate">{user?.name}</p>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Mail className="w-3 h-3" />
                  <p className="text-[11px] truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="px-2 space-y-1">
            {processedMenuItems.map((item) => (
              <Link
                key={item.label}
                to={item.disabled ? '#' : item.path}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                    alerts.friendlyError('Permission denied');
                  } else {
                    setIsOpen(false);
                  }
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  item.disabled 
                    ? 'opacity-50 cursor-not-allowed text-slate-400 hover:bg-transparent' 
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <item.icon className={`w-4 h-4 transition-colors ${item.disabled ? 'text-slate-350' : 'text-slate-400 group-hover:text-blue-500'}`} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="mt-3 mx-2 pt-2 border-t border-slate-50">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all group"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
