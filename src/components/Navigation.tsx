import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  ServerStackIcon,
  Bars3Icon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Expenses', href: '/expenses', icon: CurrencyDollarIcon },
  { name: 'Income', href: '/income', icon: ArrowTrendingUpIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Document Intelligence', href: '/document-intelligence', icon: DocumentTextIcon },
  { name: 'Data Management', href: '/data-management', icon: ServerStackIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  const isActive = (path: string) => {
    return location.pathname === path || (path === '/dashboard' && location.pathname === '/');
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowLeft' && index > 0) {
      const prevLink = document.querySelector(`[data-nav-index="${index - 1}"]`) as HTMLElement;
      prevLink?.focus();
      setActiveIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < navigation.length - 1) {
      const nextLink = document.querySelector(`[data-nav-index="${index + 1}"]`) as HTMLElement;
      nextLink?.focus();
      setActiveIndex(index + 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const link = e.currentTarget as HTMLAnchorElement;
      link.click();
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <Link
                to="/"
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                aria-label="FlowFi - Financial Dashboard"
              >
                FlowFi
              </Link>
            </div>
            
            <div className="hidden md:flex md:items-center md:space-x-1">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200 ease-in-out group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${isActive(item.href)
                        ? 'text-blue-600 bg-blue-50 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    data-nav-index={index}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    tabIndex={0}
                    role="menuitem"
                  >
                    <Icon className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
                    {item.name}
                    {isActive(item.href) && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-100">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center px-4 py-3 rounded-lg text-base font-medium
                      transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${isActive(item.href)
                        ? 'text-blue-600 bg-blue-50 shadow-sm'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    role="menuitem"
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}