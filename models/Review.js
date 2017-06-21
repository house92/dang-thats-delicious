const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
    created: {
        type: Date,
        default: Date.now
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: "A review must belong to a user account"
    },
    store: {
        type: mongoose.Schema.ObjectId,
        ref: "Store",
        required: "A review must reference a store"
    },
    text: {
        type: String,
        required: "A review must have content"
    }
});

function autoPopulate(next) {
    this.populate("author");
    next();
}

reviewSchema.pre("find", autoPopulate);
reviewSchema.pre("findOne", autoPopulate);

module.exports = mongoose.model("Review", reviewSchema);
