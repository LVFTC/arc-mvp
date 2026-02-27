CREATE TABLE `user_plan_90d` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cycleObjective` text,
	`checkpoint1Date` varchar(16),
	`checkpoint2Date` varchar(16),
	`checkpoint3Date` varchar(16),
	`selected70` json,
	`selected20` json,
	`selected10` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_plan_90d_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_plan_90d_userId_unique` UNIQUE(`userId`)
);
