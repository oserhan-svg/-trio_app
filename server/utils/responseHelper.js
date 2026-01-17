/**
 * Sends a JSON response handling BigInt serialization.
 * @param {Object} res - Express response object
 * @param {any} data - Data to serialize and send
 * @param {number} [statusCode=200] - HTTP status code
 */
const jsonBigInt = (res, data, statusCode = 200) => {
    const jsonString = JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    );
    res.setHeader('Content-Type', 'application/json');
    res.status(statusCode).send(jsonString);
};

const safeParseStats = (data) => {
    return JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
};

module.exports = { jsonBigInt, safeParseStats };
