# Book Review API

A RESTful API for managing books and reviews. This backend application allows users to register, login, create and manage books, and post reviews.

## Project Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd junior-backend-task
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/book-review-api
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRY=7d
   ALLOWED_ORIGIN=http://localhost:3000
   ```

4. Start the server:
   ```bash
   # For development with auto-restart
   npm run dev
   
   # For production
   npm start
   ```

## API Endpoints

All API endpoints are prefixed with `/v1`.

### Authentication

#### Register a new user
- **URL**: `/v1/user/signup`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response**: 
  - **Code**: 201
  - **Content**: User details with auth token

#### Login
- **URL**: `/v1/user/login`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response**: 
  - **Code**: 200
  - **Content**: User details with auth token

#### Logout
- **URL**: `/v1/user/logout`
- **Method**: `POST`
- **Auth Required**: Yes
- **Success Response**: 
  - **Code**: 200
  - **Content**: Success message

### User Management

#### Get current user
- **URL**: `/v1/user/me`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**: 
  - **Code**: 200
  - **Content**: Current user's information

#### Update user details
- **URL**: `/v1/user/update`
- **Method**: `PATCH`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "name": "Updated Name",
    "email": "newemail@example.com"
  }
  ```
- **Success Response**: 
  - **Code**: 200
  - **Content**: Updated user details

### Books

#### Get all books
- **URL**: `/v1/books`
- **Method**: `GET`
- **Auth Required**: No
- **Query Parameters**:
  - `page`: Page number (optional, default: 1)
  - `limit`: Number of books per page (optional, default: 10)
- **Success Response**: 
  - **Code**: 200
  - **Content**: Array of books with pagination info

#### Search books
- **URL**: `/v1/books/search`
- **Method**: `GET`
- **Auth Required**: No
- **Query Parameters**:
  - `q`: Search term
  - `page`: Page number (optional, default: 1)
  - `limit`: Number of books per page (optional, default: 10)
- **Success Response**: 
  - **Code**: 200
  - **Content**: Array of matching books with pagination info

#### Get book by ID
- **URL**: `/v1/books/:id`
- **Method**: `GET`
- **Auth Required**: No
- **URL Parameters**:
  - `id`: Book ID
- **Success Response**: 
  - **Code**: 200
  - **Content**: Book details including reviews

#### Create new book
- **URL**: `/v1/books`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "title": "Book Title",
    "author": "Author Name",
    "description": "Book description",
    "genre": "Fiction",
    "publishedDate": "2023-05-20"
  }
  ```
- **Success Response**: 
  - **Code**: 201
  - **Content**: Created book details

### Reviews

#### Create review
- **URL**: `/v1/books/:id/reviews`
- **Method**: `POST`
- **Auth Required**: Yes
- **URL Parameters**:
  - `id`: Book ID
- **Body**:
  ```json
  {
    "rating": 5,
    "comment": "This is a great book!"
  }
  ```
- **Success Response**: 
  - **Code**: 201
  - **Content**: Created review details

#### Update review
- **URL**: `/v1/reviews/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (must be review owner)
- **URL Parameters**:
  - `id`: Review ID
- **Body**:
  ```json
  {
    "rating": 4,
    "comment": "Updated review comment"
  }
  ```
- **Success Response**: 
  - **Code**: 200
  - **Content**: Updated review details

#### Delete review
- **URL**: `/v1/reviews/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (must be review owner)
- **URL Parameters**:
  - `id`: Review ID
- **Success Response**: 
  - **Code**: 200
  - **Content**: Success message

## Authentication

The API uses JWT (JSON Web Token) for authentication. For protected routes, include the JWT token in the request header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: User doesn't have permission
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses follow this format:
```json
{
  "error": "Error message"
}
```
