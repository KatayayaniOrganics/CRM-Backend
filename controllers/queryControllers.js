const Query = require("../Models/queryModel");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");

exports.queryCreation = catchAsyncErrors(async (req, res) => {
    const { description, query_category, order, tags, reason_not_ordered, created_by, updated_By } = req.body;
  
    // Check if description is provided (customer_id will be generated automatically)
    if (!description) {
        return res.status(400).json({
            success: false,
            message: 'Description is required',
        });
    }
  
    const lastQuery = await Query.findOne().sort({ created_at: -1 });
  
    let newCustomerId = "Qu101";
    if (lastQuery && lastQuery.customer_id) {
        const lastCustomerIdNumber = parseInt(lastQuery.customer_id.slice(2)) + 1;
        newCustomerId = `Qu${lastCustomerIdNumber}`;
    }
  
    // Create the new query with the generated customer_id
    const newQuery = await Query.create({
        customer_id: newCustomerId, // Generated customer ID
        description,                // Required
        query_category,             // Optional
        order,                      // Optional
        tags,                       // Optional
        reason_not_ordered,         // Optional
        created_by,                 // Optional
        updated_By                  // Optional
    });
  
    res.status(201).json({
        success: true,
        message: 'Query created successfully',
        query: newQuery
    });
  });
  
exports.getQuery = catchAsyncErrors(async (req, res) => {
      const { customer_id } = req.query;
  
      if (customer_id) {
          const query = await Query.findOne({ customer_id });
  
          if (!query) {
              return res.status(404).json({
                  success: false,
                  message: 'Query not found for the given customer ID',
              });
          }
          
          return res.status(200).json({
              success: true,
              query,
          });
      }
  
      const queries = await Query.find();
      if (queries.length === 0) {
          return res.status(404).json({
              success: false,
              message: 'No queries found',
          });
      }
  
      res.status(200).json({
          success: true,
          queries,
      });
  });
  
  exports.deleteQuery = catchAsyncErrors(async (req, res) => {
  
    console.log('Request query:', req.query);
  
  
    const { customer_id } = req.query;
  
    if (!customer_id) {
        return res.status(400).json({
            success: false,
            message: 'Customer ID must be provided to delete a query',
        });
    }
    const query = await Query.findOneAndDelete({ customer_id });
  
    if (!query) {
        return res.status(404).json({
            success: false,
            message: 'Query not found for the given customer ID',
        });
    }
  
    return res.status(200).json({
        success: true,
        message: 'Query successfully deleted',
    });
  });
  
  exports.updateQuery = catchAsyncErrors(async (req, res) => {
    const { customer_id } = req.query;
    const updateData = req.body;
  
    if (!customer_id || Object.keys(updateData).length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Customer ID and update data are required',
        });
    }
  
    let query = await Query.findOne({ customer_id });
    if (!query) {
        return res.status(404).json({
            success: false,
            message: 'Query not found for the given customer ID',
        });
    }
  
    query.updated_history.push({
        updated_at: new Date(),
        updated_data: updateData,
        updated_by: req.body.updated_By
    });
  
    Object.assign(query, updateData);
    await query.save();
  
    return res.status(200).json({
        success: true,
        message: 'Query successfully updated',
        query
    });
  });
  