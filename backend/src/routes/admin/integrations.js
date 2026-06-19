import express, {} from "express";
import prisma from "../../db.js";
import { authorizePermission } from "../../middleware/auth.js";
import { sendSuccess } from "../../utils/response.js";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { encrypt, maskKey } from "../../utils/encryption.js";
import { adminCache } from "../../services/AdminCacheService.js";
const router = express.Router();
/**
 * @route   GET /api/v1/admin/integrations
 */
router.get("/", authorizePermission("manage_integrations"), async (req, res) => {
    try {
        const integrations = await prisma.integration.findMany({
            orderBy: { name: 'asc' }
        });
        // Strip keys for the list view
        const data = integrations.map(item => ({
            ...item,
            apiKey: item.apiKey ? maskKey(item.apiKey) : null
        }));
        return sendSuccess(res, data);
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch integrations" });
    }
});
/**
 * @route   POST /api/v1/admin/integrations
 */
router.post("/", authorizePermission("manage_integrations", "FULL"), async (req, res) => {
    try {
        const { name, type, enabled, apiKey, config } = req.body;
        const integration = await prisma.integration.create({
            data: {
                name,
                type,
                enabled,
                apiKey: apiKey ? encrypt(apiKey) : null,
                config
            }
        });
        adminCache.clear();
        return sendSuccess(res, { ...integration, apiKey: apiKey ? maskKey(integration.apiKey) : null }, "Integration created");
    }
    catch (error) {
        if (error.code === 'P2002')
            return res.status(400).json({ success: false, error: "Integration name must be unique" });
        res.status(500).json({ success: false, error: "Failed to create integration" });
    }
});
/**
 * @route   PATCH /api/v1/admin/integrations/:id
 */
router.patch("/:id", authorizePermission("manage_integrations", "FULL"), async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled, apiKey, config } = req.body;
        const integration = await prisma.integration.update({
            where: { id },
            data: {
                enabled,
                apiKey: apiKey ? encrypt(apiKey) : undefined,
                config
            }
        });
        adminCache.clear();
        return sendSuccess(res, { ...integration, apiKey: integration.apiKey ? maskKey(integration.apiKey) : null }, "Integration updated");
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Failed to update integration" });
    }
});
export default router;
//# sourceMappingURL=integrations.js.map