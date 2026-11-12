const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const uploadBuyerPhoto = require("../middleware/uploadBuyerPhoto");

const {
  models,
  getAll,
  getOne,
  create,
  update,
  remove,
  getActivity,
} = require("../Controllers/crudController");

const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} = require("../Controllers/ordersController");

router.use(protect);

// GENERIC CRUD ROUTES
Object.entries(models).forEach(([route, model]) => {
  const entity = route.charAt(0).toUpperCase() + route.slice(1);

  // Orders use their own controller.
  if (route === "orders") return;

router.get(`/${route}`, getAll(model, entity));
router.get(`/${route}/:id`, getOne(model, entity));

  if (route === "buyers") {
    router.post(`/${route}`, uploadBuyerPhoto, create(model, entity));
    router.put(`/${route}/:id`, uploadBuyerPhoto, update(model, entity));
  } else {
    router.post(`/${route}`, create(model, entity));
    router.put(`/${route}/:id`, update(model, entity));
  }

  router.delete(
    `/${route}/:id`,
    authorize("admin"),
    remove(model, entity)
  );
});

// CUSTOM ORDER ROUTES
router.get("/orders", getOrders);
router.get("/orders/:id", getOrder);
router.post("/orders", createOrder);
router.put("/orders/:id", updateOrder);
router.delete("/orders/:id", authorize("admin"), deleteOrder);

// ACTIVITY
router.get("/activity", getActivity);

module.exports = router;