const mongoose = require("mongoose");
const Store = mongoose.model("Store");
const User = mongoose.model("User");
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith("image/");
        if (isPhoto) {
            next(null, true);
        } else {
            next({ message: "Uploaded file type not alllowed" }. false);
        }
    }
};

exports.homePage = async (req, res) => {
    // TODO: Figure out how to promisify findRandom
    let stores;
    Store.findRandom({}, {}, { limit: 3 }, (err, results) => {
        if (err) {
            console.error(err);
            stores = Store.find();
            res.render("index", { title: "Home", stores });
        } else {
            stores = results;
            res.render("index", { title: "Home", stores });
        }
    });
};

exports.addStore = (req, res) => {
    res.render("editStore", { title: "Add Store" });
};

exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
    if (!req.file) {
        next();
        return;
    }
    const ext = req.file.mimetype.split("/")[1];
    req.body.photo = `${uuid.v4()}.${ext}`;

    // Resize the photo
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);

    next();
};

exports.createStore = async (req, res) => {
    req.body.author = req.user._id;
    const store = await (new Store(req.body)).save();
    req.flash("success", `Successfully created ${store.name}. Care to leave a review?`);
    res.redirect(`/stores/${store.slug}`);
};

exports.getStores = async (req, res) => {
    const page = req.params.page || 1;
    const limit = 6;
    const skip = (page * limit) - limit;

    const storesPromise = Store
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ created: "desc" });
    const countPromise = Store.count();
    const [stores, count] = await Promise.all([storesPromise, countPromise]);

    const pages = Math.ceil(count / limit);
    if (!stores.length && skip) {
        req.flash("info", "Invalid page number requested");
        res.redirect(`/stores/page/${pages}`);
        return;
    }

    res.render("stores", { title: "Stores", stores, page, pages, count });
};

const confirmOwner = (store, user) => {
    if (!store.author.equals(user._id)) {
        throw Error("You must own the store in order to edit it!");
    }
};

exports.editStore = async (req, res) => {
    const store = await Store.findOne({ _id: req.params.id });
    confirmOwner(store, req.user);
    res.render("editStore", { title: `Edit ${store.name}`, store })
};

exports.updateStore = async (req, res) => {
    req.body.location.type = 'Point';
    const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
        runValidators: true
    }).exec();
    req.flash("success", `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View store →</a>`);
    res.redirect(`/stores/${store._id}/edit`);
};

exports.showStore = async (req, res, next) => {
    const store = await Store.findOne({ slug: req.params.slug }).populate("author reviews");
    if (!store) return next();
    res.render("store", { title: store.name, store });
};

exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;

    const tagQuery = tag || { $exists: true };
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({ tags: tagQuery });
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

    res.render("tags", { title: "Tags", tags, tag, stores });
};

exports.mapPage = async (req, res) => {
    res.render("map", { title: "Map" });
};

exports.searchStores = async (req, res) => {
    const store = await Store.find(
        {
            $text: {
                $search: req.query.q
            }
        },
        {
            score: { $meta: "textScore" }
        }
    )
    .select("name slug")
    .sort({
        score: { $meta: "textScore" }
    })
    .limit(5);
    res.json(store);
};

exports.mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const query = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance: 10000
            }
        }
    };
    const stores = await Store.find(query).select("name description slug location photo").limit(10);
    res.json(stores);
};

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id) ? "$pull" : "$addToSet";
    const user = await User.findByIdAndUpdate(req.user._id,
        { [operator]: { hearts: req.params.id } },
        { new: true }
    );
    res.json(user);
};

exports.getTopStores = async (req, res) => {
    const stores = await Store.getTopStores();
    res.render("topStores", { title: "★ Top Stores!", stores });
};
