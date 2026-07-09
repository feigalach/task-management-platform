import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByToTasks1700000000002 implements MigrationInterface {
  name = 'AddCreatedByToTasks1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN "created_by_user_id" uuid`);

    // Backfill any pre-existing rows: assume whoever currently owns the
    // task also opened it, since we have no better information for rows
    // created before this column existed.
    await queryRunner.query(`UPDATE "tasks" SET "created_by_user_id" = "assigned_user_id" WHERE "created_by_user_id" IS NULL`);

    await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "created_by_user_id" SET NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_created_by_user"
        FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_created_by_user_id" ON "tasks" ("created_by_user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_created_by_user"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "created_by_user_id"`);
  }
}
