const express = require('express');
var router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {CropsCreation,allCrops,searchCrop,updateCrop,deleteCrop} = require('../controllers/cropControllers');

//all crops
router.get('/all',verifyToken,allCrops);

// Create a new crop
router.post('/create',CropsCreation );

//search crop
router.get('/search',verifyToken,searchCrop);

//Update Crop
router.put("/:cropId",verifyToken,updateCrop);

//Delete Crop
router.delete("/:cropId", deleteCrop);

module.exports = router;
