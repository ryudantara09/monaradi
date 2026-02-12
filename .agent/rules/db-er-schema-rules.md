---
trigger: always_on
---

### STRICT ENFORCEMENT REQUIRED

1.  **NO "Project" Entity**: The concept of "Project" has been merged into `Terrain`. Do not create or reference a separate Project model.
2.  **NO "Transaction" Entity**: Financial transactions are implicit. A sale is recorded when a `Parcel` status changes to `SOLD` and is linked to a `Customer` and `Contract`. Do NOT create a Transaction table.
3.  **NO "Roles"**: There is only one Owner (the system admin/user) and multiple Customers (buyers). Do not create `ContractParty` join tables with "roles".
4.  **Prisma 7 Compatibility**: 
    - Always use `prisma.config.ts` for migration/push commands.
    - Always instantiate client with `new PrismaClient({ datasourceUrl: process.env.DATABASE_URL })`.
    - Never add `url = env(...)` to `schema.prisma`.
5.  **Simplify**: Keep the schema flat. Avoid complex many-to-many join tables unless absolutely necessary (currently none exist).
