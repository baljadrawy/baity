'use client';

/**
 * MembersPageClient — الجزء التفاعلي لصفحة الأعضاء
 *
 * يدير:
 * - عرض القائمة (useMembers)
 * - فتح dialog إضافة عضو
 * - فتح dialog تعيين/تغيير PIN
 * - عرض empty state و loading skeleton
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { UserPlus } from 'lucide-react';
import { ResponsiveDialog } from '@/shared/components/ResponsiveDialog';
import { EmptyState } from '@/shared/ui/EmptyState';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { useMembers, useCreateMember } from '@/features/members/hooks/useMembers';
import { MembersList } from '@/features/members/components/MembersList';
import { MemberForm } from '@/features/members/components/MemberForm';
import { SetPinDialog } from '@/features/members/components/SetPinDialog';
import type { MemberView } from '@/features/members/api/repository';
import type { CreateMemberInput } from '@/features/members/schemas';
import { ApiError } from '@/shared/lib/api-client';

interface MembersPageClientProps {
  currentMemberId: string;
  canManage: boolean;
}

export function MembersPageClient({ currentMemberId, canManage }: MembersPageClientProps) {
  const t = useTranslations('members');

  const [showAdd, setShowAdd] = useState(false);
  const [pinTarget, setPinTarget] = useState<MemberView | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data, isLoading, isError } = useMembers();
  const createMember = useCreateMember();

  const handleCreate = async (input: CreateMemberInput) => {
    setServerError(null);
    try {
      await createMember.mutateAsync(input);
      setShowAdd(false);
    } catch (err) {
      if (err instanceof ApiError) {
        const code = (err.data as { error?: string } | undefined)?.error;
        if (code === 'member_already_exists') {
          setServerError(t('errors.alreadyExists'));
          return;
        }
        if (code === 'validation_error') {
          setServerError(t('errors.validation'));
          return;
        }
      }
      setServerError(t('errors.createFailed'));
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto pb-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth min-h-[44px] flex-shrink-0"
          >
            <UserPlus size={16} aria-hidden="true" />
            <span className="hidden sm:inline">{t('add')}</span>
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <EmptyState icon="⚠️" title={t('loadError')} />
      ) : !data?.data || data.data.length === 0 ? (
        <EmptyState
          icon="👥"
          title={t('empty')}
          description={canManage ? t('emptyHint') : undefined}
        />
      ) : (
        <MembersList
          members={data.data}
          currentMemberId={currentMemberId}
          canManage={canManage}
          onSetPin={setPinTarget}
        />
      )}

      {/* dialog إضافة عضو */}
      {canManage && (
        <ResponsiveDialog
          open={showAdd}
          onOpenChange={(o) => {
            if (!o) {
              setShowAdd(false);
              setServerError(null);
            }
          }}
          title={t('addTitle')}
          description={t('addDesc')}
        >
          <MemberForm
            onSubmit={handleCreate}
            isLoading={createMember.isPending}
            serverError={serverError}
          />
        </ResponsiveDialog>
      )}

      {/* dialog تعيين PIN */}
      <SetPinDialog
        open={!!pinTarget}
        member={pinTarget}
        onClose={() => setPinTarget(null)}
      />
    </div>
  );
}
