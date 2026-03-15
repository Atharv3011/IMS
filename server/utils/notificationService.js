const DEFAULT_LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD || 20);

const parseBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
    }
    return false;
};

const isEmailEnabled = () => {
    return parseBoolean(process.env.EMAIL_NOTIFICATIONS_ENABLED) &&
        Boolean(process.env.SMTP_HOST) &&
        Boolean(process.env.SMTP_PORT) &&
        Boolean(process.env.SMTP_USER) &&
        Boolean(process.env.SMTP_PASS) &&
        Boolean(process.env.EMAIL_FROM);
};

const isSmsEnabled = () => {
    return parseBoolean(process.env.SMS_NOTIFICATIONS_ENABLED) &&
        Boolean(process.env.TWILIO_ACCOUNT_SID) &&
        Boolean(process.env.TWILIO_AUTH_TOKEN) &&
        Boolean(process.env.TWILIO_PHONE_NUMBER);
};

const buildOrderItemsText = (order) => {
    if (!order?.items?.length) return 'No items';

    return order.items
        .map((item) => `${item.productName} x ${item.quantity}`)
        .join(', ');
};

const sendEmail = async ({ to, subject, html }) => {
    if (!to) return { ok: false, reason: 'email-missing' };

    if (!isEmailEnabled()) {
        return { ok: false, reason: 'email-disabled' };
    }

    try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: parseBoolean(process.env.SMTP_SECURE),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html
        });

        return { ok: true };
    } catch (error) {
        console.error('Email notification error:', error.message);
        return { ok: false, reason: 'email-error', error: error.message };
    }
};

const sendSms = async ({ to, body }) => {
    if (!to) return { ok: false, reason: 'phone-missing' };

    if (!isSmsEnabled()) {
        return { ok: false, reason: 'sms-disabled' };
    }

    try {
        const twilioModule = await import('twilio');
        const twilioClient = twilioModule.default(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        await twilioClient.messages.create({
            body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to
        });

        return { ok: true };
    } catch (error) {
        console.error('SMS notification error:', error.message);
        return { ok: false, reason: 'sms-error', error: error.message };
    }
};

export const notifyOrderCreated = async (order) => {
    const itemsText = buildOrderItemsText(order);
    const subject = `Order Received: ${order.orderNumber}`;
    const emailBody = `
        <h2>Order Received</h2>
        <p>Hi ${order.customerName},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been received.</p>
        <p><strong>Items:</strong> ${itemsText}</p>
        <p><strong>Total:</strong> $${Number(order.totalAmount || 0).toFixed(2)}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p>We will notify you when the status changes.</p>
    `;

    const smsBody = `IMS: Order ${order.orderNumber} received. Total $${Number(order.totalAmount || 0).toFixed(2)}. Status: ${order.status}.`;

    return Promise.allSettled([
        sendEmail({ to: order.customerEmail, subject, html: emailBody }),
        sendSms({ to: order.customerPhone, body: smsBody })
    ]);
};

export const notifyOrderStatusUpdated = async (order) => {
    const subject = `Order ${order.orderNumber} status: ${order.status}`;
    const emailBody = `
        <h2>Order Status Update</h2>
        <p>Hi ${order.customerName},</p>
        <p>Your order <strong>${order.orderNumber}</strong> status is now <strong>${order.status}</strong>.</p>
        <p><strong>Total:</strong> $${Number(order.totalAmount || 0).toFixed(2)}</p>
    `;

    const smsBody = `IMS: Order ${order.orderNumber} status updated to ${order.status}.`;

    return Promise.allSettled([
        sendEmail({ to: order.customerEmail, subject, html: emailBody }),
        sendSms({ to: order.customerPhone, body: smsBody })
    ]);
};

export const notifyLowStockForOrder = async (order, lowStockItems = []) => {
    if (!lowStockItems.length) return [];

    const itemLines = lowStockItems
        .map((item) => `${item.name}: ${item.stock} left`)
        .join('<br/>');

    const smsItemLines = lowStockItems
        .map((item) => `${item.name}(${item.stock})`)
        .join(', ');

    const subject = `Low stock update after order ${order.orderNumber}`;
    const emailBody = `
        <h2>Low Stock Update</h2>
        <p>Hi ${order.customerName},</p>
        <p>After your order <strong>${order.orderNumber}</strong>, these items are low in stock:</p>
        <p>${itemLines}</p>
        <p>Threshold: ${DEFAULT_LOW_STOCK_THRESHOLD}</p>
    `;

    const smsBody = `IMS: After order ${order.orderNumber}, low stock items: ${smsItemLines}.`;

    return Promise.allSettled([
        sendEmail({ to: order.customerEmail, subject, html: emailBody }),
        sendSms({ to: order.customerPhone, body: smsBody })
    ]);
};

export const getLowStockThreshold = () => DEFAULT_LOW_STOCK_THRESHOLD;
