const {
    Crop,
    Order,
    Buyer,
    Task,
    Expense,
    Inventory,
    Worker,
    Attendance,
    Equipment,
    Maintenance,
    Activity
} = require("../Model");

const models = {
    crops: Crop,
    orders: Order,
    buyers: Buyer,
    tasks: Task,
    expenses: Expense,
    inventory: Inventory,
    workers: Worker,
    attendance: Attendance,
    equipment: Equipment,
    maintenance: Maintenance
};

const logActivity = async (req, action, entity, entityId) => {
    try {
        await Activity.create({
            userId: req.user.id,
            action,
            entity,
            entityId
        });
    } catch (error) {
        console.error("Activity logging failed:", error.message);
    }
};

const getAll = (model, entity) => async (req, res) => {
    try {
        const records = await model.findAll({
            order: [["createdAt", "DESC"]]
        });

        res.status(200).json({
            succeeded: true,
            message: `${entity} retrieved successfully`,
            data: records
        });
    } catch (error) {
        res.status(500).json({
            succeeded: false,
            message: error.message,
            data: null
        });
    }
};

const getOne = (model, entity) => async (req, res) => {
    try {
        const record = await model.findByPk(req.params.id);

        if (!record) {
            return res.status(404).json({
                succeeded: false,
                message: `${entity} not found`,
                data: null
            });
        }

        res.json({
            succeeded: true,
            message: `${entity} retrieved successfully`,
            data: record
        });
    } catch (error) {
        res.status(500).json({
            succeeded: false,
            message: error.message,
            data: null
        });
    }
};

const create = (model, entity) => async (req, res) => {
    try {
        const record = await model.create(req.body);

        await logActivity(req, "add", entity, record.id);

        res.status(201).json({
            succeeded: true,
            message: `${entity} created successfully`,
            data: record
        });
    } catch (error) {
        res.status(400).json({
            succeeded: false,
            message: error.message,
            data: null
        });
    }
};

const update = (model, entity) => async (req, res) => {
    try {
        const record = await model.findByPk(req.params.id);

        if (!record) {
            return res.status(404).json({
                succeeded: false,
                message: `${entity} not found`,
                data: null
            });
        }

        await record.update(req.body);

        await logActivity(req, "edit", entity, record.id);

        res.json({
            succeeded: true,
            message: `${entity} updated successfully`,
            data: record
        });
    } catch (error) {
        res.status(400).json({
            succeeded: false,
            message: error.message,
            data: null
        });
    }
};

const remove = (model, entity) => async (req, res) => {
    try {
        const record = await model.findByPk(req.params.id);

        if (!record) {
            return res.status(404).json({
                succeeded: false,
                message: `${entity} not found`,
                data: null
            });
        }

        await record.destroy();

        await logActivity(req, "delete", entity, req.params.id);

        res.json({
            succeeded: true,
            message: `${entity} deleted successfully`,
            data: null
        });
    } catch (error) {
        res.status(500).json({
            succeeded: false,
            message: error.message,
            data: null
        });
    }
};

const getActivity = async (req, res) => {
    try {
        const records = await Activity.findAll({
            order: [["timestamp", "DESC"]]
        });

        res.json({
            succeeded: true,
            message: "Activity log retrieved successfully",
            data: records
        });
    } catch (error) {
        res.status(500).json({
            succeeded: false,
            message: error.message,
            data: null
        });
    }
};

module.exports = {
    models,
    getAll,
    getOne,
    create,
    update,
    remove,
    getActivity
};