const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const category = req.query.category;
    let query = {};

    if (category && category !== 'all') {
        query.category = category;
    }

    const products = await Product.find(query);
    res.json(products);
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        price,
        description,
        images,
        category,
        stock,
        attributes,
        combinations
    } = req.body;

    const product = new Product({
        name,
        price,
        user: req.user._id,
        images: images || [],
        category,
        countInStock: stock, // Keeping for backward compatibility if needed, but 'stock' is main
        stock,
        numReviews: 0,
        description,
        attributes,
        combinations
    });

    console.log('--- Creating Product ---');
    console.log('Payload:', req.body);

    // Create unique slug
    let slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    // Check if slug exists
    const slugExists = await Product.findOne({ slug });
    if (slugExists) {
        slug = `${slug}-${Date.now()}`;
    }
    product.slug = slug;

    const createdProduct = await product.save();
    console.log('Product Saved:', createdProduct._id);
    res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const {
        name,
        slug,
        price,
        description,
        images,
        category,
        stock,
        attributes,
        combinations,
        specs,
        sizes,
        colors
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = name || product.name;
        product.slug = slug || product.slug;
        product.price = price || product.price;
        product.description = description || product.description;
        product.images = images || product.images;
        product.category = category || product.category;
        product.stock = stock !== undefined ? stock : product.stock;
        product.attributes = attributes || product.attributes;
        product.combinations = combinations || product.combinations;

        // Dynamic optional fields
        if (specs) product.specs = specs;
        if (sizes) product.sizes = sizes;
        if (colors) product.colors = colors;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        await product.remove();
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
