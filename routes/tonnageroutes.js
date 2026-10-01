const express = require("express");
const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

const {
    createTonnage,
    getAllTonnage,
    getTonnageByUserId,getMyTonnage
} = require("../controllers/tonnagecontroller");

const router = express.Router();

router.post("/", authenticateToken,
    authorizeRoles(1),createTonnage);

router.get("/", authenticateToken,
    authorizeRoles(1), getAllTonnage);
router.get(
    "/byUserId",
    authenticateToken,
    authorizeRoles(1),
    getMyTonnage
);    


router.get("/user/:user_id", getTonnageByUserId);

module.exports = router;