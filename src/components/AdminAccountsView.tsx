import React, { useState, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Clock,
  Ban,
  Crown,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Calendar,
  Store,
  Mail,
  Phone,
  Edit3,
  Save,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  db,
  ACCOUNT_CONSTRAINTS,
  OWNER_EMAIL,
  OperationType,
  handleFirestoreError,
  sanitizeString,
} from '../firebase';
import {
  UserAccountProfile,
  UserAccountRole,
  UserAccountStatus,
  SubscriptionPlanTier,
} from '../types';
import { PLAN_TIERS_INFO } from './AuthGateView';

interface AdminAccountsViewProps {
  currentUserProfile: UserAccountProfile;
  accounts: UserAccountProfile[];
  isOwner: boolean;
  onSignOut: () => Promise<void>;
  onNotify: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminAccountsView: React.FC<AdminAccountsViewProps> = ({
  currentUserProfile,
  accounts,
  isOwner,
  onSignOut,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserAccountStatus>('all');
  const [planFilter, setPlanFilter] = useState<'all' | SubscriptionPlanTier>('all');

  // Pre-provision / Create new subscriber modal state (for Owner)
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newContactInfo, setNewContactInfo] = useState('');
  const [newPlanTier, setNewPlanTier] = useState<SubscriptionPlanTier>('pro');
  const [newStatus, setNewStatus] = useState<UserAccountStatus>('active');
  const [newRole, setNewRole] = useState<UserAccountRole>('merchant');
  const [newDurationDays, setNewDurationDays] = useState<number>(30);
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Inline editing state for notes / store info
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editContactInfo, setEditContactInfo] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null);

  // KPI Counts
  const stats = useMemo(() => {
    let active = 0;
    let pending = 0;
    let suspended = 0;
    accounts.forEach((acc) => {
      if (acc.accountStatus === 'active') active++;
      else if (acc.accountStatus === 'pending') pending++;
      else if (acc.accountStatus === 'suspended') suspended++;
    });
    return {
      total: accounts.length,
      active,
      pending,
      suspended,
    };
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (statusFilter !== 'all' && acc.accountStatus !== statusFilter) return false;
      if (planFilter !== 'all' && acc.planTier !== planFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (acc.displayName || '').toLowerCase().includes(q);
        const matchStore = (acc.storeName || '').toLowerCase().includes(q);
        const matchEmail = (acc.email || '').toLowerCase().includes(q);
        const matchContact = (acc.contactInfo || '').toLowerCase().includes(q);
        if (!matchName && !matchStore && !matchEmail && !matchContact) return false;
      }
      return true;
    });
  }, [accounts, statusFilter, planFilter, searchQuery]);

  // Helper to compute expiration ISO date
  const computeSubscriptionEndDate = (days: number): string => {
    if (days >= 9999) return 'اشتراك دائم (مفتوح)';
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Owner Action: Update account status ('active' | 'pending' | 'suspended')
  const handleChangeAccountStatus = async (
    target: UserAccountProfile,
    newAccountStatus: UserAccountStatus
  ) => {
    const path = `users/${target.uid}`;
    try {
      await updateDoc(doc(db, 'users', target.uid), {
        accountStatus: newAccountStatus,
        updatedAt: serverTimestamp(),
      });
      onNotify(
        `تم تحديث حالة حساب (${target.storeName}) إلى: ${
          newAccountStatus === 'active'
            ? 'نشط ومفعل'
            : newAccountStatus === 'pending'
            ? 'بانتظار التفعيل'
            : 'موقوف'
        }`,
        'success'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Owner Action: Update subscription plan tier
  const handleChangePlanTier = async (
    target: UserAccountProfile,
    planTier: SubscriptionPlanTier
  ) => {
    const path = `users/${target.uid}`;
    try {
      await updateDoc(doc(db, 'users', target.uid), {
        planTier,
        updatedAt: serverTimestamp(),
      });
      onNotify(`تم تغيير باقة (${target.storeName}) إلى ${planTier.toUpperCase()}`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Owner Action: Extend / Set subscription duration
  const handleExtendSubscription = async (target: UserAccountProfile, days: number) => {
    const path = `users/${target.uid}`;
    const subscriptionEndsAt = sanitizeString(
      computeSubscriptionEndDate(days),
      ACCOUNT_CONSTRAINTS.SUBSCRIPTION_ENDS_MAX,
      '2027-01-01'
    );
    try {
      await updateDoc(doc(db, 'users', target.uid), {
        subscriptionEndsAt,
        accountStatus: 'active',
        updatedAt: serverTimestamp(),
      });
      onNotify(
        `تم تمديد اشتراك (${target.storeName}) وتفعيله حتى: ${subscriptionEndsAt}`,
        'success'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Owner Action: Update user role ('merchant' | 'admin') and sync /admins/{uid}
  const handleChangeRole = async (target: UserAccountProfile, role: UserAccountRole) => {
    if (target.email === OWNER_EMAIL) return;
    const userPath = `users/${target.uid}`;
    try {
      await updateDoc(doc(db, 'users', target.uid), {
        role,
        updatedAt: serverTimestamp(),
      });

      if (role === 'admin') {
        const adminPath = `admins/${target.uid}`;
        try {
          await setDoc(doc(db, 'admins', target.uid), {
            uid: sanitizeString(target.uid, ACCOUNT_CONSTRAINTS.UID_MAX),
            email: sanitizeString(target.email, ACCOUNT_CONSTRAINTS.EMAIL_MAX),
            grantedBy: sanitizeString(currentUserProfile.uid, ACCOUNT_CONSTRAINTS.UID_MAX),
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, adminPath);
        }
      } else {
        const adminPath = `admins/${target.uid}`;
        try {
          await deleteDoc(doc(db, 'admins', target.uid));
        } catch {
          // Ignore if admin doc did not exist
        }
      }

      onNotify(
        `تم تحديث صلاحية (${target.displayName}) إلى: ${
          role === 'admin' ? 'مدير مساعد (Admin)' : 'تاجر مشترك (Merchant)'
        }`,
        'success'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  };

  // Owner Action: Save inline edits (displayName, storeName, contactInfo, notes)
  const handleSaveInlineEdit = async (target: UserAccountProfile) => {
    const path = `users/${target.uid}`;
    try {
      if (isOwner) {
        await updateDoc(doc(db, 'users', target.uid), {
          displayName: sanitizeString(
            editDisplayName,
            ACCOUNT_CONSTRAINTS.DISPLAY_NAME_MAX,
            target.displayName
          ),
          storeName: sanitizeString(
            editStoreName,
            ACCOUNT_CONSTRAINTS.STORE_NAME_MAX,
            target.storeName
          ),
          contactInfo: sanitizeString(editContactInfo, ACCOUNT_CONSTRAINTS.CONTACT_INFO_MAX, ''),
          notes: sanitizeString(editNotes, ACCOUNT_CONSTRAINTS.NOTES_MAX, ''),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Tier 2 Merchant self-update
        await updateDoc(doc(db, 'users', target.uid), {
          displayName: sanitizeString(
            editDisplayName,
            ACCOUNT_CONSTRAINTS.DISPLAY_NAME_MAX,
            target.displayName
          ),
          storeName: sanitizeString(
            editStoreName,
            ACCOUNT_CONSTRAINTS.STORE_NAME_MAX,
            target.storeName
          ),
          contactInfo: sanitizeString(editContactInfo, ACCOUNT_CONSTRAINTS.CONTACT_INFO_MAX, ''),
          updatedAt: serverTimestamp(),
        });
      }
      setEditingUid(null);
      onNotify(`تم حفظ التعديلات لحساب (${editStoreName}) بنجاح.`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Owner Action: Pre-provision a new subscriber account record
  const handleCreateSubscriberAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    const cleanEmail = sanitizeString(newEmail.toLowerCase(), ACCOUNT_CONSTRAINTS.EMAIL_MAX);
    const cleanName = sanitizeString(newDisplayName, ACCOUNT_CONSTRAINTS.DISPLAY_NAME_MAX);
    const cleanStore = sanitizeString(newStoreName, ACCOUNT_CONSTRAINTS.STORE_NAME_MAX);
    const cleanContact = sanitizeString(newContactInfo, ACCOUNT_CONSTRAINTS.CONTACT_INFO_MAX);
    const cleanNotes = sanitizeString(newNotes, ACCOUNT_CONSTRAINTS.NOTES_MAX);

    if (cleanEmail.length < ACCOUNT_CONSTRAINTS.EMAIL_MIN || !cleanName || !cleanStore) {
      onNotify('يرجى إدخال البريد الإلكتروني والاسم الكامل واسم المتجر.', 'error');
      return;
    }

    // Generate a deterministic safe ID for pre-provisioned account
    const generatedId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`.replace(
      /[^a-zA-Z0-9_\-]/g,
      ''
    );
    const path = `users/${generatedId}`;
    setIsSubmittingCreate(true);

    try {
      await setDoc(doc(db, 'users', generatedId), {
        uid: generatedId,
        email: cleanEmail,
        displayName: cleanName,
        storeName: cleanStore,
        contactInfo: cleanContact,
        role: newRole,
        accountStatus: newStatus,
        planTier: newPlanTier,
        subscriptionEndsAt: sanitizeString(
          computeSubscriptionEndDate(newDurationDays),
          ACCOUNT_CONSTRAINTS.SUBSCRIPTION_ENDS_MAX,
          '2027-01-01'
        ),
        notes: cleanNotes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setShowCreateForm(false);
      setNewEmail('');
      setNewDisplayName('');
      setNewStoreName('');
      setNewContactInfo('');
      setNewNotes('');
      onNotify(`تم إنشاء وإضافة حساب المشترك (${cleanStore}) بنجاح.`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Owner Action: Delete an account
  const handleDeleteAccount = async (target: UserAccountProfile) => {
    if (target.email === OWNER_EMAIL) return;
    const path = `users/${target.uid}`;
    try {
      await deleteDoc(doc(db, 'users', target.uid));
      setConfirmDeleteUid(null);
      onNotify(`تم حذف حساب (${target.storeName}) نهائياً.`, 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const startEditing = (acc: UserAccountProfile) => {
    setEditingUid(acc.uid);
    setEditDisplayName(acc.displayName);
    setEditStoreName(acc.storeName);
    setEditContactInfo(acc.contactInfo || '');
    setEditNotes(acc.notes || '');
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Top Banner: Current User Identity & Owner Control Center */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
                isOwner
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400'
              }`}
            >
              {isOwner ? <Crown className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {isOwner
                    ? 'لوحة تحكم المدير المالك — إدارة الحسابات والاشتراكات'
                    : 'بيانات حسابك واشتراكك في المنصة'}
                </h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                    isOwner
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {isOwner ? 'المدير المالك (Owner Admin)' : 'مشترك معتمد (Active)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isOwner
                  ? `أنت مسجل الدخول بصفتك المدير المالك (${currentUserProfile.email}). يمكنك تفعيل أو إيقاف حسابات المتاجر وتحديد باقاتهم وصلاحياتهم بالزمن الفعلي.`
                  : `مرحباً بك (${currentUserProfile.displayName} - ${currentUserProfile.storeName}). اشتراكك مفعل ومعتمد من إدارة المنصة.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة حساب مشترك جديد</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSignOut}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards (Visible to Owner/Admin) */}
      {isOwner && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            onClick={() => setStatusFilter('all')}
            className={`bg-slate-900 border rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all ${
              statusFilter === 'all'
                ? 'border-indigo-500 bg-indigo-950/20'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">إجمالي الحسابات</span>
              <span className="text-lg font-extrabold font-mono-numbers text-white">
                {stats.total}
              </span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('pending')}
            className={`bg-slate-900 border rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all ${
              statusFilter === 'pending'
                ? 'border-amber-500 bg-amber-950/25'
                : stats.pending > 0
                ? 'border-amber-500/40 bg-amber-950/15'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">بانتظار التفعيل</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold font-mono-numbers text-amber-300">
                  {stats.pending}
                </span>
                {stats.pending > 0 && (
                  <span className="text-[10px] font-bold text-amber-400">بحاجة لموافقتك</span>
                )}
              </div>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('active')}
            className={`bg-slate-900 border rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all ${
              statusFilter === 'active'
                ? 'border-emerald-500 bg-emerald-950/25'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">المشتركين النشطين</span>
              <span className="text-lg font-extrabold font-mono-numbers text-emerald-400">
                {stats.active}
              </span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('suspended')}
            className={`bg-slate-900 border rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all ${
              statusFilter === 'suspended'
                ? 'border-rose-500 bg-rose-950/25'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">حسابات موقوفة</span>
              <span className="text-lg font-extrabold font-mono-numbers text-rose-400">
                {stats.suspended}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Owner Modal / Drawer Form: Create Pre-Provisioned Subscriber Account */}
      {isOwner && showCreateForm && (
        <form
          onSubmit={handleCreateSubscriberAccount}
          className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-lg"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white">
                إضافة وتفعيل حساب مشترك جديد من قِبل المدير المالك
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                الاسم الكامل للمشترك *
              </label>
              <input
                type="text"
                required
                maxLength={ACCOUNT_CONSTRAINTS.DISPLAY_NAME_MAX}
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="مثال: خالد العتيبي"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                اسم المتجر أو الشركة *
              </label>
              <input
                type="text"
                required
                maxLength={ACCOUNT_CONSTRAINTS.STORE_NAME_MAX}
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="مثال: متجر البطاقات الذهبية"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                البريد الإلكتروني (Google) *
              </label>
              <input
                type="email"
                required
                maxLength={ACCOUNT_CONSTRAINTS.EMAIL_MAX}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="merchant@gmail.com"
                dir="ltr"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 font-mono-numbers"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                وسيلة التواصل (واتساب / تيليجرام)
              </label>
              <input
                type="text"
                maxLength={ACCOUNT_CONSTRAINTS.CONTACT_INFO_MAX}
                value={newContactInfo}
                onChange={(e) => setNewContactInfo(e.target.value)}
                placeholder="+9665..."
                dir="ltr"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 font-mono-numbers"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                باقة الاشتراك
              </label>
              <select
                value={newPlanTier}
                onChange={(e) => setNewPlanTier(e.target.value as SubscriptionPlanTier)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="starter">Starter ($29/شهرياً)</option>
                <option value="pro">Pro الاحترافية ($59/شهرياً)</option>
                <option value="enterprise">Enterprise الشركات ($129/شهرياً)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                حالة الحساب الابتدائية
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as UserAccountStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="active">نشط ومفعل فوراً (Active)</option>
                <option value="pending">بانتظار التفعيل (Pending)</option>
                <option value="suspended">موقوف (Suspended)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                مدة صلاحية الاشتراك
              </label>
              <select
                value={newDurationDays}
                onChange={(e) => setNewDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value={30}>شهر واحد (30 يوماً)</option>
                <option value={90}>3 أشهر (90 يوماً)</option>
                <option value={365}>سنة كاملة (365 يوماً)</option>
                <option value={9999}>اشتراك دائم مفتوح</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                ملاحظات إدارية (تظهر للمالك فقط)
              </label>
              <input
                type="text"
                maxLength={ACCOUNT_CONSTRAINTS.NOTES_MAX}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="مثال: تم تحويل رسوم الاشتراك البنكي"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmittingCreate}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmittingCreate ? 'جارِ الحفظ...' : 'حفظ وتفعيل الحساب'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Bar (for Owner) */}
      {isOwner && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative grow max-w-md">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المتجر، صاحب الحساب، البريد الإلكتروني، أو رقم التواصل..."
              className="w-full pl-3 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(
                [
                  { id: 'all', label: 'الكل' },
                  { id: 'pending', label: 'بانتظار التفعيل' },
                  { id: 'active', label: 'نشط' },
                  { id: 'suspended', label: 'موقوف' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    statusFilter === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as 'all' | SubscriptionPlanTier)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-[11px] font-bold focus:outline-none"
            >
              <option value="all">كل الباقات</option>
              <option value="starter">باقة Starter</option>
              <option value="pro">باقة Pro</option>
              <option value="enterprise">باقة Enterprise</option>
            </select>
          </div>
        </div>
      )}

      {/* Accounts Table / Cards List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-slate-200">
            {isOwner
              ? `قائمة الحسابات المسجلة (${filteredAccounts.length} من ${accounts.length})`
              : 'تفاصيل حسابك المسجل'}
          </span>
          <span className="text-[11px] text-slate-400">
            تزامن فوري عبر Firestore Real-Time
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {filteredAccounts.map((acc) => {
            const isAccountOwner = acc.email === OWNER_EMAIL || acc.role === 'owner';
            const isEditing = editingUid === acc.uid;
            const planMeta =
              PLAN_TIERS_INFO.find((p) => p.id === acc.planTier) || PLAN_TIERS_INFO[1];

            return (
              <div
                key={acc.uid}
                className={`p-4 sm:p-5 transition-colors ${
                  acc.accountStatus === 'pending'
                    ? 'bg-amber-950/15 hover:bg-amber-950/25'
                    : acc.accountStatus === 'suspended'
                    ? 'bg-rose-950/15 hover:bg-rose-950/25'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  {/* Account Info Column */}
                  <div className="space-y-2 min-w-0 grow">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-white text-sm flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{acc.storeName}</span>
                      </span>

                      {/* Status Badge */}
                      {acc.accountStatus === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>نشط ومفعل</span>
                        </span>
                      ) : acc.accountStatus === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Clock className="w-3 h-3" />
                          <span>بانتظار التفعيل</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <XCircle className="w-3 h-3" />
                          <span>موقوف</span>
                        </span>
                      )}

                      {/* Role Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          isAccountOwner
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : acc.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isAccountOwner
                          ? 'المدير المالك (Owner)'
                          : acc.role === 'admin'
                          ? 'مدير مساعد (Admin)'
                          : 'تاجر مشترك'}
                      </span>

                      {/* Plan Badge */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {planMeta.nameAr} ({planMeta.priceLabel})
                      </span>
                    </div>

                    {/* Metadata Strip */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1 text-slate-200 font-medium">
                        <span>المسؤول:</span>
                        <strong>{acc.displayName}</strong>
                      </span>
                      <span className="flex items-center gap-1 font-mono-numbers">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{acc.email}</span>
                      </span>
                      {acc.contactInfo && (
                        <span className="flex items-center gap-1 font-mono-numbers text-emerald-300">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span dir="ltr">{acc.contactInfo}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-mono-numbers">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>ينتهي في: {acc.subscriptionEndsAt}</span>
                      </span>
                    </div>

                    {isOwner && acc.notes && !isEditing && (
                      <div className="text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-500/20 rounded-lg px-2.5 py-1 inline-block">
                        ملاحظة الإدارة: {acc.notes}
                      </div>
                    )}
                  </div>

                  {/* Owner Management Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {isOwner && !isAccountOwner && (
                      <>
                        {/* Approve / Activate vs Suspend Buttons */}
                        {acc.accountStatus !== 'active' ? (
                          <button
                            type="button"
                            onClick={() => handleChangeAccountStatus(acc, 'active')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تفعيل الحساب</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleChangeAccountStatus(acc, 'suspended')}
                            className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>إيقاف مؤقت</span>
                          </button>
                        )}

                        {/* Change Plan Selector */}
                        <select
                          value={acc.planTier}
                          onChange={(e) =>
                            handleChangePlanTier(acc, e.target.value as SubscriptionPlanTier)
                          }
                          className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold text-[11px] focus:outline-none focus:border-indigo-500"
                          title="تغيير باقة الاشتراك"
                        >
                          <option value="starter">Starter</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>

                        {/* Quick Extend Subscription Selector */}
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val > 0) {
                              handleExtendSubscription(acc, val);
                              e.target.value = '';
                            }
                          }}
                          className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 font-bold text-[11px] focus:outline-none focus:border-emerald-500"
                          title="تمديد فترة الاشتراك"
                        >
                          <option value="" disabled>
                            + تمديد الاشتراك...
                          </option>
                          <option value={30}>+30 يوم</option>
                          <option value={90}>+90 يوم (3 أشهر)</option>
                          <option value={365}>+365 يوم (سنة)</option>
                          <option value={9999}>اشتراك مفتوح دائم</option>
                        </select>

                        {/* Role Selector */}
                        <select
                          value={acc.role}
                          onChange={(e) =>
                            handleChangeRole(acc, e.target.value as UserAccountRole)
                          }
                          className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-semibold text-[11px] focus:outline-none"
                          title="تغيير الصلاحية"
                        >
                          <option value="merchant">تاجر مشترك</option>
                          <option value="admin">مدير مساعد</option>
                        </select>
                      </>
                    )}

                    {/* Edit Details Button */}
                    <button
                      type="button"
                      onClick={() => (isEditing ? setEditingUid(null) : startEditing(acc))}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="تعديل بيانات المتجر والملاحظات"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Account Button (Owner only, non-owner target) */}
                    {isOwner && !isAccountOwner && (
                      <>
                        {confirmDeleteUid === acc.uid ? (
                          <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-500/50 px-2 py-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(acc)}
                              className="text-[11px] font-bold text-rose-300 hover:text-white px-1.5"
                            >
                              تأكيد الحذف
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUid(null)}
                              className="text-slate-400 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteUid(acc.uid)}
                            className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white transition-colors"
                            title="حذف الحساب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Inline Edit Panel */}
                {isEditing && (
                  <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/70 p-3.5 rounded-xl">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">الاسم الكامل:</label>
                      <input
                        type="text"
                        maxLength={ACCOUNT_CONSTRAINTS.DISPLAY_NAME_MAX}
                        value={editDisplayName}
                        onChange={(e) => setEditDisplayName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">اسم المتجر:</label>
                      <input
                        type="text"
                        maxLength={ACCOUNT_CONSTRAINTS.STORE_NAME_MAX}
                        value={editStoreName}
                        onChange={(e) => setEditStoreName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        رقم التواصل / التيليجرام:
                      </label>
                      <input
                        type="text"
                        maxLength={ACCOUNT_CONSTRAINTS.CONTACT_INFO_MAX}
                        value={editContactInfo}
                        onChange={(e) => setEditContactInfo(e.target.value)}
                        dir="ltr"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono-numbers"
                      />
                    </div>
                    {isOwner && (
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">
                          ملاحظات المدير المالك:
                        </label>
                        <input
                          type="text"
                          maxLength={ACCOUNT_CONSTRAINTS.NOTES_MAX}
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                        />
                      </div>
                    )}
                    <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingUid(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveInlineEdit(acc)}
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>حفظ التعديلات</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
