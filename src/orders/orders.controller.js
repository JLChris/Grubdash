const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function validateOrder(req, res, next) {
    const { orderId } = req.params;
    const { data: { id, status, deliverTo, mobileNumber, dishes } } = req.body;
    const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
    if (orderId) {
        if (id && id !== orderId) {
            next({
                status: 400,
                message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
            });
        } else if (!validStatus.includes(status)) {
            next({
                status: 400,
                message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
            });
        } else {
            const existingOrder = orders.find(order => order.id === orderId);
            if (existingOrder.status === "delivered") {
                next({ status: 400, message: "A delivered order cannot be changed" });
            }
        }
    }
    if (deliverTo === undefined || deliverTo === "") {
        next({ status: 400, message: "Order must include a deliverTo" });
    } else if (mobileNumber === undefined || mobileNumber === "") {
        next({ status: 400, message: "Order must include a mobileNumber" });
    } else if (dishes === undefined) {
        next({ status: 400, message: "Order must include a dish" });
    } else if (!Array.isArray(dishes) || dishes.length < 1) {
        next({ status: 400, message: "Order must include at least one dish" });
    } else if (!dishes.every(dish => typeof dish.quantity === "number" && dish.quantity > 0)) {
        for (let i = 0; i < dishes.length; i++) {
            const dish = dishes[i];
            const quantity = dish.quantity;
            if (quantity === undefined || quantity < 1 || typeof quantity !== "number") {
                return next({
                    status: 400,
                    message: `Dish ${i} must have a quantity that is an integer greater than 0`
                });
            }
        }
    } else {
        res.locals.data = req.body.data;
        return next();
    }
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({ status: 404, message: `No order found with id: ${orderId}` });
}


function list(req, res) {
    res.status(200).json({ data: orders });
}

function create(req, res) {
    const newOrder = {
        id: nextId(),
        status: "pending",
        ...res.locals.data
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function read(req, res) {
    res.status(200).json({ data: res.locals.order });
}

function update(req, res) {
    const order = res.locals.order;
    const data = res.locals.data;
    order.deliverTo = data.deliverTo;
    order.mobileNumber = data.mobileNumber;
    order.status = data.status;
    order.dishes = data.dishes;
    res.status(200).json({ data: order });
}

function destroy(req, res, next) {
    const order = res.locals.order;
    if (order.status !== "pending") {
        return next({ status: 400, message: "An order cannot be deleted unless it is pending" });
    }
    const index = orders.find(e => e.id === order.id);
    orders.splice(index, 1);
    res.sendStatus(204);
}


module.exports = {
    list,
    create: [validateOrder, create],
    read: [orderExists, read],
    update: [orderExists, validateOrder, update],
    delete: [orderExists, destroy]
}