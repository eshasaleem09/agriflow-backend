const { sequelize } = require("../db");
const { Crop, Order, Activity } = require("../Model");

// GET ALL ORDERS
const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      succeeded: true,
      message: "Orders retrieved successfully",
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// GET SINGLE ORDER
const getOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        succeeded: false,
        message: "Order not found",
        data: null,
      });
    }

    res.json({
      succeeded: true,
      message: "Order retrieved successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// CREATE ORDER AND DEDUCT CROP STOCK
const createOrder = async (req, res) => {
  try {
    const { customer, cropId, quantity, status, orderDate } = req.body;

    if (!customer || !cropId || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({
        succeeded: false,
        message: "Customer, crop and a valid positive quantity are required",
        data: null,
      });
    }

    const newOrder = await sequelize.transaction(async (transaction) => {
      const crop = await Crop.findByPk(cropId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!crop) {
        const error = new Error("Crop not found");
        error.statusCode = 404;
        throw error;
      }

      const availableStock = Number(crop.expectedQty || 0);
      const requestedQuantity = Number(quantity);

      if (availableStock < requestedQuantity) {
        const error = new Error(
          `Insufficient stock. Available quantity: ${availableStock}`
        );
        error.statusCode = 400;
        throw error;
      }

      await crop.update(
        {
          expectedQty: availableStock - requestedQuantity,
        },
        { transaction }
      );

      const order = await Order.create(
        {
          customer,
          crop: crop.name,
          cropId: crop.id,
          quantity: requestedQuantity,
          orderDate: orderDate || new Date().toISOString().slice(0, 10),
          status: status || "Pending",
          stockDeducted: true,
        },
        { transaction }
      );

      await Activity.create(
        {
          userId: req.user.id,
          action: "add",
          entity: "Order",
          entityId: order.id,
        },
        { transaction }
      );

      return order;
    });

    res.status(201).json({
      succeeded: true,
      message: "Order created and crop stock deducted successfully",
      data: newOrder,
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// UPDATE ORDER
const updateOrder = async (req, res) => {
  try {
    const updatedOrder = await sequelize.transaction(async (transaction) => {
      const order = await Order.findByPk(req.params.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }

      const allowedUpdates = {};

      if (req.body.customer !== undefined) {
        allowedUpdates.customer = req.body.customer;
      }

      if (req.body.status !== undefined) {
        allowedUpdates.status = req.body.status;
      }

      if (req.body.orderDate !== undefined) {
        allowedUpdates.orderDate = req.body.orderDate;
      }

      await order.update(allowedUpdates, { transaction });

      await Activity.create(
        {
          userId: req.user.id,
          action: "edit",
          entity: "Order",
          entityId: order.id,
        },
        { transaction }
      );

      return order;
    });

    res.json({
      succeeded: true,
      message: "Order updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// DELETE ORDER AND RESTORE STOCK WHEN APPROPRIATE
const deleteOrder = async (req, res) => {
  try {
    await sequelize.transaction(async (transaction) => {
      const order = await Order.findByPk(req.params.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }

      if (order.stockDeducted && order.status !== "Delivered") {
        const crop = await Crop.findByPk(order.cropId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (crop) {
          await crop.update(
            {
              expectedQty:
                Number(crop.expectedQty || 0) + Number(order.quantity),
            },
            { transaction }
          );
        }
      }

      await Activity.create(
        {
          userId: req.user.id,
          action: "delete",
          entity: "Order",
          entityId: order.id,
        },
        { transaction }
      );

      await order.destroy({ transaction });
    });

    res.json({
      succeeded: true,
      message: "Order deleted successfully",
      data: null,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
};