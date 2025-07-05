# portfolio-portal-backend

This is a personal backend project built for learning and practice. Currently, it focuses on **user authentication**, including features like registration, email verification, login, password reset, and JWT-based session handling.

Later, I plan to add more functionality to support a complete portfolio portal.

---

## 🚀 Features (So Far)

- ✅ User registration with email verification
- ✅ Login with JWT authentication
- ✅ Resend email verification link
- ✅ Forgot/reset password via email
- ✅ Change password for logged-in users
- ✅ Token-based session verification
- ✅ Basic security (XSS protection, rate limiting)

---

## 🛠 Tech Stack

- Node.js
- Express.js
- PostgreSQL
- JWT (Authentication)
- Bcrypt (Password hashing)
- Nodemailer (Emails)
- express-validator
- dotenv
- express-rate-limit
- xss-clean

## 🔧 Setup

1. Clone the repo:

```bash
git clone https://github.com/your-username/portfolio-portal-backend.git
cd portfolio-portal-backend

2. Install dependencies:

npm install

3. Create a .env file with your database credentials:

PORT=your_port
DB_HOST=your_database_host
DB_PORT=your_database_port
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
JWT_SECRET_KEY=your_jwt_key
NODEMAILER_EMAIL=your_nodemailer_mail
NODEMAILER_PASSWORD=your_nodemailer_pass
FRONTEND_URL=your_frontend_url

4. Run the application:

npm start or if you're using nodemon for development: npm run dev 

The server will start on: http://localhost:8080

This project is a work-in-progress for learning and practice purposes.
If you find any issues, mistakes, or have suggestions to improve it — feel free to open an issue or create a pull request.
I'm always open to learning from the community!