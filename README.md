# AgriFlow – Agriculture Management System Backend

## Project Overview
AgriFlow is an Agriculture Management System backend developed using Node.js, Express.js, PostgreSQL, Sequelize ORM, and JWT authentication.

It provides secure APIs for managing agricultural operations, users, farm resources, expenses, workers, attendance, equipment, and maintenance.

## Technologies Used
- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication
- bcryptjs
- Multer
- Helmet
- CORS
- Morgan
- Express Rate Limit

## Main Features
- User registration and login
- JWT-based authentication
- Admin and Manager roles
- Role-based authorization
- Crop management
- Orders management
- Buyers management
- Buyer photo uploads
- Farm task management
- Expense management
- Inventory management
- Worker management
- Attendance management
- Equipment management
- Maintenance management
- Automatic maintenance expense records
- Activity logging

## Project Structure

```text
backend/
├── Controllers/
├── middleware/
├── Model/
├── Routes/
├── scripts/
├── public/
│   └── Images/
├── .env
├── .env.example
├── .gitignore
├── app.js
├── db.js
├── package.json
└── testConnection.js
```

## Installation

1. Install Node.js and PostgreSQL.
2. Open the backend project folder.
3. Install dependencies:

```bash
npm install
```

4. Create a PostgreSQL database.
5. Create a `.env` file using `.env.example` as a reference.
6. Add your database credentials and JWT secret to `.env`.

## Environment Variables

```env
PORT=5000
DB_NAME=your_database_name
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```

Never share your actual `.env` file or commit it to GitHub.

## Database Setup

Run the database connection test:

```bash
npm run test:db
```

Create the initial Admin account:

```bash
node scripts/createAdmin.js
```

The application synchronizes Sequelize models with PostgreSQL when the server starts.

## Running the Backend

Development mode:

```bash
npm run dev
```

Normal mode:

```bash
npm start
```

Backend base URL:

```text
http://localhost:5000
```

API base URL:

```text
http://localhost:5000/api
```

## Authentication Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/login | User login |
| POST | /api/auth/register | Admin creates a Manager |
| GET | /api/auth/profile | Get logged-in user profile |
| GET | /api/auth/users | Get all users (Admin only) |
| DELETE | /api/auth/users/:id | Delete a user (Admin only) |
| PUT | /api/auth/users/:id | Update a user (Admin only) |

## Agriculture API Endpoints

The following resources support CRUD operations:

- `/api/crops`
- `/api/orders`
- `/api/buyers`
- `/api/tasks`
- `/api/expenses`
- `/api/inventory`
- `/api/workers`
- `/api/attendance`
- `/api/equipment`
- `/api/maintenance`

Activity logs:

```text
GET /api/activity
```

All protected endpoints require a JWT Bearer Token.

## Buyer Photo Upload

Buyer photos are uploaded using multipart/form-data.

Requirements:
- JPG and PNG formats only.
- Maximum file size: 1 MB.
- Form field name: `photo`.

Uploaded images are stored in:

```text
public/Images/
```
## API Response Format

Most API endpoints follow the standard response structure:

```json
{
  "succeeded": true,
  "message": "Operation successful",
  "data": {}
}
```

## Role-Based Access

**Admin**
- Access to administrative operations.
- Manage and delete records.
- Manage users.
- Perform restricted operations.

**Manager**
- Access permitted agricultural resources.
- View records and perform allowed operations.
- Cannot perform Admin-only operations.

## Security Features

- JWT authentication
- Password hashing with bcryptjs
- Role-based authorization
- Login rate limiting
- Helmet security headers
- CORS configuration
- Buyer image type and size validation
- Environment variable protection

## Frontend Integration

The React frontend communicates with the backend through Axios.

Default frontend API URL:

```text
http://localhost:5000/api
```

The JWT token is automatically attached to authenticated requests.

## Developer

Developed as part of the U-Devs Batch 6 Full Stack Developer Internship.