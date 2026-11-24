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
const {
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
} = require("../Controllers/maintenanceController");

router.use(protect);

// GENERIC CRUD ROUTES
// GENERIC CRUD ROUTES
Object.entries(models).forEach(([route, model]) => {
  const entity = route.charAt(0).toUpperCase() + route.slice(1);

  // Orders use their own controller.
  if (route === "orders" || route === "maintenance") return;

  router.get(`/${route}`, getAll(model, entity));
  router.get(`/${route}/:id`, getOne(model, entity));

  // CREATE
  if (route === "buyers") {
    router.post(`/${route}`, uploadBuyerPhoto, create(model, entity));
  } else {
    router.post(`/${route}`, create(model, entity));
  }

  // UPDATE
  if (route === "buyers") {
    router.put(
      `/${route}/:id`,
      authorize("admin"),
      uploadBuyerPhoto,
      update(model, entity)
    );
  } else {
    router.put(
      `/${route}/:id`,
      authorize("admin"),
      update(model, entity)
    );
  }

  // DELETE — Admin only
  router.delete(
    `/${route}/:id`,
    authorize("admin"),
    remove(model, entity)
  );
});
// MAINTENANCE ROUTES
router.get("/maintenance", getAll(models.maintenance, "Maintenance"));
router.get("/maintenance/:id", getOne(models.maintenance, "Maintenance"));

router.post(
  "/maintenance",
  authorize("admin"),
  createMaintenance
);

router.put(
  "/maintenance/:id",
  authorize("admin"),
  updateMaintenance
);

router.delete(
  "/maintenance/:id",
  authorize("admin"),
  deleteMaintenance
);
// CUSTOM ORDER ROUTES
router.get("/orders", getOrders);
router.get("/orders/:id", getOrder);
router.post("/orders", createOrder);
router.put(
  "/orders/:id",
  authorize("admin"),
  updateOrder
);
router.delete("/orders/:id", authorize("admin"), deleteOrder);

// ACTIVITY
router.get("/activity", getActivity);

module.exports = router;