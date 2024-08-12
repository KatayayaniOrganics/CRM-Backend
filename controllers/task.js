const Task=require('../routes/task')


exports.createTask = async (req, res) => {
  try {
    const task=await new Task(
        req.body
    ).save();
    res.status(201).json({
        success:true,
        message:'Task created successfully'
    })
  } catch (error) {
    res.status(500).json({
        success:false,
        message:'Server Error',
        error:error.message
    })
  }
};