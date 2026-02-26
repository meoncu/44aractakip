'use client';

import { useStore } from '@/lib/store';
import { useAuth } from '@/components/providers/AuthProvider';
import LoginPage from '@/components/auth/LoginPage';
import Sidebar, { MobileHeader } from '@/components/layout/Sidebar';
import Dashboard from '@/components/features/Dashboard';
import Vehicles from '@/components/features/Vehicles';
import KmTracking from '@/components/features/KmTracking';
import FuelTracking from '@/components/features/FuelTracking';
import Maintenance from '@/components/features/Maintenance';
import InsuranceTracking from '@/components/features/InsuranceTracking';
import TaxTracking from '@/components/features/TaxTracking';
import InspectionTracking from '@/components/features/InspectionTracking';
import TireTracking from '@/components/features/TireTracking';
import AIRecommendations from '@/components/features/AIRecommendations';
import Notifications from '@/components/features/Notifications';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function MainApp() {
    const { user, loading } = useStore();
    const { activeTab, setSidebarOpen } = useStore();

    useEffect(() => {
        // Handle window resize for sidebar
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setSidebarOpen]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard />;
            case 'vehicles': return <Vehicles />;
            case 'km': return <KmTracking />;
            case 'fuel': return <FuelTracking />;
            case 'maintenance': return <Maintenance />;
            case 'insurance': return <InsuranceTracking />;
            case 'tax': return <TaxTracking />;
            case 'inspection': return <InspectionTracking />;
            case 'tires': return <TireTracking />;
            case 'ai': return <AIRecommendations />;
            case 'notifications': return <Notifications />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            <Sidebar />
            <MobileHeader />

            {/* Main Content Area */}
            <main className="flex-1 lg:pl-64 flex flex-col min-h-screen relative overflow-hidden">
                {/* Background glow effects */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 relative z-10 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
                    <div className="animate-fade-in w-full">
                        {renderContent()}
                    </div>
                </div>
            </main>
        </div>
    );
}
