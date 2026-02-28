const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Private
 */
router.get('/', getCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category
 * @access  Private
 */
router.get('/:id', getCategory);

/**
 * @route   POST /api/categories
 * @desc    Create category
 * @access  Private (admin/adminOfficer only)
 */
router.post(
    '/',
    authorize('admin', 'adminOfficer'),
    [
        body('name').trim().notEmpty().withMessage('Category name is required'),
        validate
    ],
    createCategory
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (admin/adminOfficer only)
 */
router.put('/:id', authorize('admin', 'adminOfficer'), updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private (admin only)
 */
router.delete('/:id', authorize('admin', 'adminOfficer'), deleteCategory);

module.exports = router;
