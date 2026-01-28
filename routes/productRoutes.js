const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { productSchema } = require('../utils/schemas');

router.route('/')
    .get(getProducts)
    .post(protect, admin, validateRequest(productSchema), createProduct);

router.route('/:id')
    .get(getProductById)
    .put(protect, admin, validateRequest(productSchema), updateProduct)
    .delete(protect, admin, deleteProduct);

module.exports = router;
