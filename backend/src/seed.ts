// ============================================
// Database Seed Script
// إنشاء مستخدم Admin افتراضي
// ============================================

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from './lib/prisma.js';

async function seed() {
  console.log('🌱 Starting database seed...\n');
  
  try {
    // ========================================
    // إنشاء مستخدم Admin
    // ========================================
    const adminEmail = 'admin@mohamed.dev';
    const adminPassword = 'admin123';
    
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      
      const admin = await prisma.adminUser.create({
        data: {
          name: 'محمد طايل',
          email: adminEmail,
          passwordHash,
          role: 'ADMIN',
          isActive: true
        }
      });
      
      console.log('✅ Admin user created:');
      console.log(`   📧 Email: ${adminEmail}`);
      console.log(`   🔑 Password: ${adminPassword}`);
      console.log(`   👤 Name: ${admin.name}`);
    }
    
    // ========================================
    // إنشاء طلبات تواصل تجريبية
    // ========================================
    const existingRequests = await prisma.contactRequest.count();
    
    if (existingRequests === 0) {
      const demoRequests = [
        {
          name: 'أحمد محمد',
          email: 'ahmed@example.com',
          phone: '01012345678',
          company: 'شركة التقنية',
          subject: 'مشروع AI',
          budget: '1500$ - 5000$',
          message: 'أريد بناء نظام تصنيف صور باستخدام الذكاء الاصطناعي لمشروعي التجاري. أحتاج نموذج يمكنه التعرف على المنتجات المختلفة.',
          status: 'NEW' as const
        },
        {
          name: 'سارة علي',
          email: 'sara@example.com',
          phone: '01098765432',
          company: 'فريلانسر',
          subject: 'تطوير ويب',
          budget: '500$ - 1500$',
          message: 'أحتاج موقع شخصي احترافي مع لوحة تحكم كاملة. يجب أن يكون الموقع سريع وجميل التصميم مع دعم للغة العربية.',
          status: 'IN_REVIEW' as const
        },
        {
          name: 'محمود حسن',
          email: 'mahmoud@example.com',
          phone: '01155555555',
          company: 'شركة البيع',
          subject: 'تحليل بيانات',
          budget: 'أقل من 500$',
          message: 'أريد تحليل بيانات المبيعات الخاصة بشركتي واستخراج insights مفيدة لتحسين الأداء واتخاذ قرارات أفضل.',
          status: 'CONTACTED' as const
        },
        {
          name: 'فاطمة أحمد',
          email: 'fatma@example.com',
          phone: '01234567890',
          subject: 'استشارة',
          budget: 'غير محدد',
          message: 'أريد استشارة تقنية حول أفضل الأدوات والتقنيات لبناء تطبيق ذكاء اصطناعي للتعرف على النصوص العربية.',
          status: 'NEW' as const
        }
      ];
      
      for (const request of demoRequests) {
        await prisma.contactRequest.create({
          data: request
        });
      }
      
      console.log(`\n✅ Created ${demoRequests.length} demo contact requests`);
    } else {
      console.log(`ℹ️  ${existingRequests} contact requests already exist`);
    }
    
    console.log('\n✨ Database seed completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
