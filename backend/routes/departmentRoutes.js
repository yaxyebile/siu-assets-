const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/departments
 * @desc    Get all departments
 * @access  Private
 */
router.get('/', getDepartments);

/**
 * @route   GET /api/departments/:id
 * @desc    Get single department
 * @access  Private
 */
router.get('/:id', getDepartment);

/**
 * @route   POST /api/departments
 * @desc    Create department
 * @access  Private (admin/adminOfficer only)
 */
router.post(
    '/',
    authorize('admin', 'adminOfficer'),
    [
        body('name').trim().notEmpty().withMessage('Department name is required'),
        validate
    ],
    createDepartment
);

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department
 * @access  Private (admin/adminOfficer only)
 */
router.put('/:id', authorize('admin', 'adminOfficer'), updateDepartment);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete department
 * @access  Private (admin only)
 */
router.delete('/:id', authorize('admin', 'adminOfficer'), deleteDepartment);

module.exports = router;
