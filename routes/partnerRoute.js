const auth = require("../controllers/partnerController");
const express = require("express");
const router = express()


const authJwt = require("../middlewares/auth");

const { profileImage, cityImage, bikeImage } = require('../middlewares/imageUpload');



module.exports = (app) => {

    // api/v1/partner/

    app.post("/api/v1/partner/registration", auth.registration);
    app.post("/api/v1/partner/login", auth.signin);
    app.put("/api/v1/partner/update", [authJwt.isPartner], auth.update);
    app.get('/api/v1/partner/get-stores', [authJwt.isPartner], auth.getStoresByPartnerId);






}