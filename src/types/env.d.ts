/* eslint-disable @typescript-eslint/no-unused-vars */
// types/env.d.ts
// ============================================================
// Environment Variables Type Definitions
// ============================================================

declare namespace NodeJS {
  interface ProcessEnv {
    // Application
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_APP_NAME: string;
    NEXT_PUBLIC_APP_VERSION: string;

    // Database
    DB_HOST: string;
    // DB_PORT: string
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    DB_CONNECTION_LIMIT?: string;

    // Authentication
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN?: string;
    SESSION_SECRET: string;
    SESSION_TIMEOUT?: string;

    // Security
    BCRYPT_ROUNDS?: string;
    MAX_LOGIN_ATTEMPTS?: string;
    LOCKOUT_DURATION?: string;

    // File Upload
    MAX_FILE_SIZE?: string;
    MAX_FILES?: string;
    UPLOAD_DIR?: string;
    ALLOWED_FILE_TYPES?: string;
    ALLOWED_IMAGE_TYPES?: string;

    // Email
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_SECURE?: string;
    SMTP_USER?: string;
    SMTP_PASSWORD?: string;
    SMTP_FROM?: string;
    SMTP_FROM_NAME?: string;

    // Application Settings
    PAGINATION_LIMIT?: string;
    DEFAULT_PAGE_SIZE?: string;
    MAX_PAGE_SIZE?: string;

    // Rate Limiting
    RATE_LIMIT_WINDOW?: string;
    RATE_LIMIT_MAX_REQUESTS?: string;

    // Feature Flags
    ENABLE_NOTIFICATIONS?: string;
    ENABLE_EMAIL_ALERTS?: string;
    ENABLE_SMS_ALERTS?: string;
    ENABLE_AUDIT_LOGS?: string;
    ENABLE_FILE_UPLOADS?: string;
    ENABLE_PRINT_MODE?: string;
    ENABLE_DRAFT_AUTOSAVE?: string;
    ENABLE_QUESTION_VERSIONING?: string;

    // Search
    ENABLE_SEARCH?: string;
    SEARCH_INDEX_PATH?: string;

    // Logging
    LOG_LEVEL?: string;
    LOG_FILE?: string;
    ENABLE_REQUEST_LOGGING?: string;

    // Performance
    ENABLE_CACHING?: string;
    CACHE_TTL?: string;
    ENABLE_COMPRESSION?: string;

    // Database Migration
    AUTO_MIGRATE?: string;
    SEED_DATABASE?: string;

    // Development
    ANALYZE?: string;
    ENABLE_SOURCEMAPS?: string;
    ENABLE_PROFILING?: string;

    // Institution
    INSTITUTION_NAME?: string;
    INSTITUTION_SHORT_NAME?: string;
    INSTITUTION_LOGO_URL?: string;
    INSTITUTION_SEAL_URL?: string;

    // Academic
    CURRENT_ACADEMIC_YEAR?: string;
    CURRENT_SEMESTER?: string;
    EXAM_SUBMISSION_DEADLINE_DAYS?: string;
    PAPER_REVIEW_DEADLINE_DAYS?: string;

    // Workflow
    REQUIRE_HOD_APPROVAL?: string;
    REQUIRE_DEAN_APPROVAL?: string;
    ALLOW_PAPER_RESUBMISSION?: string;
    MAX_PAPER_REVISIONS?: string;

    // Question Bank
    MIN_QUESTIONS_PER_PAPER?: string;
    MAX_QUESTIONS_PER_PAPER?: string;
    ALLOW_QUESTION_REUSE?: string;
    QUESTION_USAGE_LIMIT?: string;

    // External Services
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_REGION?: string;
    AWS_S3_BUCKET?: string;

    // Monitoring
    SENTRY_DSN?: string;
    SENTRY_ENVIRONMENT?: string;

    // Analytics
    GOOGLE_ANALYTICS_ID?: string;
    GOOGLE_TAG_MANAGER_ID?: string;
  }
}

// Make environment variables available in client components
declare global {
  interface Window {
    ENV: {
      APP_NAME: string;
      APP_VERSION: string;
      APP_URL: string;
    };
  }
}

export {};
