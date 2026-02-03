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

    try {
        if (!orderItems || orderItems.length === 0) {
            res.status(400);
            throw new Error('No order items');
        }

        const createdOrders = [];

        // Transaction check safety
        for (const item of orderItems) {
            const product = await Product.findById(item.product);

            if (!product) {
                res.status(404);
                throw new Error(`Producto no encontrado: ${item.name}`);
            }

            // Safe validation for variants
            if (item.variants && Object.keys(item.variants).length > 0) {

                // Safety check: Product MUST have combinations array
                if (!product.combinations || !Array.isArray(product.combinations)) {
                    // If product has no combinations but user selected variants, logic mismatch fallback
                    // Just deduct main stock or throw error? Let's throw helpful error
                    if (product.stock < item.qty) {
                        res.status(400);
                        throw new Error(`Stock insuficiente para ${product.name}`);
                    }
                    product.stock -= item.qty;
                    console.warn(`Product ${product.name} has no combinations but variants were requested. Deducted main stock.`);
                } else {
                    // Normal Variant Logic
                    const combination = product.combinations.find(c => {
                        try {
                            const comboValues = c.values instanceof Map ? Object.fromEntries(c.values) : (c.values || {});
                            const keysA = Object.keys(item.variants);
                            const keysB = Object.keys(comboValues);
                            if (keysA.length !== keysB.length) return false;
                            return keysA.every(key => String(comboValues[key]) === String(item.variants[key]));
                        } catch (err) {
                            return false;
                        }
                    });

                    if (!combination) {
                        res.status(400);
                        throw new Error(`Variante no disponible: ${Object.values(item.variants).join('/')}`);
                    }

                    if (combination.stock < item.qty) {
                        res.status(400);
                        throw new Error(`Stock insuficiente para ${product.name} (${Object.values(item.variants).join('/')}). Disponible: ${combination.stock}`);
                    }

                    // Deduct stock
                    combination.stock -= item.qty;
                    product.stock -= item.qty; // Keep sync
                }

            } else {
                // Main product stock check
                if (product.stock < item.qty) {
                    res.status(400);
                    throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);
                }
                product.stock -= item.qty;
            }

            await product.save();
        }

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

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);

    } catch (error) {
        console.error('CRITICAL ORDER ERROR:', error);
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        // Ensure we send JSON, not let express default HTML handler take over if possible
        res.json({
            message: error.message || 'Error interno del servidor procesando el pedido.',
            stack: process.env.NODE_ENV === 'production' ? null : error.stack
        });
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

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    console.log('--- getMyOrders Request ---');
    console.log('User ID from Token:', req.user._id);

    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    console.log(`Found ${orders.length} orders for user ${req.user._id}`);
    res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    console.log('--- getOrders (Admin) Request ---');
    const orders = await Order.find({}).populate('user', 'id name').sort({ createdAt: -1 });
    console.log(`Found total ${orders.length} orders`);
    res.json(orders);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.status = req.body.status;

        if (req.body.status === 'delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        } else {
            order.isDelivered = false;
            order.deliveredAt = null;
        }

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
    updateOrderStatus,
    getMyOrders,
    getOrders,
};
