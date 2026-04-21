# Inventory Management Web App

A beginner-friendly inventory management web application built with HTML, CSS, JavaScript, Firebase Firestore, and Firebase Authentication.

This version has been upgraded into a cleaner admin-style dashboard with a more production-ready UI, responsive layout, protected authentication flow, and better code structure while keeping the Firebase logic simple.

## Features

- Email signup and login with Firebase Authentication
- Guest access mode
- Protected dashboard for authenticated users
- Real-time product listing with Firestore `onSnapshot`
- Add, edit, and delete products
- Search products by name, category, or stock status
- Dashboard metrics for total, low-stock, and out-of-stock items
- Product status badges:
  - In Stock
  - Low Stock
  - Out of Stock
- Loading state and empty state handling
- Delete confirmation prompt
- Dark and light theme toggle
- Responsive admin dashboard layout

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES Modules)
- Firebase Firestore
- Firebase Authentication

## Project Structure

```text
inventorysystem/
|-- index.html
|-- dashboard.html
|-- style.css
|-- script.js
|-- README.md
```

## Pages

### `index.html`

Authentication screen for:

- Login
- Signup
- Guest access

### `dashboard.html`

Main inventory dashboard with:

- Sidebar navigation
- Product statistics
- Add/edit product form
- Real-time product cards
- Search bar

## Firebase Setup

Update the Firebase config inside `script.js` with your own project credentials:

```js
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID"
};
```

Make sure these Firebase services are enabled in your Firebase project:

- Authentication
  - Email/Password provider
- Firestore Database

## How It Works

### Authentication Flow

- Logged-in users can access `dashboard.html`
- Unauthenticated users are redirected back to `index.html`
- Guest users can still open the dashboard without Firebase login
- Logged-in users visiting the login page are redirected to the dashboard

### Product Flow

- Products are stored in the Firestore `products` collection
- The app listens in real time using `onSnapshot`
- Adding a product creates a new Firestore document
- Editing updates the selected document
- Deleting removes the document after confirmation

## UI Improvements Included

- Modern SaaS-style admin dashboard layout
- Sidebar navigation
- Card-based product design
- Better spacing, typography, and alignment
- Smooth hover transitions and button feedback
- Mobile responsive layout using CSS Grid and Flexbox
- Improved dark theme colors with a softer, modern look

## Run Locally

Because Firebase modules are loaded in the browser, run the project with a local server instead of opening files directly.

Examples:

```bash
# VS Code Live Server
# or

python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## Future Improvements

- Product filters by category
- Pagination for large inventories
- Better form validation
- Firestore security rules
- Role-based access control for admin/staff users
- Export inventory to CSV

## Author

Built and upgraded as a Firebase-based inventory dashboard project.
