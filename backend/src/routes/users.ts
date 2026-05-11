import express, { type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { createAuditLog } from "../services/auditService.js";
import { sendInvitationEmail } from "../services/email.service.js";
const router = express.Router();

// Get All Staff for Tenant
router.get("/staff", authenticateToken, requirePermission("STAFF.READ"), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
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
        user_user_reportingManagerIdTouser: true
      }
    });

    const formattedStaff = staff.map(u => ({
      ...u,
      role: u.userrole.map(ur => ur.role.name).join(", "),
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
    const tenantId = req.user!.tenantId;
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
        name: role.toUpperCase(),
        OR: [{ tenantId }, { tenantId: null, isSystem: true }]
      }
    });

    if (!roleToAssign) {
      console.log("[DEBUG] Validation failed: Role not found in DB", { role: role.toUpperCase(), tenantId });
      return res.status(400).json({ error: "Invalid role selected" });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        mobile,
        role: role.toUpperCase() as any,
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
        reportingManagerId,
        createdById: req.user!.userId,
        inviteToken,
        inviteTokenExpires,
        userrole: {
          create: {
            roleId: roleToAssign.id
          }
        }
      }
    });

    // Send Invitation Email
    try {
      await sendInvitationEmail(email, name, inviteToken, tenant?.businessName || "Your Pharmacy");
    } catch (emailError) {
      console.error("[Staff Creation] Failed to send invitation email:", emailError);
      // We don't fail the whole request but log it
    }

    // Production-Grade: Audit Logging
    await createAuditLog(req.user!.userId, "STAFF", "CREATE", newUser.id, {
      name: newUser.name,
      role: role.toUpperCase(),
      employeeId: newUser.employeeId
    });

    res.json({ 
      success: true, 
      message: "Staff invited successfully. An email has been sent to set up their account.",
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
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
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
          name: role.toUpperCase(),
          OR: [{ tenantId }, { tenantId: null, isSystem: true }]
        }
      });
      if (roleToAssign) roleToAssignId = roleToAssign.id;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { 
        name, 
        email, 
        mobile, 
        isActive,
        employeeId,
        department,
        designation,
        employmentType: employmentType || 'FULL_TIME',
        joinDate: joinDate ? new Date(joinDate) : undefined,
        salary: (salary !== "" && salary !== null && salary !== undefined) ? parseFloat(salary) : null,
        workShift,
        role: role ? (role.toUpperCase() as any) : undefined,
        reportingManagerId: reportingManagerId || null,
        ...(roleToAssignId && {
          userrole: {
            deleteMany: {},
            create: { roleId: roleToAssignId }
          }
        })
      },
      include: {
        userrole: { include: { role: true } }
      }
    });

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
      const field = error.meta?.target || "Field";
      return res.status(400).json({ error: `${field} already exists` });
    }
    console.error("[Staff Update Error]:", error);
    res.status(500).json({ error: "Failed to update staff" });
  }
});

// Delete Staff
router.delete("/staff/:id", authenticateToken, requirePermission("STAFF.DELETE"), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

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
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

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
      data: { inviteToken, inviteTokenExpires }
    });

    await sendInvitationEmail(staff.email, staff.name, inviteToken, staff.tenant?.businessName || "Your Pharmacy");

    res.json({ message: "Invitation resent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to resend invitation" });
  }
});

export default router;
