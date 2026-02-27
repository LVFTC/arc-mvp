CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`payload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ikigai_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`circle` enum('love','good_at','world_needs','paid_for') NOT NULL,
	`text` text NOT NULL,
	`rank` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ikigai_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `responses_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dimension` varchar(64) NOT NULL,
	`promptId` varchar(64) NOT NULL,
	`text` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `responses_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `responses_likert` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dimension` varchar(64) NOT NULL,
	`itemId` varchar(64) NOT NULL,
	`value` int NOT NULL,
	`reverseFlag` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `responses_likert_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityType` varchar(32) NOT NULL,
	`entityId` int NOT NULL,
	`tag` varchar(128) NOT NULL,
	`source` varchar(32) NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_choices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chosenZone` enum('passion','profession','mission','vocation'),
	`chosenFocus` text,
	`assessmentStatus` enum('in_progress','completed') NOT NULL DEFAULT 'in_progress',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_choices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `lgpdConsentAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `lgpdConsentVersion` varchar(16);