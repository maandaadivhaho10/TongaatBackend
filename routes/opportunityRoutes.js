const express = require("express");
const router = express.Router();

const opportunityController =
    require("../controllers/opportunityController");

const upload = require("../middleware/upload");

router.post(
    "/create",
    upload.single("image"),
    opportunityController.createOpportunity
);
router.get(
    "/target/:targetId",
    opportunityController.getOpportunitiesByTargetId
);
module.exports = router;
