import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/apiClient", () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import apiClient from "../api/apiClient";
import { deleteTenantOwnerAccount } from "./settingsService";

describe("settingsService deleteTenantOwnerAccount", () => {
  beforeEach(() => {
    apiClient.delete.mockReset();
  });

  it("submits the guarded delete-account payload", async () => {
    apiClient.delete.mockResolvedValueOnce({
      data: {
        data: {
          message: "Account deleted",
        },
      },
    });

    const result = await deleteTenantOwnerAccount({
      tenantId: 17,
      currentPassword: "topsecret",
      confirmEmail: "owner@farm.test",
      confirmWorkspaceName: "Blue Basin Farm",
      confirmationText: "DELETE MY ACCOUNT",
    });

    expect(apiClient.delete).toHaveBeenCalledWith("/settings/account", {
      data: {
        tenantId: 17,
        currentPassword: "topsecret",
        confirmEmail: "owner@farm.test",
        confirmWorkspaceName: "Blue Basin Farm",
        confirmationText: "DELETE MY ACCOUNT",
      },
    });
    expect(result).toEqual({ message: "Account deleted" });
  });

  it("surfaces a clear message when backend support is missing", async () => {
    apiClient.delete.mockRejectedValueOnce({
      response: {
        status: 404,
        data: {
          message: "Not found",
        },
      },
    });

    await expect(
      deleteTenantOwnerAccount({
        tenantId: 17,
        currentPassword: "topsecret",
      }),
    ).rejects.toThrow(
      "Delete account is not live on the backend yet. The safety flow is ready, but the API still needs final support.",
    );
  });
});
