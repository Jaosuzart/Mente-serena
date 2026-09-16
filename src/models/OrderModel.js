const db = require('../config/database');

class OrderModel {
    static async createOrder(orderData) {
        try {
            const { preference_id, order_id, nome, email, plano, status } = orderData;
            
            const [result] = await db.query(
                'INSERT INTO pedidos (preference_id, order_id, nome, email, plano, status) VALUES (?, ?, ?, ?, ?, ?)',
                [preference_id, order_id, nome, email, plano, status || 'pendente']
            );
            
            return result.insertId;
        } catch (error) {
            console.error('Erro ao criar pedido no banco:', error);
            throw error;
        }
    }
    static async updateOrderStatusByPayment(paymentId, status, orderId) {
        try {
            const [result] = await db.query(
                'UPDATE pedidos SET status = ?, payment_id = ? WHERE order_id = ?',
                [status, paymentId, orderId]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao atualizar status do pedido:', error);
            throw error;
        }
    }
    static async getOrderByPreferenceId(preferenceId) {
        try {
            const [rows] = await db.query('SELECT * FROM pedidos WHERE preference_id = ? LIMIT 1', [preferenceId]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Erro ao buscar pedido:', error);
            throw error;
        }
    }
}

module.exports = OrderModel;
