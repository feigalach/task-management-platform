import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasksTable1700000000001 implements MigrationInterface {
  name = 'CreateTasksTable1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" varchar(50) NOT NULL,
        "status" integer NOT NULL DEFAULT 1,
        "isClosed" boolean NOT NULL DEFAULT false,
        "assigned_user_id" uuid NOT NULL,
        "customFields" jsonb NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tasks_assigned_user" FOREIGN KEY ("assigned_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_tasks_assigned_user_id" ON "tasks" ("assigned_user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tasks"`);
  }
}
