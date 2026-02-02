const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
        return;
    } else {
        // STOCK AUDIT LOGIC
        // We need to iterate over items and check/deduct stock
        // This should be done transactionally or carefully

        for (const item of orderItems) {
            const product = await Product.findById(item.product);

            if (!product) {
                res.status(404);
                throw new Error(`Product not found: ${item.name}`);
            }

            // If it's a variant purchase
            if (item.variants && Object.keys(item.variants).length > 0) {
                // Find matching combination
                const combination = product.combinations.find(c => {
                    // Convert Map to Object for comparison if needed, generally stored as Object in orderItems
                    // In Order model variants is Map, but incoming JSON is object
                    // We assume item.variants is a plain object here from JSON

                    // Comparison logic:
                    // item.variants { Size: "L", Color: "Red" }
                    // combination.values { Size: "L", Color: "Red" } (Stored as Map in DB but hydrated as Map/Object)

                    // Simple approach: Check if every key/val matches
                    const comboValues = combination.values instanceof Map ? Object.fromEntries(combination.values) : combination.values;

                    // Compare keys lengths first
                    const keysA = Object.keys(item.variants);
                    const keysB = Object.keys(comboValues);
                    if (keysA.length !== keysB.length) return false;

                    return keysA.every(key => comboValues[key] === item.variants[key]);
                });

                if (!combination) {
                    res.status(400);
                    throw new Error(`Variant not found for product ${product.name}`);
                }

                if (combination.stock < item.qty) {
                    res.status(400);
                    throw new Error(`Not enough stock for ${product.name} (Variant). Available: ${combination.stock}`);
                }

                // Deduct stock form variant
                combination.stock -= item.qty;

                // Deduct from total stock as well
                product.stock -= item.qty;

            } else {
                // Main product stock check (no variants)
                if (product.stock < item.qty) {
                    res.status(400);
                    throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}`);
                }
                product.stock -= item.qty;
            }

            // Save product with updated stock
            await product.save();
        }

        // If we survived the validation loop, create the order
        const order = new Order({
            orderItems,
            user: req.user._id,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
        });

        console.log('--- Creating Order ---');
        console.log('User:', req.user._id);
        console.log('Total Price:', totalPrice);

        const createdOrder = await order.save();
        console.log('Order Saved:', createdOrder._id);

        res.status(201).json(createdOrder);
    }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
        'user',
        'name email'
    );

    if (order) {
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.email_address,
        };

        const updatedOrder = await order.save();

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

module.exports = {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
};
