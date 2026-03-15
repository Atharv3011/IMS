# Orders Testing Guide

## Scope

This guide covers:
- Orders list page rendering
- Order list search and status filtering
- Order details retrieval
- Order creation and stock reflection
- Order status changes
- Frontend-backend integration checks

## API Testing With Postman

Use the collection at `server/postman/IMS-Orders-API.postman_collection.json`.

### Pre-requisites
- Backend running on `http://localhost:5000`
- Frontend running on Vite
- MongoDB connected
- At least one product exists with stock greater than `0`
- Set `productId` in the Postman collection before running the `Create Order` request

### Recommended request order
1. `Auth Login`
2. `Get All Orders`
3. `Get Order Details`
4. `Create Order`
5. `Update Order Status`

### What to verify in Postman
- `Get All Orders` returns `200` and an array in `data`
- `Get Order Details` returns the selected order and its `items`
- `Create Order` returns `201`
- Product stock decreases after order creation
- `Update Order Status` returns `200` and the new status
- If an order is cancelled, stock is restored

## Frontend Orders List Testing

Open the admin Orders page and verify:
- Table displays `Order ID`, `Customer Name`, `Product Name`, `Quantity`, `Order Date`, `Order Status`
- Search works for customer name, order number, and product name
- Status filter switches between `all`, `pending`, `processing`, `completed`, `cancelled`
- Table remains scrollable and aligned on smaller screen widths
- View Details opens the selected order correctly
- Mark as Completed and Cancel actions update the UI after refresh

## Frontend-Backend Integration Checks

1. Create an order from the customer side
2. Open the admin orders page
3. Confirm the new order appears in the table
4. Confirm product names and quantities match the order payload
5. Change the status from admin
6. Open the customer orders page and verify the new status appears
7. Check product stock on the products page after creation or cancellation

## Current limitation

Automated API and UI test runners are not configured in this repository yet. This guide and Postman collection provide the repeatable manual verification path until a formal test suite is added.
