import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import type Stripe from "stripe";
import {
  processTrainingPaymentSucceeded,
  type TrainingPaymentEmail,
  type TrainingPaymentProcessorDeps,
} from "./training-payment-processor";

const baseMetadata = {
  type: "training_membership",
  trainingGroupId: "group-1",
  trainingHoldTokenHash: "hold-hash",
  trainingProgram: "Začetni",
  trainingVenue: "Kodeljevo",
  trainingCity: "Ljubljana",
  trainingWeekday: "ponedeljek",
  trainingTime: "20:00",
  customerName: "Ana Novak",
  customerEmail: "ana@example.com",
  customerPhone: "+38640111222",
};

function paymentIntent(metadata: Record<string, string> = {}, amount = 3500) {
  return {
    id: "pi_training_123",
    amount,
    metadata: { ...baseMetadata, ...metadata },
  } as unknown as Stripe.PaymentIntent;
}

function makeDeps(intent = paymentIntent()) {
  const state = {
    intent,
    updates: [] as Array<{ id: string; metadata: Stripe.MetadataParam }>,
    emails: [] as TrainingPaymentEmail[],
    contacts: [] as Array<{ email: string; listIds: number[] }>,
    confirmCalls: 0,
    minimaxCalls: 0,
    listNames: [] as string[],
  };

  const deps: TrainingPaymentProcessorDeps = {
    retrievePaymentIntent: async () => state.intent,
    updatePaymentIntent: async (id, metadata) => {
      state.updates.push({ id, metadata });
      state.intent = {
        ...state.intent,
        metadata: { ...state.intent.metadata, ...metadata },
      } as Stripe.PaymentIntent;
    },
    confirmTrainingHold: async () => {
      state.confirmCalls += 1;
      return { ok: true, alreadyConfirmed: false };
    },
    getTrainingSettings: async () => ({ membershipFee: 35 }),
    findOrCreateTrainingGroupList: async (_groupId, name) => {
      state.listNames.push(name);
      return 123;
    },
    upsertContact: async (params) => {
      state.contacts.push({ email: params.email, listIds: params.listIds });
    },
    sendTransactionalEmail: async (params) => {
      state.emails.push(params);
    },
    isMinimaxInvoicingEnabled: () => true,
    createTrainingMinimaxInvoice: async () => {
      state.minimaxCalls += 1;
      return {
        issuedInvoiceId: 42,
        invoiceNumber: "1/2026",
        pdf: {
          fileName: "racun.pdf",
          contentBase64: "JVBERi0x",
        },
      };
    },
    notifyEmail: "info@apnea.si",
    siteEmail: "info@apnea.si",
    requireMinimaxPdf: true,
  };

  return { deps, state };
}

describe("processTrainingPaymentSucceeded", () => {
  beforeEach(() => {
    delete process.env.MINIMAX_TRAINING_REQUIRE_PDF;
  });

  test("exits without side effects when the payment was already processed", async () => {
    const { deps, state } = makeDeps(paymentIntent({ trainingProcessed: "true" }));

    await processTrainingPaymentSucceeded(state.intent, deps);

    assert.equal(state.confirmCalls, 0);
    assert.equal(state.minimaxCalls, 0);
    assert.equal(state.emails.length, 0);
    assert.equal(state.updates.length, 0);
  });

  test("sends confirmation emails with the Minimax PDF and marks Stripe metadata", async () => {
    const { deps, state } = makeDeps();

    await processTrainingPaymentSucceeded(state.intent, deps);

    assert.equal(state.confirmCalls, 1);
    assert.equal(state.minimaxCalls, 1);
    assert.deepEqual(state.contacts, [{ email: "ana@example.com", listIds: [123] }]);
    assert.equal(state.emails.length, 2);
    assert.equal(state.emails[0].to.email, "ana@example.com");
    assert.deepEqual(state.emails[0].attachments, [
      { name: "racun.pdf", contentBase64: "JVBERi0x" },
    ]);
    assert.equal(state.emails[1].to.email, "info@apnea.si");
    const finalUpdate = state.updates.at(-1)?.metadata;
    assert.equal(finalUpdate?.trainingProcessed, "true");
    assert.equal(finalUpdate?.minimaxInvoiceStatus, "completed");
    assert.equal(finalUpdate?.minimaxIssuedInvoiceId, "42");
    assert.equal(finalUpdate?.minimaxPdfGenerated, "true");
  });

  test("recovers a retry after Minimax invoice creation without reconfirming the hold", async () => {
    const { deps, state } = makeDeps(
      paymentIntent({ minimaxIssuedInvoiceId: "42", minimaxPdfGenerated: "true" })
    );
    deps.confirmTrainingHold = async () => {
      state.confirmCalls += 1;
      return { ok: false, reason: "hold_missing" };
    };

    await processTrainingPaymentSucceeded(state.intent, deps);

    assert.equal(state.confirmCalls, 0);
    assert.equal(state.emails[0].to.email, "ana@example.com");
    const finalUpdate = state.updates.at(-1)?.metadata;
    assert.equal(finalUpdate?.trainingHoldConfirmed, "true");
    assert.equal(finalUpdate?.trainingProcessed, "true");
  });

  test("does not send normal customer confirmation when Minimax fails", async () => {
    const { deps, state } = makeDeps();
    deps.createTrainingMinimaxInvoice = async () => {
      state.minimaxCalls += 1;
      throw new Error("Minimax is down");
    };

    await assert.rejects(
      () => processTrainingPaymentSucceeded(state.intent, deps),
      /Minimax is down/
    );

    assert.equal(state.confirmCalls, 1);
    assert.equal(state.minimaxCalls, 1);
    assert.equal(state.contacts.length, 0);
    assert.equal(state.emails.length, 1);
    assert.equal(state.emails[0].to.email, "info@apnea.si");
    assert.match(state.emails[0].subject, /Minimax račun ni bil ustvarjen/);
    const failedUpdate = state.updates.at(-1)?.metadata;
    assert.equal(failedUpdate?.minimaxInvoiceStatus, "failed");
    assert.equal(failedUpdate?.minimaxFailureAlertSent, "true");
    assert.equal(failedUpdate?.trainingProcessed, undefined);
  });

  test("treats a missing Minimax PDF as a blocking failure by default", async () => {
    const { deps, state } = makeDeps();
    deps.createTrainingMinimaxInvoice = async () => {
      state.minimaxCalls += 1;
      return {
        issuedInvoiceId: 43,
        invoiceNumber: "2/2026",
      };
    };

    await assert.rejects(
      () => processTrainingPaymentSucceeded(state.intent, deps),
      /did not return a PDF attachment/
    );

    assert.equal(state.contacts.length, 0);
    assert.equal(state.emails.length, 1);
    assert.equal(state.emails[0].to.email, "info@apnea.si");
    assert.equal(state.updates.at(-1)?.metadata.minimaxInvoiceStatus, "failed");
  });

  test("sends only an admin alert when Sanity cannot confirm capacity", async () => {
    const { deps, state } = makeDeps();
    deps.confirmTrainingHold = async () => {
      state.confirmCalls += 1;
      return { ok: false, reason: "capacity_conflict" };
    };

    await processTrainingPaymentSucceeded(state.intent, deps);

    assert.equal(state.confirmCalls, 1);
    assert.equal(state.minimaxCalls, 0);
    assert.equal(state.contacts.length, 0);
    assert.equal(state.emails.length, 1);
    assert.equal(state.emails[0].to.email, "info@apnea.si");
    assert.match(state.emails[0].subject, /plačan trening brez prostega mesta/);
    assert.equal(state.updates.at(-1)?.metadata.trainingCapacityConflict, "true");
    assert.equal(state.updates.at(-1)?.metadata.trainingProcessed, undefined);
  });

  test("sends only an admin alert when the paid hold is missing or expired", async () => {
    const { deps, state } = makeDeps();
    deps.confirmTrainingHold = async () => {
      state.confirmCalls += 1;
      return { ok: false, reason: "hold_missing" };
    };

    await processTrainingPaymentSucceeded(state.intent, deps);

    assert.equal(state.confirmCalls, 1);
    assert.equal(state.minimaxCalls, 0);
    assert.equal(state.contacts.length, 0);
    assert.equal(state.emails.length, 1);
    assert.equal(state.emails[0].to.email, "info@apnea.si");
    assert.match(state.emails[0].subject, /plačan trening brez prostega mesta/);
    assert.equal(state.updates.at(-1)?.metadata.trainingCapacityConflict, "true");
    assert.equal(state.updates.at(-1)?.metadata.trainingProcessed, undefined);
  });
});
