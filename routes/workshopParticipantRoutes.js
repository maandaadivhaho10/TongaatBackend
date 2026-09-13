const express = require("express");
const router = express.Router();

const workshopParticipantController =
    require("../controllers/workshopParticipantController");

// Accept or decline workshop
router.post(
    "/:workshopId/respond",
    workshopParticipantController.respondToWorkshop
);

module.exports = router;