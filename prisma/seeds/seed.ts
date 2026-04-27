/**
 * Seed Script — "بيتي"
 *
 * بيانات تجريبية لبيئة التطوير.
 * الاستخدام: npx ts-node prisma/seeds/seed.ts
 *
 * القواعد:
 * - كل الأرقام 0-9 (لا هندية)
 * - لا نصوص حرفية في الكود (إلا هنا للـ seed)
 * - كل المبالغ Decimal
 */

import { PrismaClient, type Difficulty, type PeriodType, type AssignmentType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء الـ Seed...');

  // ---- تنظيف البيانات القديمة (dev only) ----
  if (process.env.NODE_ENV !== 'production') {
    await prisma.walletTransaction.deleteMany();
    await prisma.savingsGoal.deleteMany();
    await prisma.childWallet.deleteMany();
    await prisma.jobInstance.deleteMany();
    await prisma.jobMenuItem.deleteMany();
    await prisma.choreExecution.deleteMany();
    await prisma.chore.deleteMany();
    await prisma.billPayment.deleteMany();
    await prisma.bill.deleteMany();
    await prisma.shoppingItem.deleteMany();
    await prisma.shoppingList.deleteMany();
    await prisma.maintenanceLog.deleteMany();
    await prisma.maintenanceSchedule.deleteMany();
    await prisma.warrantyDocument.deleteMany();
    await prisma.appliance.deleteMany();
    await prisma.documentArchive.deleteMany();
    await prisma.householdMember.deleteMany();
    await prisma.household.deleteMany();
    await prisma.user.deleteMany();
    console.log('🗑️  تم تنظيف البيانات القديمة');
  }

  // ---- المستخدمون ----
  const father = await prisma.user.create({
    data: {
      phone: '0501234567',
      name: 'أحمد العمر',
      birthDate: new Date('1985-06-15'),
    },
  });

  const mother = await prisma.user.create({
    data: {
      phone: '0551234567',
      name: 'سارة العمر',
      birthDate: new Date('1988-03-22'),
    },
  });

  const child1 = await prisma.user.create({
    data: {
      phone: '0561234567',
      name: 'محمد',
      birthDate: new Date('2014-09-10'), // 11 سنة
    },
  });

  const child2 = await prisma.user.create({
    data: {
      phone: '0571234567',
      name: 'نورة',
      birthDate: new Date('2017-01-25'), // 9 سنوات
    },
  });

  console.log('👥 تم إنشاء المستخدمين');

  // ---- البيت ----
  const household = await prisma.household.create({
    data: { name: 'بيت العمر', city: 'الرياض' },
  });

  // ---- أعضاء البيت ----
  const fatherMember = await prisma.householdMember.create({
    data: {
      userId: father.id,
      householdId: household.id,
      role: 'OWNER',
      age: 40,
    },
  });

  const motherMember = await prisma.householdMember.create({
    data: {
      userId: mother.id,
      householdId: household.id,
      role: 'ADMIN',
      age: 37,
    },
  });

  const child1Member = await prisma.householdMember.create({
    data: {
      userId: child1.id,
      householdId: household.id,
      role: 'CHILD',
      age: 11,
    },
  });

  const child2Member = await prisma.householdMember.create({
    data: {
      userId: child2.id,
      householdId: household.id,
      role: 'CHILD',
      age: 9,
    },
  });

  console.log('🏠 تم إنشاء البيت والأعضاء');

  // ---- محافظ الأطفال ----
  await prisma.childWallet.create({
    data: {
      memberId: child1Member.id,
      balance: 45,
      totalEarned: 120,
      totalSpent: 75,
      spendPercent: 50,
      savePercent: 30,
      charityPercent: 10,
      surprisePercent: 10,
    },
  });

  await prisma.childWallet.create({
    data: {
      memberId: child2Member.id,
      balance: 28,
      totalEarned: 80,
      totalSpent: 52,
      spendPercent: 50,
      savePercent: 30,
      charityPercent: 10,
      surprisePercent: 10,
    },
  });

  console.log('💰 تم إنشاء محافظ الأطفال');

  // ---- الفواتير ----
  const now = new Date();
  const bills = [
    {
      title: 'فاتورة الكهرباء',
      category: 'ELECTRICITY' as const,
      provider: 'SEC',
      amount: 380,
      dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
      isRecurring: true,
      recurrencePeriod: 'MONTHLY' as const,
      status: 'PENDING' as const,
    },
    {
      title: 'اشتراك STC الألياف',
      category: 'INTERNET' as const,
      provider: 'STC',
      amount: 199,
      dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
      isRecurring: true,
      recurrencePeriod: 'MONTHLY' as const,
      status: 'PAID' as const,
      paidAt: new Date(),
    },
    {
      title: 'اشتراك نتفليكس',
      category: 'SUBSCRIPTION' as const,
      provider: 'Netflix',
      amount: 44,
      dueDate: new Date(now.getFullYear(), now.getMonth(), 22),
      isRecurring: true,
      recurrencePeriod: 'MONTHLY' as const,
      status: 'PENDING' as const,
    },
    {
      title: 'فاتورة المياه',
      category: 'WATER' as const,
      provider: 'NWC',
      amount: 95,
      dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 20),
      isRecurring: true,
      recurrencePeriod: 'MONTHLY' as const,
      status: 'OVERDUE' as const,
    },
    {
      title: 'اشتراك STC Play',
      category: 'SUBSCRIPTION' as const,
      provider: 'STC Play',
      amount: 29,
      dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
      isRecurring: true,
      recurrencePeriod: 'MONTHLY' as const,
      status: 'DUE' as const,
    },
  ];

  for (const bill of bills) {
    await prisma.bill.create({
      data: { ...bill, householdId: household.id },
    });
  }

  console.log('🧾 تم إنشاء الفواتير');

  // ---- المهام الدورية (Grocy algorithm) ----
  const choreData: Array<{
    name: string;
    periodType: PeriodType;
    periodDays?: number;
    assignmentType: AssignmentType;
    pointsReward: number;
  }> = [
    {
      name: 'تنظيف الحمامات',
      periodType: 'WEEKLY',
      periodDays: 7,
      assignmentType: 'WHO_LEAST_DID_IT_FIRST',
      pointsReward: 10,
    },
    {
      name: 'إخراج النفايات',
      periodType: 'DAILY',
      periodDays: 2,
      assignmentType: 'IN_ALPHABETIC_ORDER',
      pointsReward: 5,
    },
    {
      name: 'كنس وتنظيف الصالة',
      periodType: 'DYNAMIC_REGULAR',
      periodDays: 3,
      assignmentType: 'WHO_LEAST_DID_IT_FIRST',
      pointsReward: 8,
    },
    {
      name: 'تنظيف المطبخ',
      periodType: 'DAILY',
      periodDays: 1,
      assignmentType: 'RANDOM',
      pointsReward: 7,
    },
    {
      name: 'غسيل الملابس',
      periodType: 'WEEKLY',
      periodDays: 7,
      assignmentType: 'FIXED',
      pointsReward: 12,
    },
    {
      name: 'تغيير فلتر المكيف',
      periodType: 'MONTHLY',
      assignmentType: 'FIXED',
      pointsReward: 15,
    },
  ];

  for (const chore of choreData) {
    await prisma.chore.create({
      data: {
        ...chore,
        householdId: household.id,
        assignedMemberIds: [fatherMember.id, motherMember.id],
        nextDueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('📋 تم إنشاء المهام الدورية');

  // ---- منيو أعمال الأطفال ----
  const jobMenuItems: Array<{
    title: string;
    iconEmoji: string;
    reward: number;
    minAge: number;
    maxAge?: number;
    difficulty: Difficulty;
    estimatedMinutes: number;
    category: string;
  }> = [
    // أعمال سهلة (4-8 سنوات)
    {
      title: 'ترتيب سريري',
      iconEmoji: '🛏️',
      reward: 2,
      minAge: 4,
      maxAge: 12,
      difficulty: 'EASY',
      estimatedMinutes: 5,
      category: 'ترتيب',
    },
    {
      title: 'وضع الملابس في الغسالة',
      iconEmoji: '👕',
      reward: 3,
      minAge: 6,
      maxAge: 12,
      difficulty: 'EASY',
      estimatedMinutes: 10,
      category: 'غسيل',
    },
    {
      title: 'سقي النباتات',
      iconEmoji: '🌱',
      reward: 3,
      minAge: 5,
      maxAge: 12,
      difficulty: 'EASY',
      estimatedMinutes: 10,
      category: 'حديقة',
    },
    {
      title: 'ترتيب الأحذية عند الباب',
      iconEmoji: '👟',
      reward: 2,
      minAge: 4,
      maxAge: 10,
      difficulty: 'EASY',
      estimatedMinutes: 5,
      category: 'ترتيب',
    },
    // أعمال متوسطة (7-12 سنة)
    {
      title: 'كنس غرفتي',
      iconEmoji: '🧹',
      reward: 5,
      minAge: 7,
      maxAge: 12,
      difficulty: 'MEDIUM',
      estimatedMinutes: 15,
      category: 'تنظيف',
    },
    {
      title: 'تنظيف دورة المياه',
      iconEmoji: '🚿',
      reward: 8,
      minAge: 9,
      maxAge: 12,
      difficulty: 'MEDIUM',
      estimatedMinutes: 20,
      category: 'تنظيف',
    },
    {
      title: 'غسيل الصحون',
      iconEmoji: '🍽️',
      reward: 5,
      minAge: 8,
      maxAge: 12,
      difficulty: 'MEDIUM',
      estimatedMinutes: 20,
      category: 'مطبخ',
    },
    {
      title: 'مساعدة في تحضير العشاء',
      iconEmoji: '🍳',
      reward: 10,
      minAge: 9,
      maxAge: 12,
      difficulty: 'MEDIUM',
      estimatedMinutes: 30,
      category: 'مطبخ',
    },
    // أعمال صعبة (10-12 سنة)
    {
      title: 'تنظيف السيارة من الداخل',
      iconEmoji: '🚗',
      reward: 15,
      minAge: 10,
      difficulty: 'HARD',
      estimatedMinutes: 45,
      category: 'سيارة',
    },
    {
      title: 'تنظيف الشبابيك',
      iconEmoji: '🪟',
      reward: 12,
      minAge: 10,
      difficulty: 'HARD',
      estimatedMinutes: 40,
      category: 'تنظيف',
    },
  ];

  for (const item of jobMenuItems) {
    await prisma.jobMenuItem.create({
      data: {
        ...item,
        reward: item.reward,
        householdId: household.id,
      },
    });
  }

  console.log('💼 تم إنشاء منيو الأعمال');

  // ---- الأجهزة المنزلية مع ضمانات ----
  const applianceData = [
    {
      name: 'مكيف الصالة',
      brand: 'LG',
      model: 'DUAL 24000 BTU',
      category: 'تكييف',
      location: 'الصالة',
      purchaseDate: new Date('2023-05-15'),
      purchasePrice: 3200,
      store: 'اكسترا',
      warrantyStart: new Date('2023-05-15'),
      warrantyEnd: new Date('2026-05-15'),
      warrantyMonths: 36,
      warrantyType: 'MANUFACTURER' as const,
    },
    {
      name: 'ثلاجة المطبخ',
      brand: 'Samsung',
      model: 'RT53K6540SL',
      category: 'مطبخ',
      location: 'المطبخ',
      purchaseDate: new Date('2022-01-10'),
      purchasePrice: 2800,
      store: 'اكسترا',
      warrantyStart: new Date('2022-01-10'),
      warrantyEnd: new Date('2027-01-10'),
      warrantyMonths: 60,
      warrantyType: 'MANUFACTURER' as const,
    },
    {
      name: 'غسالة الملابس',
      brand: 'Bosch',
      model: 'WAJ280H5GC',
      category: 'أجهزة منزلية',
      location: 'الغرفة الخدمية',
      purchaseDate: new Date('2021-08-20'),
      purchasePrice: 2100,
      store: 'ساكو',
      warrantyStart: new Date('2021-08-20'),
      warrantyEnd: new Date('2023-08-20'), // انتهى الضمان
      warrantyMonths: 24,
      warrantyType: 'MANUFACTURER' as const,
    },
  ];

  for (const app of applianceData) {
    await prisma.appliance.create({
      data: {
        ...app,
        purchasePrice: app.purchasePrice,
        householdId: household.id,
        warrantyNotifyDaysBefore: 30,
      },
    });
  }

  console.log('🏠 تم إنشاء الأجهزة المنزلية');

  // ---- قائمة مشتريات ----
  const shoppingList = await prisma.shoppingList.create({
    data: {
      name: 'قائمة السوق الأسبوعية',
      householdId: household.id,
      isShared: true,
    },
  });

  const shoppingItems = [
    { name: 'أرز بسمتي', category: 'بقالة', quantity: '5', unit: 'كيلو', urgency: 'HIGH' as const },
    { name: 'زيت زيتون', category: 'بقالة', quantity: '2', unit: 'لتر', urgency: 'MEDIUM' as const },
    { name: 'خبز', category: 'خبازة', quantity: '3', unit: 'كيس', urgency: 'HIGH' as const },
    { name: 'حليب', category: 'ألبان', quantity: '6', unit: 'لتر', urgency: 'HIGH' as const },
    { name: 'جبن', category: 'ألبان', quantity: '1', unit: 'كيلو', urgency: 'MEDIUM' as const },
    { name: 'عصير برتقال', category: 'مشروبات', quantity: '4', unit: 'كرتون', urgency: 'LOW' as const },
  ];

  for (const item of shoppingItems) {
    await prisma.shoppingItem.create({
      data: {
        ...item,
        listId: shoppingList.id,
        addedById: motherMember.id,
      },
    });
  }

  console.log('🛒 تم إنشاء قائمة المشتريات');

  console.log('');
  console.log('✅ اكتمل الـ Seed بنجاح!');
  console.log(`   مستخدمون: 4`);
  console.log(`   بيت: 1 (${household.name})`);
  console.log(`   فواتير: ${bills.length}`);
  console.log(`   مهام دورية: ${choreData.length}`);
  console.log(`   أعمال الأطفال: ${jobMenuItems.length}`);
  console.log(`   أجهزة منزلية: ${applianceData.length}`);
  console.log(`   مشتريات: ${shoppingItems.length}`);
}

main()
  .catch((e) => {
    console.error('❌ خطأ في الـ Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
