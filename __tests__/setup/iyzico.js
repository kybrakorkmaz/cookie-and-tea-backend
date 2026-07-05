import { jest } from "@jest/globals";

jest.mock("../../src/config/iyzico.js", () => ({
    iyzico: {
        card: {
            create: jest.fn((request, callback) => callback(null, {
                status: "success",
                cardUserKey: "card_user_test_mock",
                cardToken: "card_token_test_mock",
                lastFourDigits: "1234",
                cardAssociation: "VISA",
                cardFamily: "Test Family",
            })),
        },
        subMerchant: {
            create: jest.fn((request, callback) => callback(null, {
                status: "success",
                subMerchantKey: "sub_merchant_test_mock",
            })),
        },
        threedsInitialize: {
            create: jest.fn((request, callback) => callback(null, {
                status: "success",
                threeDSHtmlContent: "PGh0bWw+dGVzdDwvaHRtbD4=",
            })),
        },
        threedsPayment: {
            create: jest.fn((request, callback) => callback(null, {
                status: "success",
                paymentId: "payment_test_mock",
            })),
        },
    },
}));
