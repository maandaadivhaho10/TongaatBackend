
const fundingService = require(
    "../../UserService/Funding/fundingService"
);

// =====================================================
// HELPERS
// =====================================================

const sendError = (res, error) => {
    console.error("Funding API error:", error);

    return res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode
            ? error.message
            : "An internal server error occurred"
    });
};

const validId = (value) => {
    const number = Number(value);

    return Number.isSafeInteger(number) && number > 0;
};

const validText = (value) =>
    typeof value === "string" &&
    value.trim().length > 0;

// =====================================================
// CREATE FUNDING OPPORTUNITY
// =====================================================

const createFunding = async (req, res) => {
    try {
        const {
            title,
            institution_funder,
            description
        } = req.body;

        if (
            !validText(title) ||
            !validText(institution_funder) ||
            !validText(description)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Title, institution/funder and description are required"
            });
        }

        const funding =
            await fundingService.createFundingService({
                title: title.trim(),
                institution_funder: institution_funder.trim(),
                description: description.trim(),
                published_by: req.user.user_id
            });

        return res.status(201).json({
            success: true,
            message: "Funding opportunity created successfully",
            data: funding
        });

    } catch (error) {
        return sendError(res, error);
    }
};

// =====================================================
// GET ALL FUNDING OPPORTUNITIES
// =====================================================

const getAllFunding = async (req, res) => {
    try {
        const funding =
            await fundingService.getAllFundingService();

        return res.status(200).json({
            success: true,
            count: funding.length,
            data: funding
        });

    } catch (error) {
        return sendError(res, error);
    }
};

// =====================================================
// GET FUNDING BY ID
// =====================================================

const getFundingById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid funding ID"
            });
        }

        const funding =
            await fundingService.getFundingByIdService(id);

        if (!funding) {
            return res.status(404).json({
                success: false,
                message: "Funding opportunity not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: funding
        });

    } catch (error) {
        return sendError(res, error);
    }
};

// =====================================================
// UPDATE FUNDING STATUS
// =====================================================

const updateFundingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid funding ID"
            });
        }

        const allowedStatuses = [
            "OPEN",
            "CLOSED",
            "CANCELLED"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid funding status"
            });
        }

        const updated =
            await fundingService.updateFundingStatusService(
                id,
                status
            );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Funding opportunity not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Funding status updated successfully"
        });

    } catch (error) {
        return sendError(res, error);
    }
};

// =====================================================
// APPLY FOR FUNDING
// =====================================================

const applyForFunding = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid funding ID"
            });
        }

        const result =
            await fundingService.applyForFundingService(
                id,
                req.user.user_id
            );

        return res.status(201).json({
            success: true,
            message: "Funding application submitted successfully",
            data: result
        });

    } catch (error) {
        return sendError(res, error);
    }
};

// =====================================================
// GET FUNDING RESPONSES
// =====================================================

const getFundingResponses = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid funding ID"
            });
        }

        const funding =
            await fundingService.getFundingByIdService(id);

        if (!funding) {
            return res.status(404).json({
                success: false,
                message: "Funding opportunity not found"
            });
        }

        const responses =
            await fundingService.getFundingResponsesService(id);

        return res.status(200).json({
            success: true,
            funding,
            count: responses.length,
            responses
        });

    } catch (error) {
        return sendError(res, error);
    }
};

// =====================================================
// GET MY APPLICATIONS
// =====================================================

const getMyFundingApplications = async (req, res) => {
    try {
        const applications =
            await fundingService.getMyFundingApplicationsService(
                req.user.user_id
            );

        return res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });

    } catch (error) {
        return sendError(res, error);
    }
};

// =====================================================
// UPDATE APPLICATION STATUS
// =====================================================

const updateFundingResponseStatus = async (req, res) => {
    try {
        const { responseId } = req.params;
        const { status } = req.body;

        if (!validId(responseId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid response ID"
            });
        }

        const allowedStatuses = [
            "SUBMITTED",
            "UNDER_REVIEW",
            "ACCEPTED",
            "REJECTED"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application status"
            });
        }

        const updated =
            await fundingService.updateFundingResponseStatusService(
                responseId,
                status
            );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Funding response not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Application status updated successfully"
        });

    } catch (error) {
        return sendError(res, error);
    }
};

module.exports = {
    createFunding,
    getAllFunding,
    getFundingById,
    updateFundingStatus,
    applyForFunding,
    getFundingResponses,
    getMyFundingApplications,
    updateFundingResponseStatus
};
