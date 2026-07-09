import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskHistoryTable1700000000003 implements MigrationInterface {
  name = 'CreateTaskHistoryTable1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "task_history" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "task_id" uuid NOT NULL,
        "action" varchar(20) NOT NULL,
        "from_status" integer,
        "to_status" integer NOT NULL,
        "from_user_id" uuid,
        "to_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_task_history_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_task_history_task" FOREIGN KEY ("task_id")
          REFERENCES "tasks"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_task_history_task_id" ON "task_history" ("task_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "task_history"`);
  }
}
