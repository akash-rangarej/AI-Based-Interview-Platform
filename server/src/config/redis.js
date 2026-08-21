const IORedis = require("ioredis");

const createRedisConnection = () => {
    const redis = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
    });

    redis.on("connect", () => {
        console.log("Redis connected");
    });

    redis.on("ready", () => {
        console.log("Redis ready");
    });

    redis.on("error", (err) => {
        console.error("Redis error:", err.message);
    });

    return redis;
};

module.exports = createRedisConnection;