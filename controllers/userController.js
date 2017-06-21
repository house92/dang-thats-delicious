const mongoose = require("mongoose");
const User = mongoose.model("User");
const promisify = require("es6-promisify");

exports.login = (req, res) => {
    res.render("login", { title: "Login" });
};

exports.registrationPage = (req, res) => {
    res.render("register", { title: "Register" });
};

exports.validateRegister = (req, res, next) => {
    req.sanitizeBody("name");
    req.checkBody("name", "You must supply a name!").notEmpty();
    req.checkBody("email", "You must supply a valid e-mail address!").isEmail();
    req.sanitizeBody("email").normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody("password", "You must supply a password!").notEmpty();
    req.checkBody("password-confirm", "You must confirm your password!").notEmpty();
    req.checkBody("password-confirm", "Passwords do not match").equals(req.body.password);

    const errors = req.validationErrors();
    if (errors.length) {
        req.flash("error", errors.map(err => err.msg));
        res.render("register", { title: "Register", body: req.body, flashes: req.flash() });
        return;
    }
    next();
};

exports.register = async (req, res, next) => {
    const user = new User({ email: req.body.email, name: req.body.name });
    const register = promisify(User.register, User);
    await register(user, req.body.password);
    next();
};

exports.account = (req, res) => {
    res.render("account", { title: "Edit Your Account" });
};

exports.updateAccount = async (req, res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email
    };
    const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: updates },
        {
            new: true,
            runValidators: true,
            context: "query"
        }
    );
    req.flash("success", "Profile successfully updated!");
    res.redirect("back");
};
