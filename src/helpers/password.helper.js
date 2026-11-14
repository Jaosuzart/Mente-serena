const crypto = require('crypto');

class PasswordHelper {
    /**
     * Hashes a password using scrypt with random salt
     * @param {string} password 
     * @returns {string} salt:hash
     */
    static hashPassword(password) {
        if (!password || typeof password !== 'string') {
            throw new Error('Senha inválida para hashing');
        }
        const salt = crypto.randomBytes(16).toString('hex');
        const derivedKey = crypto.scryptSync(password, salt, 64);
        return `${salt}:${derivedKey.toString('hex')}`;
    }

    /**
     * Verifies a password against the stored salt:hash
     * @param {string} password 
     * @param {string} storedHash 
     * @returns {boolean}
     */
    static verifyPassword(password, storedHash) {
        if (!password || !storedHash || typeof storedHash !== 'string') {
            return false;
        }
        const [salt, key] = storedHash.split(':');
        if (!salt || !key) return false;

        const keyBuffer = Buffer.from(key, 'hex');
        const derivedKey = crypto.scryptSync(password, salt, 64);

        if (keyBuffer.length !== derivedKey.length) {
            return false;
        }
        return crypto.timingSafeEqual(keyBuffer, derivedKey);
    }
}

module.exports = PasswordHelper;
