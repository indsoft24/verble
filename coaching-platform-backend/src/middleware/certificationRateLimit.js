const buckets = new Map();

export const certificationRateLimit = ({ windowMs = 60_000, max = 60 } = {}) => (req, res, next) => {
    const now = Date.now();
    const identity = req.user?._id?.toString() || req.ip || 'anonymous';
    const key = `${identity}:${req.baseUrl}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) bucket = { count: 0, resetAt: now + windowMs };
    bucket.count += 1;
    buckets.set(key, bucket);
    if (bucket.count > max) {
        res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
        return res.status(429).json({ status: 'fail', message: 'Too many requests. Please try again shortly.' });
    }
    if (buckets.size > 10000) {
        for (const [bucketKey, value] of buckets) if (value.resetAt <= now) buckets.delete(bucketKey);
    }
    next();
};
