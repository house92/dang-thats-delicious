const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");
const { catchErrors } = require("../handlers/errorHandlers");

// Store routes
router.get("/", catchErrors(storeController.homePage));
router.get("/stores", catchErrors(storeController.getStores));
router.get("/stores/page/:page", catchErrors(storeController.getStores));
router.get("/add",
    authController.isLoggedIn,
    storeController.addStore
);
router.get("/stores/:id/edit", catchErrors(storeController.editStore));
router.get("/stores/:slug", catchErrors(storeController.showStore));
router.get("/map", storeController.mapPage);
router.get("/top", catchErrors(storeController.getTopStores));

router.post("/add",
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.createStore)
);
router.post("/add/:id",
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.updateStore));

router.get("/tags", catchErrors(storeController.getStoresByTag));
router.get("/tags/:tag", catchErrors(storeController.getStoresByTag));

// User routes
router.get("/login", userController.login);
router.get("/logout", authController.logout);
router.get("/register", userController.registrationPage);
router.get("/account",
    authController.isLoggedIn,
    userController.account
);
router.get("/account/reset/:token", catchErrors(authController.resetPassword));

router.post("/login", authController.login);
router.post("/register",
    userController.validateRegister,
    catchErrors(userController.register),
    authController.login
);
router.post("/account", catchErrors(userController.updateAccount));
router.post("/account/forgot", catchErrors(authController.forgotPassword));
router.post("/account/reset/:token",
    authController.confirmPasswordMatch,
    catchErrors(authController.updatePassword)
);

// Review routes
router.post("/reviews/:id",
    authController.isLoggedIn,
    catchErrors(reviewController.addReview)
);

// API
router.get("/api/search", catchErrors(storeController.searchStores));
router.get("/api/stores/near", catchErrors(storeController.mapStores));

router.post("/api/stores/:id/heart", catchErrors(storeController.heartStore));

module.exports = router;
