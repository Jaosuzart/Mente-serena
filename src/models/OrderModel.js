const db = require('../config/database');

class OrderModel {

    static async createOrder(orderData) {

        const {
            preference_id,
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
                    nome,
                    email,
                    plano,
                    status || 'pendente'
                ]
            );

        return result.insertId;
    }

    static async updateOrderStatusByPayment(
        paymentId,
        status,
        orderId
    ) {

        const [result] =
            await db.query(
                `
                UPDATE pedidos
                SET
                    status = ?,
                    payment_id = ?
                WHERE order_id = ?
                `,
                [
                    status,
                    String(paymentId),
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

        const [rows] =
            await db.query(
                `
                SELECT *
                FROM pedidos
                WHERE payment_id = ?
                LIMIT 1
                `,
                [String(paymentId)]
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