const db = require('../config/database');

function normalizeEmail(email) {
    return typeof email === 'string' ? email.trim().toLowerCase() : email;
}

function sanitizePaymentId(paymentId) {
    if (paymentId === null || paymentId === undefined) return null;
    const normalized = String(paymentId).trim();
    if (normalized === '' || normalized.toLowerCase() === 'null' || normalized.toLowerCase() === 'undefined') {
        return null;
    }
    return normalized;
}

class OrderModel {
    static async createOrder(orderData) {

        const {
            preference_id = null,
            order_id,
            nome,
            email,
            plano,
            status
        } = orderData;

        const [result] =
            await db.query(
                `
                INSERT INTO pedidos
                (
                    preference_id,
                    order_id,
                    nome,
                    email,
                    plano,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    preference_id,
                    order_id,
                    typeof nome === 'string' ? nome.trim() : nome,
                    normalizeEmail(email),
                    plano,
                    status || 'pendente'
                ]
            );

        return result.insertId;
    }

    static async updatePreferenceId(orderId, preferenceId) {

        const [result] =
            await db.query(
                `
                UPDATE pedidos
                SET preference_id = ?
                WHERE order_id = ?
                `,
                [preferenceId, orderId]
            );

        return result.affectedRows > 0;
    }

    static async findPendingOrder(email, plano) {

        const [rows] =
            await db.query(
                `
                SELECT *
                FROM pedidos
                WHERE LOWER(TRIM(email)) = ?
                AND plano = ?
                AND status = 'pendente'
                AND preference_id IS NOT NULL
                AND preference_id != ''
                ORDER BY created_at DESC
                LIMIT 1
                `,
                [normalizeEmail(email), plano]
            );

        return rows[0] || null;
    }

    static async updateOrderStatusByPayment(
        paymentId,
        status,
        orderId
    ) {
        const cleanPaymentId = sanitizePaymentId(paymentId);

        const [result] =
            await db.query(
                `
                UPDATE pedidos
                SET
                    status = ?,
                    payment_id = COALESCE(?, payment_id)
                WHERE order_id = ?
                `,
                [
                    status,
                    cleanPaymentId,
                    orderId
                ]
            );

        return result.affectedRows > 0;
    }

    static async getOrderByPreferenceId(
        preferenceId
    ) {

        const [rows] =
            await db.query(
                `
                SELECT *
                FROM pedidos
                WHERE preference_id = ?
                LIMIT 1
                `,
                [preferenceId]
            );

        return rows[0] || null;
    }

    static async getOrderByOrderId(
        orderId
    ) {

        const [rows] =
            await db.query(
                `
                SELECT *
                FROM pedidos
                WHERE order_id = ?
                LIMIT 1
                `,
                [orderId]
            );

        return rows[0] || null;
    }

    static async getOrderByPaymentId(
        paymentId
    ) {
        const cleanPaymentId = sanitizePaymentId(paymentId);
        if (!cleanPaymentId) return null;

        const [rows] =
            await db.query(
                `
                SELECT *
                FROM pedidos
                WHERE payment_id = ?
                LIMIT 1
                `,
                [cleanPaymentId]
            );

        return rows[0] || null;
    }

    static async countTrials() {

        const [rows] =
            await db.query(
                `
                SELECT COUNT(*) AS count
                FROM pedidos
                WHERE plano = 'trial'
                AND status IN (
                    'pendente',
                    'aprovado'
                )
                `
            );

        return Number(
            rows[0].count
        );
    }
}

module.exports =
    OrderModel;