import { FastifyInstance } from "fastify";
import { knex } from "../database";
import crypto from "node:crypto";
import { z } from "zod";
import { checkSessionId } from "../middlewares/checkSessionId";

export async function transactionRoutes(app: FastifyInstance) {
  app.get("/transactions", { preHandler: checkSessionId }, async (req) => {
    // preHandler é um middleware
    const { sessionId } = req.cookies;
    const transactions = await knex("transactions")
      .select("*")
      .where({ session_id: sessionId });

    return transactions;
  });

  app.post("/transactions", async (req, res) => {
    const createTransactionBodySchema = z.object({
      // para validar o body
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(req.body); // se o body não estiver com o tipo correto ja da erro

    let sessionId = req.cookies.sessionId; // procura dentro dos cookies se ja existe uma sessionId

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      res.cookie("sessionId", sessionId, {
        // cria um sessionId para esse usuário e armazena nos cookies
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias para expirar o cookie
      });
    }

    await knex("transactions").insert({
      id: crypto.randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1, // validação pelo tipo, credito soma, debito subtrai (coloca negativo)
      session_id: sessionId,
    });

    res.status(201).send();
  });

  app.get("/transactions/:id", { preHandler: checkSessionId }, async (req) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    });
    const { sessionId } = req.cookies;

    const { id } = getTransactionParamsSchema.parse(req.params);

    const transaction = await knex("transactions")
      .select("*")
      .where({ id, session_id: sessionId })
      .first();
    return transaction;
  });

  app.get(
    "/transactions/summary",
    { preHandler: checkSessionId },
    async (req) => {
      const { sessionId } = req.cookies;
      const summary = await knex("transactions")
        .where({ session_id: sessionId })
        .sum("amount", { as: "amount" })
        .first();

      return summary;
    }
  );
}
