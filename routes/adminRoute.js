const auth = require("../controllers/adminController");
const express = require("express");
const router = express()


const authJwt = require("../middlewares/auth");

const { profileImage, cityImage } = require('../middlewares/imageUpload');



module.exports = (app) => {

    // api/v1/admin/

    app.post("/api/v1/admin/registration", auth.registration);
    app.post("/api/v1/admin/login", auth.signin);
    app.put("/api/v1/admin/update", [authJwt.isAdmin], auth.update);
    app.post("/api/v1/admin/city/cities", [authJwt.isAdmin], cityImage.single('image'), auth.createCity);
    app.get("/api/v1/admin/city/cities", [authJwt.isAdmin], auth.getAllCities);
    app.get("/api/v1/admin/city/cities/:id", [authJwt.isAdmin], auth.getCityById);
    app.put("/api/v1/admin/city/cities/:id", [authJwt.isAdmin], cityImage.single('image'), auth.updateCityById);
    app.delete("/api/v1/admin/city/cities/:id", [authJwt.isAdmin], auth.deleteCityById);
    app.get("/api/v1/admin/profile", [authJwt.isAdmin], auth.getAllUser);
    app.get("/api/v1/admin/profile/:userId", [authJwt.isAdmin], auth.getUserById);
    app.delete('/api/v1/admin/users/profile/delete/:id', [authJwt.isAdmin], auth.deleteUser);
    app.get('/api/v1/admin/users/pending-verification', [authJwt.isAdmin], auth.getPendingVerificationUsers);
    app.put('/api/v1/admin/users/:id/update-verification-status', [authJwt.isAdmin], auth.updateVerificationStatus);
    app.get('/api/v1/admin/verified-users', [authJwt.isAdmin], auth.getVerifiedUsers);





}