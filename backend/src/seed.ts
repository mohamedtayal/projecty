import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from './lib/prisma.js';

async function seed() {
  console.log('Starting database seed...\n');

  try {
    const adminEmail = 'admin@mohamed.dev';
    const adminPassword = 'admin123';

    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('Admin user already exists, skipping admin creation step.');
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      await prisma.adminUser.create({
        data: {
          name: 'Default Admin',
          email: adminEmail,
          passwordHash,
          role: 'ADMIN',
          isActive: true
        }
      });

      console.log('Admin user created with credentials:');
      console.log(`  Email:    ${adminEmail}`);
      console.log(`  Password: ${adminPassword}`);
    }

    const existingRequests = await prisma.contactRequest.count();

    if (existingRequests === 0) {
      const demoRequests = [
        {
          name: 'Ahmed Hussein',
          email: 'ahmed@example.com',
          phone: '01012345678',
          company: 'Cairo Innovation Labs',
          subject: 'AI powered analytics dashboard',
          budget: '$1,500 - $5,000',
          message:
            'We are looking to build a lightweight analytics dashboard that showcases our AI results to clients. The project should include a modern UI, real-time charts, and a secure admin area for our team.',
          status: 'NEW' as const
        },
        {
          name: 'Sara Ibrahim',
          email: 'sara@example.com',
          phone: '01098765432',
          company: 'Digital Reach Agency',
          subject: 'Full-stack web revamp',
          budget: '$3,000 - $8,000',
          message:
            'Our agency needs to overhaul its main website with a fast landing page, blog, and CRM integration. We have a detailed brief ready and want to launch within eight weeks.',
          status: 'IN_REVIEW' as const
        },
        {
          name: 'Mahmoud Ali',
          email: 'mahmoud@example.com',
          phone: '01155555555',
          company: 'Alexandria Robotics',
          subject: 'IoT monitoring dashboard',
          budget: '$5,000 - $10,000',
          message:
            'We require a dashboard to track the health of deployed IoT devices with role-based access and automated notifications. The data source is a PostgreSQL database that we already manage.',
          status: 'CONTACTED' as const
        },
        {
          name: 'Fatma Nabil',
          email: 'fatma@example.com',
          phone: '01234567890',
          subject: 'Personal portfolio redesign',
          budget: 'Under $1,500',
          message:
            'I would like to redesign my personal portfolio with light animations, a CMS for case studies, and bilingual content. I have a style guide and copy ready to go.',
          status: 'NEW' as const
        }
      ];

      await prisma.contactRequest.createMany({
        data: demoRequests
      });

      console.log(`Created ${demoRequests.length} demo contact requests.`);
    } else {
      console.log(`${existingRequests} contact requests already exist, skipping demo seed.`);
    }

    console.log('\nDatabase seed completed successfully.\n');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
