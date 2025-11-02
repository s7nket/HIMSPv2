# Police Hardware Inventory Management System

A comprehensive MERN stack application for managing police hardware inventory with role-based access control.

## Features

### Admin Panel

- User Management (Create, Update, Deactivate Officers)
- Equipment Management (Add, Update, Delete Equipment)
- Process Equipment Requests (Approve/Reject)
- Generate Reports
- Dashboard with Statistics

### Officer Panel

- Request Equipment
- View Available Inventory
- Return Equipment
- Track Request Status
- Personal Dashboard

## Technology Stack

- **Frontend**: React 18, React Router, Axios, React Toastify
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Authorization**: Role-based Access Control
- **Database**: MongoDB Atlas (Cloud) or Local MongoDB

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (Local installation or MongoDB Atlas account)
- Git

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/police-inventory
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:3000
```

5. Start the backend server:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the React development server:

```bash
npm start
```

The application will open at `http://localhost:3000`

## Default Admin Account

When you first run the application, the first user registered will automatically become an admin.

For testing, you can create an admin account with these credentials:

- **Username**: admin
- **Email**: admin@police.gov
- **Password**: admin123456

## Database Schema

### User Collection

- Personal Information (Name, Email, Username)
- Role (admin/officer)
- Department & Badge Number
- Account Status

### Equipment Collection

- Equipment Details (Name, Model, Serial Number)
- Category & Manufacturer
- Purchase Information
- Current Status & Location
- Issue/Return History

### Request Collection

- Request Type (Issue/Return/Maintenance)
- Equipment & User References
- Status Tracking
- Admin Notes & Timestamps

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Admin Routes

- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new officer
- `PUT /api/admin/users/:id` - Update user
- `GET /api/admin/requests` - Get all requests
- `PUT /api/admin/requests/:id/approve` - Approve request
- `PUT /api/admin/requests/:id/reject` - Reject request

### Officer Routes

- `GET /api/officer/dashboard` - Officer dashboard
- `GET /api/officer/requests` - Get user's requests
- `POST /api/officer/requests` - Create new request
- `GET /api/officer/inventory` - View available equipment
- `GET /api/officer/equipment/issued` - Get issued equipment

### Equipment Routes

- `GET /api/equipment` - Get all equipment
- `POST /api/equipment` - Add new equipment
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete equipment
- `PUT /api/equipment/:id/issue` - Issue equipment
- `PUT /api/equipment/:id/return` - Return equipment

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet for security headers

## Deployment

### Backend Deployment (Heroku)

1. Create a new Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy using Git or GitHub integration

### Frontend Deployment (Netlify/Vercel)

1. Build the React app: `npm run build`
2. Deploy the `build` folder to your hosting platform
3. Configure API URL environment variable

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

currently working fine
users :
admin
Admin123
officer1
Officer123
