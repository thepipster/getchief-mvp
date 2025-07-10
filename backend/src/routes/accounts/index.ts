import express from "express";
import "express-async-errors";
import AuthApi from "../user/auth-api";
import AccountApi from "./account-api";
import AccountUsersApi from "./account-users-api";

const router = express.Router();

router.get("/", AuthApi.isUber, AccountApi.getAccounts);
router.get("/me", AuthApi.isUser, AccountApi.get);
router.put("/:accountId", AuthApi.isUber, AccountApi.update);

router.put(
    "/:accountId/user/:userId",
    AuthApi.isUber,
    AccountUsersApi.addUserToAccount
);
router.delete(
    "/:accountId/user/:userId",
    AuthApi.isUber,
    AccountUsersApi.removeUserFromAccount
);

export const accountService = router;
