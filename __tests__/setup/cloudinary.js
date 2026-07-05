import { jest } from "@jest/globals";

jest.mock("../../src/config/cloudinary.js", () => ({
    uploadToCloudinary: jest.fn().mockResolvedValue("https://res.cloudinary.com/mock-cloud/image/upload/fake_file.png")
}));