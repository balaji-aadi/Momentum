import { PamphletSyncService } from './pamphletSync.service.js';

export const getDsaPamphlet = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id || '6993047f16e85ff3e4efd9a3'; // Fallback to current user ID if token middleware passes ID differently
        const data = await PamphletSyncService.syncUserPamphlet(userId.toString());
        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('[PamphletController] Error getting DSA Pamphlet:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch DSA Pamphlet data',
            error: error.message
        });
    }
};

export const syncDsaPamphlet = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id || '6993047f16e85ff3e4efd9a3';
        const data = await PamphletSyncService.syncUserPamphlet(userId.toString());
        return res.status(200).json({
            success: true,
            message: 'DSA Pamphlet synced across all arenas successfully',
            data
        });
    } catch (error) {
        console.error('[PamphletController] Error syncing DSA Pamphlet:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to sync DSA Pamphlet',
            error: error.message
        });
    }
};
