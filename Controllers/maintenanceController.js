const { Op } = require("sequelize");
const { sequelize } = require("../db");

const {
  Maintenance,
  Expense,
  Equipment,
  Activity,
} = require("../Model");

// Validate maintenance data
const validateMaintenance = (data) => {
  const { equipmentId, date, description, cost, performedBy } = data;

  if (
    !equipmentId ||
    !date ||
    typeof description !== "string" ||
    !description.trim() ||
    typeof performedBy !== "string" ||
    !performedBy.trim()
  ) {
    throw new Error("All maintenance fields are required.");
  }

  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    throw new Error("Please provide a valid maintenance date.");
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    throw new Error("Please provide a valid maintenance date.");
  }

  if (!Number.isFinite(Number(cost)) || Number(cost) <= 0) {
    throw new Error("Maintenance cost must be greater than zero.");
  }
};

// Generate linked expense data
const createExpensePayload = (record) => {
  const marker = `[maintenance:${record.id}]`;

  return {
    cropId: null,
    type: "Expense",
    category: "Repair",
    amount: Number(record.cost),
    date: record.date,
    note: `${marker} Equipment maintenance: ${record.description}`,
  };
};

// Find expenses linked to a maintenance record
const findLinkedExpenses = (recordId, transaction) => {
  const marker = `[maintenance:${recordId}]`;

  return Expense.findAll({
    where: {
      note: {
        [Op.like]: `%${marker}%`,
      },
    },
    transaction,
  });
};

// Record activity inside the transaction
const logMaintenanceActivity = async (
  req,
  action,
  maintenanceId,
  transaction
) => {
  await Activity.create(
    {
      userId: req.user.id,
      action,
      entity: "Maintenance",
      entityId: maintenanceId,
    },
    { transaction }
  );
};

// CREATE MAINTENANCE
const createMaintenance = async (req, res) => {
  try {
    const newRecord = await sequelize.transaction(async (transaction) => {
      validateMaintenance(req.body);

      const equipment = await Equipment.findByPk(
        req.body.equipmentId,
        { transaction }
      );

      if (!equipment) {
        const error = new Error("Selected equipment does not exist.");
        error.statusCode = 404;
        throw error;
      }

      const record = await Maintenance.create(
        {
          equipmentId: req.body.equipmentId,
          date: req.body.date,
          description: req.body.description.trim(),
          cost: Number(req.body.cost),
          performedBy: req.body.performedBy.trim(),
        },
        { transaction }
      );

      const expense = await Expense.create(
        createExpensePayload(record),
        { transaction }
      );

      await logMaintenanceActivity(
        req,
        "add",
        record.id,
        transaction
      );

      return {
        maintenance: record,
        expenses: [expense],
      };
    });

    return res.status(201).json({
      succeeded: true,
      message: "Maintenance and linked expense created successfully.",
      data: newRecord,
    });
  } catch (error) {
    console.error("Maintenance creation failed:", error);

    return res.status(error.statusCode || 500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// UPDATE MAINTENANCE
const updateMaintenance = async (req, res) => {
  try {
    const updatedRecord = await sequelize.transaction(async (transaction) => {
      validateMaintenance(req.body);

      const record = await Maintenance.findByPk(req.params.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!record) {
        const error = new Error("Maintenance record not found.");
        error.statusCode = 404;
        throw error;
      }

      const equipment = await Equipment.findByPk(
        req.body.equipmentId,
        { transaction }
      );

      if (!equipment) {
        const error = new Error("Selected equipment does not exist.");
        error.statusCode = 404;
        throw error;
      }

      await record.update(
        {
          equipmentId: req.body.equipmentId,
          date: req.body.date,
          description: req.body.description.trim(),
          cost: Number(req.body.cost),
          performedBy: req.body.performedBy.trim(),
        },
        { transaction }
      );

      const linkedExpenses = await findLinkedExpenses(
        record.id,
        transaction
      );

      const updatedExpenses = [];

      if (linkedExpenses.length > 0) {
        for (const expense of linkedExpenses) {
          await expense.update(
            createExpensePayload(record),
            { transaction }
          );

          updatedExpenses.push(expense);
        }
      } else {
        const expense = await Expense.create(
          createExpensePayload(record),
          { transaction }
        );

        updatedExpenses.push(expense);
      }

      await logMaintenanceActivity(
        req,
        "edit",
        record.id,
        transaction
      );

      return {
        maintenance: record,
        expenses: updatedExpenses,
      };
    });

    return res.status(200).json({
      succeeded: true,
      message: "Maintenance and linked expense updated successfully.",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("Maintenance update failed:", error);

    return res.status(error.statusCode || 500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// DELETE MAINTENANCE
const deleteMaintenance = async (req, res) => {
  try {
    const deletedExpenseIds = await sequelize.transaction(
      async (transaction) => {
        const record = await Maintenance.findByPk(req.params.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!record) {
          const error = new Error("Maintenance record not found.");
          error.statusCode = 404;
          throw error;
        }

        const linkedExpenses = await findLinkedExpenses(
          record.id,
          transaction
        );

        const expenseIds = linkedExpenses.map(
          (expense) => expense.id
        );

        for (const expense of linkedExpenses) {
          await expense.destroy({ transaction });
        }

        await record.destroy({ transaction });

        await logMaintenanceActivity(
          req,
          "delete",
          record.id,
          transaction
        );

        return expenseIds;
      }
    );

    return res.status(200).json({
      succeeded: true,
      message: "Maintenance and linked expense deleted successfully.",
      data: {
        deletedExpenseIds,
      },
    });
  } catch (error) {
    console.error("Maintenance deletion failed:", error);

    return res.status(error.statusCode || 500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

module.exports = {
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
};