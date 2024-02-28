-- CreateTable
CREATE TABLE `UserRefreshToken` (
    `userRefreshToken` CHAR(40) NOT NULL,
    `userId` CHAR(40) NOT NULL,
    `refreshToken` VARCHAR(191) NOT NULL,
    `ExpiresAt` DATETIME(3) NOT NULL,
    `revoked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserRefreshToken_refreshToken_key`(`refreshToken`),
    INDEX `UserRefreshToken_userId_idx`(`userId`),
    PRIMARY KEY (`userRefreshToken`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserRefreshToken` ADD CONSTRAINT `UserRefreshToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;
