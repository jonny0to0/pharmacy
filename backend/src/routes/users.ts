import express, { type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { createAuditLog } from "../services/auditService.js";
import { sendInvitationEmail } from "../services/email.service.js";
import { cacheService } from "../services/cache.service.js";
const router = express.Router();

// Get All Staff for Tenant
router.get("/staff", authenticateToken, requirePermission("STAFF.READ"), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId as string;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const staff = await prisma.user.findMany({
      where: { 
        tenantId,
        isDeleted: false
      },
      include: {
        userrole: {
          include: {
            role: true
          }
        },
        userbranch: {
          include: {
            branch: true
          }
        },
        user_user_reportingManagerIdTouser: true
      }
    });

    const formattedStaff = staff.map(u => ({
      ...u,
      role: u.userrole.map(ur => ur.role.name).join(", "),
      branches: u.userbranch.map(ub => ub.branch),
      branchNames: u.userbranch.map(ub => ub.branch.name).join(", ") || "All Branches",
      reportingManagerName: u.user_user_reportingManagerIdTouser?.name
    }));

    res.json(formattedStaff);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

// Add New Staff
router.post("/staff", authenticateToken, requirePermission("STAFF.CREATE"), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId as string;
    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    const { 
      name, email, mobile, role, 
      employeeId, department, designation, 
      employmentType, joinDate, salary, workShift, 
      reportingManagerId 
    } = req.body;

    console.log("[DEBUG] POST /staff request body:", { name, email, mobile, role, tenantId });

    // Validation
    if (!name || !email || !mobile || !role) {
      console.log("[DEBUG] Validation failed: Missing mandatory fields", { name, email, mobile, role });
      return res.status(400).json({ error: "Name, email, mobile and role are required" });
    }

    // Generate Invite Token (24 hours expiry)
    const inviteToken = uuidv4();
    const inviteTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const roleToAssign = await prisma.role.findFirst({
      where: { 
        name: {
          in: [role, role.toUpperCase(), role.toLowerCase()]
        },
        OR: [{ tenantId }, { tenantId: null, isSystem: true }]
      }
    });

    if (!roleToAssign) {
      console.log("[DEBUG] Validation failed: Role not found in DB", { role, tenantId });
      return res.status(400).json({ error: "Invalid role selected" });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    const newUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        name,
        email,
        mobile,
        role: role.toUpperCase(),
        status: "PENDING",
        isInvited: true,
        tenantId,
        employeeId,
        department,
        designation,
        employmentType: employmentType || 'FULL_TIME',
        joinDate: joinDate ? new Date(joinDate) : new Date(),
        salary: salary ? parseFloat(salary) : null,
        workShift,
        reportingManagerId: reportingManagerId || null,
        createdById: req.user!.userId,
        inviteToken,
        inviteTokenExpires,
        updatedAt: new Date(),
        userrole: {
          create: {
            id: uuidv4(),
            roleId: roleToAssign.id
          }
        }
      }
    });

    // Assign Branches
    let assignedBranchIds: string[] = [];
    if (Array.isArray(req.body.branchIds)) {
      assignedBranchIds = req.body.branchIds;
    } else if (typeof req.body.branchId === "string" && req.body.branchId) {
      assignedBranchIds = [req.body.branchId];
    }

    if (assignedBranchIds.length > 0) {
      await prisma.userbranch.createMany({
        data: assignedBranchIds.map(bId => ({
          id: uuidv4(),
          userId: newUser.id,
          branchId: bId
        }))
      });
    }

    // Send Invitation Email
    let emailSent = true;
    try {
      await sendInvitationEmail(email, name, inviteToken, tenant?.businessName || "Your Pharmacy");
    } catch (emailError) {
      console.error("[Staff Creation] Failed to send invitation email:", emailError);
      emailSent = false;
    }

    const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/setup-account?token=${inviteToken}`;

    // Production-Grade: Audit Logging
    await createAuditLog(req.user!.userId, "STAFF", "CREATE", newUser.id, {
      name: newUser.name,
      role: role.toUpperCase(),
      employeeId: newUser.employeeId
    });

    res.json({ 
      success: true, 
      message: emailSent
        ? "Staff invited successfully. An email has been sent to set up their account."
        : "Staff created successfully, but email invitation could not be sent (SMTP error). Copy the invitation link below.",
      emailSent,
      inviteLink: inviteUrl,
      staff: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        status: newUser.status,
        employeeId: newUser.employeeId,
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const field = error.meta?.target || "Field";
      return res.status(400).json({ error: `${field} already exists` });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to create staff" });
  }
});

// Update Staff
router.put("/staff/:id", authenticateToken, requirePermission("STAFF.UPDATE"), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId as string;
    const id = req.params.id as string;
    const { 
      name, email, mobile, role, isActive,
      employeeId, department, designation,
      employmentType, joinDate, salary, workShift,
      reportingManagerId
    } = req.body;

    const staff = await prisma.user.findFirst({
      where: { id, tenantId }
    });

    if (!staff) return res.status(404).json({ error: "Staff not found" });

    let roleToAssignId;
    if (role) {
      const roleToAssign = await prisma.role.findFirst({
        where: { 
          name: {
            in: [role, role.toUpperCase(), role.toLowerCase()]
          },
          OR: [{ tenantId }, { tenantId: null, isSystem: true }]
        }
      });
      if (!roleToAssign) {
        return res.status(400).json({ error: "Invalid role selected" });
      }
      roleToAssignId = roleToAssign.id;
    }

    const updateData: any = {
      name,
      email,
      mobile,
      isActive,
      employeeId: employeeId || null,
      department: department || null,
      designation: designation || null,
      employmentType: employmentType || 'FULL_TIME',
      salary: (salary !== "" && salary !== null && salary !== undefined) ? parseFloat(salary) : null,
      workShift: workShift || null,
      reportingManagerId: reportingManagerId || null,
      updatedAt: new Date()
    };

    if (joinDate) {
      updateData.joinDate = new Date(joinDate);
    }
    if (role) {
      updateData.role = role.toUpperCase();
    }
    if (roleToAssignId) {
      updateData.userrole = {
        deleteMany: {},
        create: {
          id: uuidv4(),
          roleId: roleToAssignId
        }
      };
      updateData.permissionVersion = { increment: 1 };
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        userrole: { include: { role: true } }
      }
    });

    // Update Branches
    let assignedBranchIds: string[] = [];
    if (Array.isArray(req.body.branchIds)) {
      assignedBranchIds = req.body.branchIds;
    } else if (typeof req.body.branchId === "string" && req.body.branchId) {
      assignedBranchIds = [req.body.branchId];
    }

    if (req.body.branchId !== undefined || req.body.branchIds !== undefined) {
      await prisma.userbranch.deleteMany({ where: { userId: id } });
      if (assignedBranchIds.length > 0) {
        await prisma.userbranch.createMany({
          data: assignedBranchIds.map(bId => ({
            id: uuidv4(),
            userId: id,
            branchId: bId
          }))
        });
      }
    }

    // Invalidate user permissions cache
    await cacheService.delete(`user_perms:${id}`);

    // Production-Grade: Audit Logging
    await createAuditLog(req.user!.userId, "STAFF", "UPDATE", updated.id, {
      name: updated.name,
      fieldsUpdated: Object.keys(req.body)
    });

    res.json({ 
      message: "Staff updated successfully", 
      staff: { 
        id: updated.id,
        name: updated.name,
        email: updated.email,
        employeeId: updated.employeeId,
        designation: updated.designation,
        role: updated.userrole.map(ur => ur.role.name).join(", ") 
      } 
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const target = error.meta?.target || "";
      let field = "Field";
      if (target.includes("email")) field = "Email";
      else if (target.includes("mobile")) field = "Mobile number";
      else if (target.includes("employeeId")) field = "Employee ID";
      return res.status(400).json({ error: `${field} already exists` });
    }
    console.error("[Staff Update Error]:", error);
    res.status(500).json({ error: "Failed to update staff" });
  }
});

// Delete Staff
router.delete("/staff/:id", authenticateToken, requirePermission("STAFF.DELETE"), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId as string;
    const id = req.params.id as string;

    const staff = await prisma.user.findFirst({
      where: { id, tenantId }
    });

    if (!staff) return res.status(404).json({ error: "Staff not found" });

    // We do a soft delete to maintain audit integrity
    const deletedStaff = await prisma.user.update({
      where: { id },
      data: { isDeleted: true, isActive: false }
    });

    // Production-Grade: Audit Logging
    await createAuditLog(req.user!.userId, "STAFF", "DELETE", deletedStaff.id, {
      name: deletedStaff.name
    });

    res.json({ message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete staff" });
  }
});

// Resend Invitation
router.post("/staff/:id/resend-invite", authenticateToken, requirePermission("STAFF.CREATE"), async (req: Request, res: Response): Promise<any> => {
  try {
    const tenantId = req.user!.tenantId as string;
    const id = req.params.id as string;

    const staff = await prisma.user.findFirst({
      where: { id, tenantId, status: "PENDING" },
      include: { tenant: true }
    });

    if (!staff) return res.status(404).json({ error: "Pending staff member not found" });

    // Generate New Token
    const inviteToken = uuidv4();
    const inviteTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: staff.id },
      data: { 
        inviteToken, 
        inviteTokenExpires,
        isInvited: true,
        updatedAt: new Date()
      }
    });

    let emailSent = true;
    try {
      await sendInvitationEmail(staff.email, staff.name, inviteToken, staff.tenant?.businessName || "Your Pharmacy");
    } catch (emailError) {
      console.error("[Staff Resend Invitation] Failed to send invitation email:", emailError);
      emailSent = false;
    }

    const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/setup-account?token=${inviteToken}`;

    res.json({ 
      success: true,
      message: emailSent 
        ? "Invitation resent successfully" 
        : "Invitation generated successfully. Copy the link below to set up the account.", 
      inviteLink: inviteUrl,
      emailSent 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to resend invitation" });
  }
});

// Get direct permissions for a staff member
router.get("/staff/:id/permissions", authenticateToken, requirePermission("ROLES.READ"), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    // Verify user belongs to same tenant
    const user = await prisma.user.findFirst({
      where: { id, tenantId }
    });
    if (!user) return res.status(404).json({ error: "Staff member not found" });

    const directPermissions = await prisma.userpermission.findMany({
      where: { userId: id },
      include: { permission: true }
    });

    res.json(directPermissions.map(dp => dp.permissionId));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user permissions" });
  }
});

// Update direct permissions for a staff member
router.put("/staff/:id/permissions", authenticateToken, requirePermission("ROLES.UPDATE"), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const { permissionIds } = req.body; // array of permission IDs

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ error: "permissionIds must be an array" });
    }

    // Verify user belongs to same tenant
    const user = await prisma.user.findFirst({
      where: { id, tenantId }
    });
    if (!user) return res.status(404).json({ error: "Staff member not found" });

    // Get old direct permissions
    const oldDirectPermissions = await prisma.userpermission.findMany({
      where: { userId: id },
      include: { permission: true }
    });
    const oldPermissionNames = oldDirectPermissions.map(dp => dp.permission.name);

    // Get new permissions
    const newPermissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } }
    });
    const newPermissionNames = newPermissions.map(p => p.name);

    const added = newPermissionNames.filter(name => !oldPermissionNames.includes(name));
    const removed = oldPermissionNames.filter(name => !newPermissionNames.includes(name));

    await prisma.$transaction([
      prisma.userpermission.deleteMany({ where: { userId: id } }),
      prisma.userpermission.createMany({
        data: permissionIds.map(pId => ({
          id: uuidv4(),
          userId: id,
          permissionId: pId
        }))
      }),
      prisma.user.update({
        where: { id },
        data: { permissionVersion: { increment: 1 } }
      })
    ]);

    // Invalidate user permissions cache
    await cacheService.delete(`user_perms:${id}`);

    // Audit Log
    await createAuditLog(req.user!.userId, "STAFF", "UPDATE_PERMISSIONS", id, {
      staffName: user.name,
      addedPermissions: added,
      removedPermissions: removed,
      oldValue: oldPermissionNames.join(", "),
      newValue: newPermissionNames.join(", ")
    });

    res.json({ message: "Direct permissions updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update user permissions" });
  }
});

export default router;
