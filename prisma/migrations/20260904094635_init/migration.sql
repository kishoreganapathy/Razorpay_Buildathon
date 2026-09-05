-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'CUSTOMER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Merchant` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Merchant_userId_key`(`userId`),
    UNIQUE INDEX `Merchant_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `merchantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `attributes` TEXT NOT NULL,
    `mrp` INTEGER NOT NULL,
    `sellingPrice` INTEGER NOT NULL,
    `minimumPrice` INTEGER NOT NULL,
    `maxDiscount` INTEGER NOT NULL,
    `minProfitMargin` DOUBLE NOT NULL,
    `costPrice` INTEGER NOT NULL,
    `inventory` INTEGER NOT NULL,
    `maxRounds` INTEGER NOT NULL DEFAULT 3,
    `offerValidityMinutes` INTEGER NOT NULL DEFAULT 10,
    `concessionMode` VARCHAR(191) NOT NULL DEFAULT 'LINEAR',
    `concessionSchedule` TEXT NULL,
    `warrantyMonths` INTEGER NOT NULL DEFAULT 12,
    `deliveryDays` INTEGER NOT NULL DEFAULT 3,
    `reliabilityScore` DOUBLE NOT NULL DEFAULT 0.85,
    `returnDays` INTEGER NOT NULL DEFAULT 7,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NegotiationSession` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NEGOTIATING',
    `customerIntent` TEXT NOT NULL,
    `currentRound` INTEGER NOT NULL DEFAULT 0,
    `maxRounds` INTEGER NOT NULL,
    `lastCustomerOffer` INTEGER NULL,
    `lastMerchantOffer` INTEGER NULL,
    `agreedPrice` INTEGER NULL,
    `offerExpiresAt` DATETIME(3) NULL,
    `customerApproved` BOOLEAN NOT NULL DEFAULT false,
    `approvedAt` DATETIME(3) NULL,
    `razorpayOrderId` VARCHAR(191) NULL,
    `razorpayPaymentId` VARCHAR(191) NULL,
    `paymentStatus` VARCHAR(191) NULL,
    `failureReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `NegotiationSession_productId_idx`(`productId`),
    INDEX `NegotiationSession_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `razorpayOrderId` VARCHAR(191) NULL,
    `razorpayPaymentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Order_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditEvent` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `actor` VARCHAR(191) NOT NULL,
    `payload` TEXT NOT NULL,
    `explanation` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditEvent_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Merchant` ADD CONSTRAINT `Merchant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NegotiationSession` ADD CONSTRAINT `NegotiationSession_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `NegotiationSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditEvent` ADD CONSTRAINT `AuditEvent_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `NegotiationSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
