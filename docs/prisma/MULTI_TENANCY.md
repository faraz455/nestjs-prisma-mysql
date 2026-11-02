# Multi-Tenancy

Multi-tenancy is a software architecture principle where a single instance of software serves multiple customers, known as tenants. This model enables organizations to share resources efficiently, reduce operational costs, and ensure secure, isolated environments for each tenant. It's particularly beneficial for businesses that cater to various customers with distinct needs and requirements.

## Explanation

In cloud computing, multi-tenancy means that multiple clients use the same computing resources from a cloud provider, yet their data and operations remain isolated and secure. This separation ensures privacy and security while optimizing resource use and cost-effectiveness. Multi-tenancy is fundamental in cloud models like IaaS, PaaS, SaaS, as well as containerized and serverless environments.

### Advantages of Multi-Tenancy

1. **Optimized Resource Utilization:** Sharing machines among multiple tenants maximizes resource use, avoiding the inefficiency of dedicating one machine to a single tenant.

2. **Cost Efficiency:** Shared resources allow cloud providers to offer services at a lower cost compared to dedicated infrastructure for each customer.

### Challenges of Multi-Tenancy

1. **Security and Compliance:** Some industries face regulatory constraints that prohibit storing data on shared infrastructure. Additionally, rare security breaches or data corruption could affect multiple tenants if the infrastructure isn't properly configured.

2. **Performance Impact:** Excessive resource consumption by one tenant can degrade performance for others. Proper infrastructure management by the cloud provider is essential to prevent this issue.

## This repository

Each host section in `env.conf` names that tenant's MySQL database. Copy `env.conf.example` to `env.conf` and `.env.example` to `.env`. Both copies are gitignored. The running API reads `env.conf`, including `REFRESH_COOKIE_NAME`. `.env` `DATABASE_URL` is for the Prisma CLI and `yarn data:reset` only.

`yarn data:reset` deletes every application row in that one database, then inserts sample roles, users, permissions, and articles for local testing. It does not walk `env.conf`, so other tenants stay as they are. Skip the command when the database holds data you need to keep. Point `DATABASE_URL` at a tenant and run `yarn prisma migrate deploy` for each database you want to update, then create your own users. Sample usernames and passwords are test logins in `prisma/seeding-helpers/user.seed.ts`. Change them there if you use those accounts.
