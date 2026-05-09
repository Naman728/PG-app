import "dotenv/config";
import {
  BedStatus,
  OrgRole,
  TenantLifecycleStatus,
  UserRole,
} from "@prisma/client";
import { hashPassword } from "../modules/auth/password.util.js";
import { prisma } from "./client.js";

/** 15_000 INR in minor units (paise). */
const DEMO_RENT_MINOR = 1_500_000;

async function ensureDemoProperty(organizationId: string) {
  const floors = await prisma.floor.count({
    where: { organizationId, deletedAt: null },
  });
  if (floors > 0) {
    console.log("Demo property: property already has floors, skip layout seed.");
    return;
  }

  const floor = await prisma.floor.create({
    data: { organizationId, name: "Ground", sortOrder: 0 },
  });
  const room = await prisma.room.create({
    data: { floorId: floor.id, name: "101", sortOrder: 0 },
  });
  await prisma.bed.create({
    data: {
      roomId: room.id,
      label: "A",
      monthlyRentMinor: DEMO_RENT_MINOR,
      status: BedStatus.VACANT,
    },
  });
  await prisma.bed.create({
    data: {
      roomId: room.id,
      label: "B",
      monthlyRentMinor: DEMO_RENT_MINOR,
      status: BedStatus.VACANT,
    },
  });
  console.log("Demo property: floor, room, and beds created.");
}

async function ensureDemoTenantUser(organizationId: string, tenantPhone: string) {
  const tenantUser = await prisma.user.upsert({
    where: { phone: tenantPhone },
    create: {
      phone: tenantPhone,
      name: "Demo Tenant",
      role: UserRole.TENANT,
      phoneVerified: true,
    },
    update: {
      phoneVerified: true,
      role: UserRole.TENANT,
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: { organizationId, userId: tenantUser.id },
    },
    create: {
      organizationId,
      userId: tenantUser.id,
      orgRole: OrgRole.TENANT,
    },
    update: { orgRole: OrgRole.TENANT },
  });

  await prisma.tenant.upsert({
    where: { organizationId_userId: { organizationId, userId: tenantUser.id } },
    create: {
      organizationId,
      userId: tenantUser.id,
      status: TenantLifecycleStatus.ACTIVE,
      onboardedAt: new Date(),
    },
    update: { status: TenantLifecycleStatus.ACTIVE },
  });

  const bed = await prisma.bed.findFirst({
    where: {
      room: { floor: { organizationId, deletedAt: null }, deletedAt: null },
      deletedAt: null,
      tenantUserId: null,
    },
    orderBy: { createdAt: "asc" },
  });
  if (bed) {
    await prisma.bed.update({
      where: { id: bed.id },
      data: {
        tenantUserId: tenantUser.id,
        status: BedStatus.OCCUPIED_PAID,
        assignedAt: new Date(),
      },
    });
  }

  console.log("Demo tenant user:", { userId: tenantUser.id, phone: tenantPhone });
}

async function seedEmailOwner(orgName: string) {
  const email = process.env.SEED_OWNER_EMAIL!.trim().toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD!;
  const passwordHash = await hashPassword(password);

  let user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: "Demo Owner",
        role: UserRole.OWNER,
        phoneVerified: false,
      },
    });
    console.log("Seed: created email owner", { userId: user.id, email });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name: user.name ?? "Demo Owner", role: UserRole.OWNER },
    });
    console.log("Seed: using existing email owner", { userId: user.id, email });
  }

  const existingMembership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });

  let organizationId: string;
  if (existingMembership) {
    organizationId = existingMembership.organizationId;
    console.log("Seed: using existing org", { userId: user.id, organizationId });
  } else {
    const org = await prisma.organization.create({
      data: { name: orgName },
    });
    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        orgRole: OrgRole.OWNER,
      },
    });
    organizationId = org.id;
    console.log("Seed: created org", { userId: user.id, organizationId });
  }

  return organizationId;
}

async function seedPhoneOwner(orgName: string, ownerPhone: string) {
  const user = await prisma.user.upsert({
    where: { phone: ownerPhone },
    create: {
      phone: ownerPhone,
      name: "Demo Owner",
      role: UserRole.OWNER,
      phoneVerified: true,
    },
    update: {
      phoneVerified: true,
      role: UserRole.OWNER,
    },
  });

  const existingMembership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });

  let organizationId: string;
  if (existingMembership) {
    organizationId = existingMembership.organizationId;
    console.log("Seed: using existing org", { userId: user.id, organizationId });
  } else {
    const org = await prisma.organization.create({
      data: { name: orgName },
    });
    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        orgRole: OrgRole.OWNER,
      },
    });
    organizationId = org.id;
    console.log("Seed: created org", { userId: user.id, organizationId });
  }

  return { organizationId, ownerPhone };
}

async function main() {
  const orgName = process.env.SEED_ORG_NAME ?? "Demo PG — Indiranagar";
  const ownerEmail = process.env.SEED_OWNER_EMAIL?.trim();
  const ownerPassword = process.env.SEED_OWNER_PASSWORD;
  const ownerPhone = process.env.SEED_OWNER_PHONE?.trim();

  let organizationId: string;
  let ownerPhoneForTenantCompare: string | undefined;

  if (ownerEmail && ownerPassword) {
    organizationId = await seedEmailOwner(orgName);
  } else if (ownerPhone) {
    const r = await seedPhoneOwner(orgName, ownerPhone);
    organizationId = r.organizationId;
    ownerPhoneForTenantCompare = r.ownerPhone;
  } else {
    console.log(
      "Skip seed: set SEED_OWNER_EMAIL + SEED_OWNER_PASSWORD, or SEED_OWNER_PHONE (+E.164).",
    );
    return;
  }

  if (process.env.SEED_DEMO === "1") {
    await ensureDemoProperty(organizationId);
    const tenantPhone = process.env.SEED_TENANT_PHONE?.trim();
    const ownerRef = ownerPhoneForTenantCompare ?? ownerPhone;
    if (tenantPhone && tenantPhone !== ownerRef) {
      await ensureDemoTenantUser(organizationId, tenantPhone);
    } else if (tenantPhone) {
      console.log("SEED_TENANT_PHONE must differ from the owner phone (if any); skipping demo tenant.");
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
