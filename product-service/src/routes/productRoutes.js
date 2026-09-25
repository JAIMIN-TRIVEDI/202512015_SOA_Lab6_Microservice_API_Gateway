const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// REST Endpoints as per Lab 6 Specification
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
