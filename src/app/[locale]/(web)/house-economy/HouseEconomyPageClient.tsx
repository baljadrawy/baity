'use client';

/**
 * HouseEconomyPageClient — صفحة اقتصاد البيت
 *
 * تبويبات: منيو الأعمال | طلبات الموافقة | المحافظ
 * Mobile-first — تبويبات أسفل على الجوال
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Briefcase, Clock, Wallet, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { JobMenuGrid } from '@/features/house-economy/components/JobMenuGrid';
import { PendingApprovalCard } from '@/features/house-economy/components/PendingApprovalCard';
import { WalletCard } from '@/features/house-economy/components/WalletCard';
import { JobForm } from '@/features/house-economy/components/JobForm';
import {
  usePendingApprovals,
  useWalletSummary,
  useChildWallet,
  useCreateJobMenuItem,
} from '@/features/house-economy/hooks/useHouseEconomy';
import { PageLoader } from '@/shared/components/PageLoader';
import { useFormat } from '@/shared/hooks/useFormat';

type Tab = 'jobs' | 'pending' | 'wallets';

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-medium transition-colors min-h-[56px] relative',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      <Icon className="w-5 h-5" aria-hidden />
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 end-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

export function HouseEconomyPageClient() {
  const t = useTranslations('houseEconomy');
  const tc = useTranslations('common');
  const f = useFormat();
  const [activeTab, setActiveTab] = useState<Tab>('jobs');
  const [showJobForm, setShowJobForm] = useState(false);

  const { data: pendingData, isLoading: pendingLoading } = usePendingApprovals();
  const { data: walletData, isLoading: walletLoading } = useWalletSummary();
  const createJob = useCreateJobMenuItem();

  const pendingItems = (pendingData?.data ?? []) as any[];
  const walletSummary = walletData as any;

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType; badge?: number }> = [
    { id: 'jobs',    label: t('jobMenu'),  icon: Briefcase },
    { id: 'pending', label: t('parentView.pendingApprovals', { count: '' }).replace(' ()', ''), icon: Clock, badge: pendingItems.length },
    { id: 'wallets', label: t('title'),    icon: Wallet },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-6 space-y-6">
      {/* العنوان + زر الإضافة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('title')}</h1>
          {walletSummary?.totalBalance !== undefined && (
            <p className="text-muted-foreground text-sm mt-0.5">
              {t('totalBalance')}{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400" dir="ltr">
                {f.currency(walletSummary.totalBalance)}
              </span>
            </p>
          )}
        </div>
        {activeTab === 'jobs' && (
          <button
            type="button"
            onClick={() => setShowJobForm(true)}
            className="flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">{t('parentView.addJob')}</span>
          </button>
        )}
      </div>

      {/* التبويبات */}
      <div className="flex gap-2 bg-muted/50 p-1.5 rounded-2xl">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            icon={tab.icon}
            label={tab.label}
            badge={tab.badge}
          />
        ))}
      </div>

      {/* المحتوى */}
      {activeTab === 'jobs' && (
        <>
          {showJobForm && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="text-base font-semibold mb-4">{t('parentView.addJob')}</h2>
              <JobForm
                onSubmit={(data) => {
                  createJob.mutate(data, { onSuccess: () => setShowJobForm(false) });
                }}
                onCancel={() => setShowJobForm(false)}
                isLoading={createJob.isPending}
              />
            </div>
          )}
          <JobMenuGrid />
        </>
      )}

      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingLoading ? (
            <PageLoader />
          ) : pendingItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <span className="text-4xl" aria-hidden>✅</span>
              <p className="mt-3 text-sm">{t('noPending')}</p>
            </div>
          ) : (
            pendingItems.map((instance: any) => (
              <PendingApprovalCard key={instance.id} instance={instance} />
            ))
          )}
        </div>
      )}

      {activeTab === 'wallets' && (
        <div className="space-y-4">
          {walletLoading ? (
            <PageLoader />
          ) : !walletSummary?.children?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <span className="text-4xl" aria-hidden>👶</span>
              <p className="mt-3 text-sm">{tc('noData')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {walletSummary.children.map((child: any) => (
                <ChildWalletWrapper key={child.memberId} memberId={child.memberId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Wrapper لجلب تفاصيل كل محفظة طفل */
function ChildWalletWrapper({ memberId }: { memberId: string }) {
  const { data, isLoading } = useChildWallet(memberId);
  if (isLoading) return <div className="h-52 rounded-3xl bg-muted animate-pulse" />;
  if (!data?.data) return null;
  return <WalletCard wallet={data.data as any} />;
}
