import { app } from "./../app";
import request from "supertest";
import {
  expect,
  test,
  beforeAll,
  afterAll,
  describe,
  beforeEach,
} from "vitest";
import { execSync } from "node:child_process"; // para poder executar comandos no terminal via código

describe("transactions", () => {
  beforeAll(async () => {
    // roda algo antes de todos os testes, apenas uma vez
    await app.ready(); // espera o app terminar de cadastrar os plugins, para não quebrar os testes
  });

  afterAll(async () => {
    // roda algo depois de todos os testes
    await app.close();
  });

  beforeEach(() => {
    // antes de cada teste
    execSync("npm run knex migrate:rollback --all"); // apaga o banco
    execSync("npm run knex migrate:latest"); // cria denovo
    // para testes é bom ter um banco vazio
  });

  test("User should be able to create a new transaction", async () => {
    const response = await request(app.server).post("/transactions").send({
      title: "New transaction",
      amount: 1000,
      type: "debit",
    });

    expect(response.statusCode).toEqual(201);
  });

  test("User should be able to list all transactions", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "New transaction",
        amount: 1000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    const response = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual([
      expect.objectContaining({
        title: "New transaction",
        amount: 1000,
      }),
    ]);
  });

  test("User should be able to get a specific transaction", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "New transaction",
        amount: 1000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    const listResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies);

    const transactionId = listResponse.body[0].id;

    const response = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        title: "New transaction",
        amount: 1000,
      })
    );
  });

  test("User should be able to get the summary", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Credit transaction",
        amount: 8000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    await request(app.server)
      .post("/transactions")
      .set("Cookie", cookies)
      .send({
        title: "Debit transaction",
        amount: 3000,
        type: "debit",
      });

    const response = await request(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ amount: 5000 });
  });
});
