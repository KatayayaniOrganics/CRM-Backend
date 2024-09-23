const express = require('express');
var router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {CropsCreation,allCrops,searchCrop,updateCrop,deleteCrop} = require('../controllers/cropControllers');

// Create a new crop
router.post('/',CropsCreation );

//all crops
router.get('/all',verifyToken,allCrops);

//all crops by id
router.get('/all/:cropId',verifyToken,allCrops);

//search crop
router.get('/search',verifyToken,searchCrop);

//Update Crop
router.put("/:cropId",verifyToken,updateCrop);

//Delete Crop
router.delete("/:cropId", deleteCrop);

module.exports = router;
