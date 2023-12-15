const auth = require("../controllers/adminController");
const express = require("express");
const router = express()


const authJwt = require("../middlewares/auth");

const { profileImage, cityImage, storeImage, bikeImage, accessoryCategoryImage, accessoryImage } = require('../middlewares/imageUpload');



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
    app.post('/api/v1/admin/locations/create', [authJwt.isAdmin], auth.createLocation);
    app.get('/api/v1/admin/locations/getAll', [authJwt.isAdmin], auth.getAllLocations);
    app.get('/api/v1/admin/locations/:id', [authJwt.isAdmin], auth.getLocationById);
    app.put('/api/v1/admin/locations/:id', [authJwt.isAdmin], auth.updateLocationById);
    app.delete('/api/v1/admin/locations/:id', [authJwt.isAdmin], auth.deleteLocationById);
    app.get('/api/v1/admin/locations/type/:type', [authJwt.isAdmin], auth.getLocationsByType);
    app.post('/api/v1/admin/stores/create', [authJwt.isAdmin], storeImage.single('image'), auth.createStore);
    app.get('/api/v1/admin/stores/getAll', [authJwt.isAdmin], auth.getAllStores);
    app.get('/api/v1/admin/stores/:storeId', [authJwt.isAdmin], auth.getStoreById);
    app.put('/api/v1/admin/stores/:storeId', [authJwt.isAdmin], storeImage.single('image'), auth.updateStoreById);
    app.delete('/api/v1/admin/stores/:storeId', [authJwt.isAdmin], auth.deleteStoreById);
    app.put('/api/v1/admin/stores/update-partner/:storeId', [authJwt.isAdmin], auth.updatePartnerIdInStore);
    app.get('/api/v1/admin/stores/get-partner/:storeId', [authJwt.isAdmin], auth.getPartnerIdByStoreId);
    app.delete('/api/v1/admin/stores/delete-partner/:storeId', [authJwt.isAdmin], auth.deletePartnerIdFromStore);
    app.post('/api/v1/admin/bikes', [authJwt.isAdmin], bikeImage.array('image'), auth.createBike);
    app.get('/api/v1/admin/bikes', [authJwt.isAdmin], auth.getAllBikes);
    app.get('/api/v1/admin/bikes/:id', [authJwt.isAdmin], auth.getBikeById);
    app.put('/api/v1/admin/bikes/:id', [authJwt.isAdmin], bikeImage.array('image'), auth.updateBikeById);
    app.delete('/api/v1/admin/bikes/:id', [authJwt.isAdmin], auth.deleteBikeById);
    app.post('/api/v1/admin/bikeStoreRelation', [authJwt.isAdmin], auth.createBikeStoreRelation);
    app.get('/api/v1/admin/bikeStoreRelations', [authJwt.isAdmin], auth.getAllBikeStoreRelations);
    app.get('/api/v1/admin/bikeStoreRelation/:relationId', [authJwt.isAdmin], auth.getBikeStoreRelationById);
    app.put('/api/v1/admin/bikeStoreRelation/:relationId', [authJwt.isAdmin], auth.updateBikeStoreRelation);
    app.delete('/api/v1/admin/bikeStoreRelation/:relationId', [authJwt.isAdmin], auth.deleteBikeStoreRelation);
    app.get('/api/v1/admin/bikes-by-store-and-partner/:storeId/:partnerId', [authJwt.isAdmin], auth.getBikesByStoreAndPartner);
    app.get('/api/v1/admin/accessories/partner/:partnerId', [authJwt.isAdmin], auth.getAccessoryByPartnerId);
    app.post('/api/v1/admin/coupons', [authJwt.isAdmin], auth.createCoupon);
    app.get('/api/v1/admin/coupons', [authJwt.isAdmin], auth.getAllCoupons);
    app.get('/api/v1/admin/coupons/:id', [authJwt.isAdmin], auth.getCouponById);
    app.put('/api/v1/admin/coupons/:id', [authJwt.isAdmin], auth.updateCouponById);
    app.delete('/api/v1/admin/coupons/:id', [authJwt.isAdmin], auth.deleteCouponById);
    app.get('/api/v1/admin/bookings', [authJwt.isAdmin], auth.getAllBookings);
    app.get('/api/v1/admin/bookings/:id', [authJwt.isAdmin], auth.getBookingById);
    app.post('/api/v1/admin/categories', [authJwt.isAdmin], accessoryCategoryImage.single('image'), auth.createAccessoryCategory);
    app.get('/api/v1/admin/categories', [authJwt.isAdmin], auth.getAllAccessoryCategories);
    app.get('/api/v1/admin/categories/:categoryId', [authJwt.isAdmin], auth.getAccessoryCategoryById);
    app.put('/api/v1/admin/categories/:categoryId', [authJwt.isAdmin], accessoryCategoryImage.single('image'), auth.updateAccessoryCategory);
    app.delete('/api/v1/admin/categories/:categoryId', [authJwt.isAdmin], auth.deleteAccessoryCategory);
    app.post('/api/v1/admin/accessories', [authJwt.isAdmin], accessoryImage.single('image'), auth.createAccessory);
    app.get('/api/v1/admin/accessories', [authJwt.isAdmin], auth.getAllAccessories);
    app.get('/api/v1/admin/accessories/:accessoryId', [authJwt.isAdmin], auth.getAccessoryById);
    app.put('/api/v1/admin/accessories/:accessoryId', [authJwt.isAdmin], accessoryImage.single('image'), auth.updateAccessory);
    app.delete('/api/v1/admin/accessories/:accessoryId', [authJwt.isAdmin], auth.deleteAccessory);
    app.get('/api/v1/admin/accessories/category/:categoryId', [authJwt.isAdmin], auth.getAllAccessoriesByCategoryId);
    app.post('/api/v1/admin/gst', [authJwt.isAdmin], auth.createGST);
    app.get('/api/v1/admin/gst', [authJwt.isAdmin], auth.getAllGST);
    app.get('/api/v1/admin/gst/:id', [authJwt.isAdmin], auth.getGSTById);
    app.put('/api/v1/admin/gst/:id', [authJwt.isAdmin], auth.updateGST);
    app.delete('/api/v1/admin/gst/:id', [authJwt.isAdmin], auth.deleteGST);
    app.post('/api/v1/admin/inquiries', [authJwt.isAdmin], auth.createInquiry);
    app.get('/api/v1/admin/inquiries', [authJwt.isAdmin], auth.getInquiries);
    app.get('/api/v1/admin/inquiries/:inquiryId', [authJwt.isAdmin], auth.getInquiryById);
    app.put('/api/v1/admin/inquiries/:inquiryId', [authJwt.isAdmin], auth.updateInquiry);
    app.delete('/api/v1/admin/inquiries/:inquiryId', [authJwt.isAdmin], auth.deleteInquiry);




}