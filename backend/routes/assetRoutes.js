const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getAssets,
    getAsset,
    getAssetBySerial,
    createAsset,
    updateAsset,
    deleteAsset,
    addDamageReport,
    getDamagedAssets,
    getAssetStatistics
} = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/assets/statistics
 * @desc    Get asset statistics
 * @access  Private
 */
router.get('/statistics', getAssetStatistics);

/**
 * @route   GET /api/assets/damaged
 * @desc    Get damaged assets
 * @access  Private
 */
router.get('/damaged', getDamagedAssets);

/**
 * @route   GET /api/assets/serial/:serialNumber
 * @desc    Get asset by serial number
 * @access  Private
 */
router.get('/serial/:serialNumber', getAssetBySerial);

/**
 * @route   GET /api/assets
 * @desc    Get all assets
 * @access  Private
 */
router.get('/', getAssets);

/**
 * @route   GET /api/assets/:id
 * @desc    Get single asset
 * @access  Private
 */
router.get('/:id', getAsset);

/**
 * @route   POST /api/assets
 * @desc    Create new asset
 * @access  Private (admin/adminOfficer only)
 */
router.post(
    '/',
    authorize('admin', 'adminOfficer'),
    [
        body('name').trim().notEmpty().withMessage('Asset name is required'),
        body('category').notEmpty().withMessage('Category is required'),
        body('department').notEmpty().withMessage('Department is required'),
        body('purchaseDate').isISO8601().withMessage('Valid purchase date is required'),
        body('purchaseCost').isNumeric().withMessage('Purchase cost must be a number'),
        body('location').trim().notEmpty().withMessage('Location is required'),
        validate
    ],
    createAsset
);

/**
 * @route   PUT /api/assets/:id
 * @desc    Update asset
 * @access  Private (admin/adminOfficer only)
 */
router.put('/:id', authorize('admin', 'adminOfficer'), updateAsset);

/**
 * @route   DELETE /api/assets/:id
 * @desc    Delete asset
 * @access  Private (admin only)
 */
router.delete('/:id', authorize('admin'), deleteAsset);

/**
 * @route   POST /api/assets/:id/damage
 * @desc    Add damage report
 * @access  Private
 */
router.post(
    '/:id/damage',
    [
        body('damageLevel').isIn(['saaid', 'dhex-dhexaad', 'iska-roon']).withMessage('Invalid damage level'),
        body('damagePercentage').isNumeric().withMessage('Damage percentage must be a number'),
        body('location').trim().notEmpty().withMessage('Location is required'),
        body('description').trim().notEmpty().withMessage('Description is required'),
        validate
    ],
    addDamageReport
);

module.exports = router;
