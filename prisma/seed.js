const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);

    await prisma.admin.upsert({
        where: { email: process.env.ADMIN_EMAIL || 'admin@mohamed.dev' },
        update: { password: hashedPassword },
        create: {
            email: process.env.ADMIN_EMAIL || 'admin@mohamed.dev',
            password: hashedPassword,
        },
    });

    console.log('Admin user seeded successfully');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
