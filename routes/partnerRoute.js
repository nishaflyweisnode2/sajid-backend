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
    app.post('/api/v1/partner/locations/create', [authJwt.isPartner], auth.createLocation);
    app.get('/api/v1/partner/locations/getAll', [authJwt.isPartner], auth.getAllLocations);
    app.get('/api/v1/partner/locations/:id', [authJwt.isPartner], auth.getLocationById);
    app.put('/api/v1/partner/locations/:id', [authJwt.isPartner], auth.updateLocationById);
    app.delete('/api/v1/partner/locations/:id', [authJwt.isPartner], auth.deleteLocationById);
    app.get('/api/v1/partner/locations/type/:type', [authJwt.isPartner], auth.getLocationsByType);
    app.post('/api/v1/partner/bikes', [authJwt.isPartner], bikeImage.array('image'), auth.createBike);
    app.get('/api/v1/partner/bikes', [authJwt.isPartner], auth.getAllBikes);
    app.get('/api/v1/partner/bikes/:id', [authJwt.isPartner], auth.getBikeById);
    app.put('/api/v1/partner/bikes/:id', [authJwt.isPartner], bikeImage.array('image'), auth.updateBikeById);
    app.delete('/api/v1/partner/bikes/:id', [authJwt.isPartner], auth.deleteBikeById);




}