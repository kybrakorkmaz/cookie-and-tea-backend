import { jest } from "@jest/globals";

jest.mock("../../src/config/stripe.js", () => ({
    stripe: {
        accounts: {
            create: jest.fn().mockResolvedValue({ id: "acct_test_mock" }),
            retrieve: jest.fn().mockResolvedValue({
                id: "acct_test_mock",
                charges_enabled: true,
                payouts_enabled: true,
                details_submitted: true,
            }),
        },
        accountLinks: {
            create: jest.fn().mockResolvedValue({ url: "https://connect.stripe.com/setup/test" }),
        },
        paymentIntents: {
            create: jest.fn().mockResolvedValue({
                id: "pi_test_mock",
                client_secret: "pi_test_mock_secret",
                status: "requires_payment_method",
            }),
        },
    },
}));
