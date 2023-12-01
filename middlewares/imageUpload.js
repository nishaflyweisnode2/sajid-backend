var multer = require("multer");
require('dotenv').config()
const authConfig = require("../configs/auth.config");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
cloudinary.config({ cloud_name: authConfig.cloud_name, api_key: authConfig.api_key, api_secret: authConfig.api_secret, });



const storage = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: "Sajid-Bike-Backend/profileImage", allowed_formats: ["jpg", "jpeg", "png", "PNG", "xlsx", "xls", "pdf", "PDF"], }, });
const profileImage = multer({ storage: storage });
const storage1 = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: "Sajid-Bike-Backend/uploadIdFrontImage", allowed_formats: ["jpg", "jpeg", "png", "PNG", "xlsx", "xls", "pdf", "PDF", "jiff", "JIFF", "jfif", "JFIF", "mp4", "MP4", "webm", "WEBM"], }, });
const uploadIdFrontImage = multer({ storage: storage1 });
const storage2 = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: "Sajid-Bike-Backend/cityImage", allowed_formats: ["jpg", "jpeg", "png", "PNG", "xlsx", "xls", "pdf", "PDF", "jiff", "JIFF", "jfif", "JFIF", "mp4", "MP4", "webm", "WEBM"], }, });
const cityImage = multer({ storage: storage2 });
const storage3 = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: "Sajid-Bike-Backend/bikeImage", allowed_formats: ["jpg", "jpeg", "png", "PNG", "xlsx", "xls", "pdf", "PDF", "jiff", "JIFF", "jfif", "JFIF", "mp4", "MP4", "webm", "WEBM"], }, });
const bikeImage = multer({ storage: storage3 });




module.exports = { profileImage, uploadIdFrontImage, cityImage, bikeImage }