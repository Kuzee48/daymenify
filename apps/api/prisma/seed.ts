import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Users
  { name: 'users.read', module: 'users', action: 'read', description: 'View users' },
  { name: 'users.create', module: 'users', action: 'create', description: 'Create users' },
  { name: 'users.update', module: 'users', action: 'update', description: 'Update users' },
  { name: 'users.delete', module: 'users', action: 'delete', description: 'Delete users' },
  { name: 'users.ban', module: 'users', action: 'ban', description: 'Ban/suspend users' },
  // Products
  { name: 'products.read', module: 'products', action: 'read', description: 'View products' },
  { name: 'products.create', module: 'products', action: 'create', description: 'Create products' },
  { name: 'products.update', module: 'products', action: 'update', description: 'Update products' },
  { name: 'products.delete', module: 'products', action: 'delete', description: 'Delete products' },
  { name: 'products.sync', module: 'products', action: 'sync', description: 'Sync products from provider' },
  // Transactions
  { name: 'transactions.read', module: 'transactions', action: 'read', description: 'View transactions' },
  { name: 'transactions.update', module: 'transactions', action: 'update', description: 'Update transactions' },
  { name: 'transactions.retry', module: 'transactions', action: 'retry', description: 'Retry failed transactions' },
  { name: 'transactions.refund', module: 'transactions', action: 'refund', description: 'Process refunds' },
  // Providers
  { name: 'providers.read', module: 'providers', action: 'read', description: 'View providers' },
  { name: 'providers.manage', module: 'providers', action: 'manage', description: 'Manage providers' },
  // Payments
  { name: 'payments.read', module: 'payments', action: 'read', description: 'View payment gateways' },
  { name: 'payments.manage', module: 'payments', action: 'manage', description: 'Manage payment gateways' },
  // Settings
  { name: 'settings.read', module: 'settings', action: 'read', description: 'View settings' },
  { name: 'settings.manage', module: 'settings', action: 'manage', description: 'Manage settings' },
  // CMS
  { name: 'cms.banners', module: 'cms', action: 'banners', description: 'Manage banners' },
  { name: 'cms.articles', module: 'cms', action: 'articles', description: 'Manage articles' },
  { name: 'cms.announcements', module: 'cms', action: 'announcements', description: 'Manage announcements' },
  // Audit
  { name: 'audit.read', module: 'audit', action: 'read', description: 'View audit logs' },
  // Analytics
  { name: 'analytics.dashboard', module: 'analytics', action: 'dashboard', description: 'View dashboard' },
];

const ROLES = [
  {
    name: 'super_admin',
    displayName: 'Super Admin',
    description: 'Full system access',
    isSystem: true,
    permissions: PERMISSIONS.map((p) => p.name), // all permissions
  },
  {
    name: 'admin',
    displayName: 'Admin',
    description: 'Operations management',
    isSystem: true,
    permissions: PERMISSIONS.filter(
      (p) => !['users.delete', 'settings.manage'].includes(p.name)
    ).map((p) => p.name),
  },
  {
    name: 'support',
    displayName: 'Support',
    description: 'Customer support',
    isSystem: true,
    permissions: ['users.read', 'transactions.read', 'products.read'],
  },
  {
    name: 'finance',
    displayName: 'Finance',
    description: 'Financial operations',
    isSystem: true,
    permissions: ['transactions.read', 'transactions.refund', 'analytics.dashboard', 'payments.read'],
  },
  {
    name: 'customer',
    displayName: 'Customer',
    description: 'Regular user',
    isSystem: true,
    permissions: [], // No admin permissions
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Create permissions
  console.log('  Creating permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  // Create roles with permissions
  console.log('  Creating roles...');
  for (const roleData of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        displayName: roleData.displayName,
        description: roleData.description,
      },
      create: {
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        isSystem: roleData.isSystem,
      },
    });

    // Assign permissions to role
    for (const permName of roleData.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permName },
      });
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }

  console.log('✅ Seeding complete!');
  console.log(`   ${PERMISSIONS.length} permissions created`);
  console.log(`   ${ROLES.length} roles created`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
