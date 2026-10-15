const express = require("express");

const {
  refreshAccessToken,
  logoutUser,
} = require("../../controllers/RefreashTokenController/refreshController");

const router = express.Router();

router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

module.exports = router;