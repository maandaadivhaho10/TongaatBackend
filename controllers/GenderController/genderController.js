const {
  getGenderDistribution
} = require("../../UserService/GenderDistribution/genderService");

const fetchGenderDistribution = async (req, res) => {
  try {
    const distribution = await getGenderDistribution();

    return res.status(200).json({
      success: true,
      message: "Gender distribution retrieved successfully",
      data: distribution
    });

  } catch (error) {
    console.error(
      "Error fetching gender distribution:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve gender distribution"
    });
  }
};

module.exports = {
  fetchGenderDistribution
};