// Custom error classes

export class PlatformError extends Error {
    constructor(
        public platform: string,
        message: string
    ) {
        super(`[${platform}] ${message}`);
        this.name = 'PlatformError';
    }
}

export class TimeoutError extends Error {
    constructor(
        public platform: string,
        public timeoutMs: number
    ) {
        super(`[${platform}] Request timeout after ${timeoutMs}ms`);
        this.name = 'TimeoutError';
    }
}

export class UserNotFoundError extends Error {
    constructor(
        public platform: string,
        public username: string
    ) {
        super(`[${platform}] User "${username}" not found`);
        this.name = 'UserNotFoundError';
    }
}
