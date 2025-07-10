import express from "express";
import "express-async-errors";
import AuthApi from "./auth-api";
import UserApi from "./user-api";

const router = express.Router();

router.get("/", AuthApi.isAdmin, UserApi.getAccountUsers);
router.post("/", AuthApi.isUber, UserApi.searchUsers);
router.get("/me", AuthApi.isUser, UserApi.getMe);
router.get("/:userId", AuthApi.isAdmin, UserApi.loadUser, UserApi.get);
router.delete("/:userId", AuthApi.isAdmin, UserApi.loadUser, UserApi.delete);
router.put("/:userId", AuthApi.isAdmin, UserApi.loadUser, UserApi.update);

export const userService = router;
