const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");
const User = require("./User");

const id = {
  type: DataTypes.UUID,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
};

// CROPS
const Crop = sequelize.define("Crop", {
  id,
  name: { type: DataTypes.STRING, allowNull: false },
  field: DataTypes.STRING,
  plantingDate: DataTypes.DATEONLY,
  cuttingDate: DataTypes.DATEONLY,
  healthScore: DataTypes.INTEGER,
  status: {
    type: DataTypes.ENUM("Healthy", "Needs Attention", "Critical"),
    defaultValue: "Healthy",
  },
  expectedQty: DataTypes.FLOAT,
  harvestQty: DataTypes.FLOAT,
  createdBy: DataTypes.UUID,
});

// ORDERS
const Order = sequelize.define("Order", {
  id,
  customer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  crop: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cropId: DataTypes.UUID,
  quantity: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  orderDate: DataTypes.DATEONLY,
  status: {
    type: DataTypes.ENUM("Pending", "Processing", "Delivered"),
    defaultValue: "Pending",
  },
  stockDeducted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

// BUYERS
const Buyer = sequelize.define("Buyer", {
  id,
  name: { type: DataTypes.STRING, allowNull: false },
  CNIC: { type: DataTypes.STRING, unique: true },
  photoUrl: DataTypes.STRING,
  cropId: DataTypes.UUID,
  quantity: DataTypes.FLOAT,
  date: DataTypes.DATEONLY,
});

// TASKS
const Task = sequelize.define("Task", {
  id,
  title: { type: DataTypes.STRING, allowNull: false },
  type: {
    type: DataTypes.ENUM("Irrigation", "Fertilizer", "Spraying", "Labour"),
    allowNull: false,
  },
  cropId: DataTypes.UUID,
  dueDate: DataTypes.DATEONLY,
  status: {
    type: DataTypes.ENUM("Pending", "Done", "Overdue"),
    defaultValue: "Pending",
  },
  notes: DataTypes.TEXT,
});

// EXPENSES
const Expense = sequelize.define("Expense", {
  id,
  cropId: DataTypes.UUID,
  type: {
    type: DataTypes.ENUM("Income", "Expense"),
    defaultValue: "Expense",
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  date: DataTypes.DATEONLY,
  note: DataTypes.TEXT,
});
// INVENTORY
const Inventory = sequelize.define("Inventory", {
  id,
  item: { type: DataTypes.STRING, allowNull: false },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  qty: { type: DataTypes.FLOAT, defaultValue: 0 },
  minQty: { type: DataTypes.FLOAT, defaultValue: 0 },
  unit: DataTypes.STRING,
  usageHistory: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
});

// WORKERS
const Worker = sequelize.define("Worker", {
  id,
  fullName: { type: DataTypes.STRING, allowNull: false },
  CNIC: { type: DataTypes.STRING, unique: true },
  phone: DataTypes.STRING,
  role: DataTypes.STRING,
  dailyWage: DataTypes.FLOAT,
  joinDate: DataTypes.DATEONLY,
  status: {
    type: DataTypes.ENUM("Active", "Inactive"),
    defaultValue: "Active",
  },
});

// ATTENDANCE
const Attendance = sequelize.define("Attendance", {
  id,
  workerId: DataTypes.UUID,
  date: DataTypes.DATEONLY,
  status: {
    type: DataTypes.ENUM("Present", "Absent", "Half-day", "Leave"),
    allowNull: false,
  },
  note: DataTypes.TEXT,
});

// EQUIPMENT
const Equipment = sequelize.define("Equipment", {
  id,
  name: { type: DataTypes.STRING, allowNull: false },
  type: DataTypes.STRING,
  purchaseDate: DataTypes.DATEONLY,
  status: {
    type: DataTypes.ENUM("Active", "Under Repair", "Idle"),
    defaultValue: "Active",
  },
  lastServiceDate: DataTypes.DATEONLY,
  serviceIntervalDays: DataTypes.INTEGER,
  notes: DataTypes.TEXT,
});

// MAINTENANCE
const Maintenance = sequelize.define("Maintenance", {
  id,
  equipmentId: DataTypes.UUID,
  date: DataTypes.DATEONLY,
  description: DataTypes.TEXT,
  cost: DataTypes.FLOAT,
  performedBy: DataTypes.STRING,
});

// ACTIVITY LOG
const Activity = sequelize.define("Activity", {
  id,
  userId: DataTypes.UUID,
  action: {
    type: DataTypes.ENUM("add", "edit", "delete"),
    allowNull: false,
  },
  entity: DataTypes.STRING,
  entityId: DataTypes.UUID,
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// ASSOCIATIONS

User.hasMany(Crop, { foreignKey: "createdBy" });
Crop.belongsTo(User, { foreignKey: "createdBy" });

Crop.hasMany(Order, { foreignKey: "cropId", onDelete: "CASCADE" });
Order.belongsTo(Crop, { foreignKey: "cropId" });

Crop.hasMany(Buyer, { foreignKey: "cropId", onDelete: "CASCADE" });
Buyer.belongsTo(Crop, { foreignKey: "cropId" });

Crop.hasMany(Task, { foreignKey: "cropId", onDelete: "SET NULL" });
Task.belongsTo(Crop, { foreignKey: "cropId" });

Crop.hasMany(Expense, { foreignKey: "cropId", onDelete: "SET NULL" });
Expense.belongsTo(Crop, { foreignKey: "cropId" });

Worker.hasMany(Attendance, {
  foreignKey: "workerId",
  onDelete: "CASCADE",
});
Attendance.belongsTo(Worker, { foreignKey: "workerId" });

Equipment.hasMany(Maintenance, {
  foreignKey: "equipmentId",
  onDelete: "CASCADE",
});
Maintenance.belongsTo(Equipment, { foreignKey: "equipmentId" });

User.hasMany(Activity, { foreignKey: "userId" });
Activity.belongsTo(User, { foreignKey: "userId" });

module.exports = {
  User,
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
  Activity,
};