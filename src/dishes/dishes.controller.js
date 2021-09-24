const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function validateDish(req, res, next) {
    const { dishId } = req.params;
    const { data: { id, name, description, price, image_url } } = req.body;
    if (id && id !== dishId) {
        next({ status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}` });
    }
    if (name === undefined || name === "") {
        next({ status: 400, message: "Dish must include a name" });
    } else if (description === undefined || description === "") {
        next({ status: 400, message: "Dish must include a description" });
    } else if (price === undefined) {
        next({ status: 400, message: "Dish must include a price" });
    } else if (price <= 0 || !Number.isInteger(price)) {
        next({ status: 400, message: "Dish must have a price that is an integer greater than 0" });
    } else if (image_url === undefined || image_url === "") {
        next({ status: 400, message: "Dish must include a image_url" });
    } else {
        res.locals.data = req.body.data;
        return next();
    }
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({ status: 404, message: `Dish does not exist: ${dishId}` });
}

function list(req, res) {
    res.json({ data: dishes });
}

function create(req, res) {
    const newDish = {
        id: nextId(),
        ...res.locals.data
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function read(req, res) {
    res.status(200).json({ data: res.locals.dish });
}

function update(req, res) {
    const dish = res.locals.dish;
    const data = res.locals.data;
    dish.name = data.name;
    dish.description = data.description;
    dish.price = data.price;
    dish.image_url = data.image_url;
    res.status(200).json({ data: dish });
}

module.exports = {
    list,
    create: [validateDish, create],
    read: [dishExists, read],
    update: [dishExists, validateDish, update]
};






