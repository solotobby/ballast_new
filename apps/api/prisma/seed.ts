import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Ballast database...');

  // 1. Ensure The Copper Kettle organisation exists
  let org = await prisma.organisation.findFirst({
    where: { name: 'The Copper Kettle' },
  });

  if (!org) {
    org = await prisma.organisation.create({
      data: {
        name: 'The Copper Kettle',
        legalName: 'Copper Kettle Hospitality Ltd',
        companyNumber: '09842145',
        sicCode: '56101',
        address: '14–16 Oldham Street, Manchester, Greater Manchester',
        jurisdiction: 'England',
        council: 'Manchester City Council',
        sector: 'hospitality',
        sizeBand: '10_49',
        siteCount: 2,
        activities: ['food_prep', 'alcohol', 'hot_food_late', 'cards_data', 'cctv', 'employees', 'gas_appliances'],
        onboardingStep: 'done',
      },
    });
    console.log(`Created organisation: ${org.name} (${org.id})`);
  } else {
    console.log(`Found organisation: ${org.name} (${org.id})`);
  }

  // 2. Ensure sites exist
  let site1 = await prisma.site.findFirst({
    where: { organisationId: org.id, name: 'Northern Quarter café' },
  });
  if (!site1) {
    site1 = await prisma.site.create({
      data: {
        organisationId: org.id,
        name: 'Northern Quarter café',
        address: '14 Oldham Street, Manchester',
        postcode: 'M1 1JN',
        kind: 'Dining Room & Bar',
        staffCount: 14,
        description: 'Two-floor dining room, commercial kitchen, bar & cellar',
      },
    });
  }

  let site2 = await prisma.site.findFirst({
    where: { organisationId: org.id, name: 'Deansgate kitchen' },
  });
  if (!site2) {
    site2 = await prisma.site.create({
      data: {
        organisationId: org.id,
        name: 'Deansgate kitchen',
        address: '204 Deansgate, Manchester',
        postcode: 'M3 3NF',
        kind: 'Prep & Takeaway',
        staffCount: 22,
        description: 'Central prep kitchen, takeaway counter, and deliveries',
      },
    });
  }

  // 3. Ensure demo user op@copperkettle.co exists with password "prototype"
  const passwordHash = await hash('prototype', 12);
  const demoEmail = 'op@copperkettle.co';

  let demoUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash,
        name: 'A. Mensah',
      },
    });
    console.log(`Created user: ${demoUser.email}`);
  } else {
    await prisma.user.update({
      where: { id: demoUser.id },
      data: { passwordHash, name: 'A. Mensah' },
    });
    console.log(`Updated user password for: ${demoUser.email}`);
  }

  // Link user to organisation as owner
  const membership = await prisma.organisationUser.findUnique({
    where: {
      organisationId_userId: {
        organisationId: org.id,
        userId: demoUser.id,
      },
    },
  });

  if (!membership) {
    await prisma.organisationUser.create({
      data: {
        organisationId: org.id,
        userId: demoUser.id,
        role: 'owner',
        siteId: site1.id,
      },
    });
    console.log(`Linked ${demoEmail} as owner of ${org.name}`);
  }

  // Also ensure admin@copperkettle.co.uk has password "prototype"
  const adminEmail = 'admin@copperkettle.co.uk';
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (adminUser) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { passwordHash },
    });
  }

  // 4. Ensure initial logbook entries exist
  const logCount = await prisma.logbookEntry.count({
    where: { organisationId: org.id },
  });

  if (logCount === 0) {
    await prisma.logbookEntry.createMany({
      data: [
        {
          organisationId: org.id,
          siteId: site2.id,
          type: 'Fire incident',
          summary: 'Small pan flare in kitchen, extinguished with fire blanket. Extraction checked.',
          createdByName: 'J. Fields',
          occurredAt: new Date('2026-09-18T14:30:00Z'),
        },
        {
          organisationId: org.id,
          siteId: site1.id,
          type: 'Challenge 25 refusal',
          summary: 'Refused alcohol sale, ID declined. Logged per licensing conditions.',
          createdByName: 'R. Okafor',
          occurredAt: new Date('2026-09-16T21:15:00Z'),
        },
        {
          organisationId: org.id,
          siteId: site2.id,
          type: 'Inspection',
          summary: 'Weekly internal food safety walk-through completed, 2 minor actions raised.',
          createdByName: 'A. Mensah',
          occurredAt: new Date('2026-09-12T10:00:00Z'),
        },
        {
          organisationId: org.id,
          siteId: site1.id,
          type: 'Electrical inspection',
          summary: 'PAT testing of portable appliances completed, all passed.',
          createdByName: 'External (Volt Ltd)',
          occurredAt: new Date('2026-09-05T09:00:00Z'),
        },
      ],
    });
    console.log('Seeded sample logbook entries.');
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
