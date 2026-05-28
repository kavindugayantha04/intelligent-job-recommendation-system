const Log = require("../models/log");
const User = require("../models/User");

const createLog = async (userId, action, description) => {
  try {
    let actor = "Unknown User";

    if (userId) {
      const user = await User.findById(userId).select("name email");
      if (user) {
        actor = user.email || user.name || userId.toString();
      }
    }

    await Log.create({
      userId: actor,
      action,
      description
    });
  } catch (error) {
    console.error("Log creation failed:", error.message);
  }
};

module.exports = createLog;