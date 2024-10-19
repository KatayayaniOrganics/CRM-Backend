const Query = require("../Models/queryModel");
const logger = require("../logger");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");

exports.queryCreation = catchAsyncErrors(async (req, res) => {
    const {
        query_category,
        leadId,
        reason_not_order,
        action_taken,
        other,
        created_by,
        updated_by
    } = req.body;

    // Log the query creation attempt with the request IP
    logger.info(`Creating new query from IP: ${req.ip}`);

    // Validate query_category
    if (!query_category || query_category.length === 0) {
        return res.status(400).json({ message: "Please provide at least one category with sub-options." });
    }

    // Check each category for valid sub-options and description requirements
    for (let category of query_category) {
        if (!category.category_name || !category.selected_sub_options || category.selected_sub_options.length === 0) {
            return res.status(400).json({ message: `Category "${category.category_name}" must have at least one sub-option selected.` });
        }

        // Check if "Other" is selected and if the description is provided
        if (category.selected_sub_options.includes('Other') && !category.description) {
            return res.status(400).json({ message: `Description is required for the option "Other" in category "${category.category_name}".` });
        }
    }

    // Find the last created query and calculate new query ID
    const lastQuery = await Query.findOne().sort({ created_at: -1 });

    let newQueryId = "QU-1000";
    if (lastQuery && lastQuery.queryId) {
        const lastQueryIdNumber = parseInt(lastQuery.queryId.slice(3)) + 1;
        newQueryId = `QU-${lastQueryIdNumber}`;
    }

    // Ensure the new query ID is unique by checking the database
    let existingQuery = await Query.findOne({ queryId: newQueryId });
    while (existingQuery) {
        const lastQueryIdNumber = parseInt(newQueryId.slice(3)) + 1;
        newQueryId = `QU-${lastQueryIdNumber}`;
        existingQuery = await Query.findOne({ queryId: newQueryId });
    }

    // Create the new query with validated query_category and unique queryId
    const newQuery = await Query.create({
        queryId: newQueryId,         // Generated query ID
        leadId,                      // Optional leadId
        query_category,              // The validated query_category
        reason_not_order,            // Optional reason for not ordering
        action_taken,                // Optional action taken
        other,                       // Optional other information
        created_by,                  // Optional creator ID
        updated_by                   // Optional updater ID
    });

    // Emit the new query event using Socket.io
    const io = req.app.get('socket.io');
    io.emit('new-query', newQuery);

    // Log the successful query creation
    logger.info(`Query created successfully with ID: ${newQueryId}`);

    // Respond to the client
    res.status(201).json({
        success: true,
        message: 'Query created successfully',
        query: newQuery
    });
});

exports.getQuery = catchAsyncErrors(async (req, res) => {
    const { lot = 1, size = 10 } = req.query;

    let queries;
    let totalQueries;
    let totalLots;

    if (!lot && !size) {
        // Fetch all queries if no pagination parameters are provided
        queries = await Query.find();

        totalQueries = queries.length;  // Total number of queries
        totalLots = 1; // Since we're fetching all, we can consider it as 1 lot
    } else {
        // Pagination logic if lot and size are provided
        const pageSize = parseInt(size) || 10;         // Number of queries per lot (default: 10)
        const currentLot = parseInt(lot) || 1;         // Current lot (default: 1)
        const skip = (currentLot - 1) * pageSize;      // Skip the previous lots' queries

        // Fetch queries based on the current lot
        queries = await Query.find().skip(skip).limit(pageSize);

        // Count the total number of queries for pagination
        totalQueries = await Query.countDocuments();   // Total number of queries
        totalLots = Math.ceil(totalQueries / pageSize); // Calculate total lots
    }



    // If no queries found, return a 404 response
    if (queries.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'No queries found',
        });
    }
    const io = req.app.get('socket.io'); 
    io.emit('get-queries', queries);
    // Return the queries along with pagination information
    res.status(200).json({
        success: true,
        queries,
        totalLots,  // Total number of lots (pages)
        currentLot: lot ? parseInt(lot) : 1,  // Current lot number (defaults to 1)
        totalQueries,  // Total number of queries
    });
});

exports.searchQuery = catchAsyncErrors(async (req, res) => {
    const { queryId } = req.params; // Get queryId from URL

    // Find the query with the given queryId
    const query = await Query.findOne({ queryId });

    // If the query does not exist, return a 404 error
    if (!query) {
        return res.status(404).json({
            success: false,
            message: `Query with queryId ${queryId} not found`,
        });
    }
    const io = req.app.get('socket.io'); 
    io.emit('get-query', query);
    // Return the query details
    res.status(200).json({
        success: true,
        query
    });
});

exports.deleteQuery = catchAsyncErrors(async (req, res) => {
    const { queryId } = req.params; // Get queryId from URL parameters

    if (!queryId) {
        return res.status(400).json({
            success: false,
            message: 'QueryId must be provided to delete a query',
        });
    }

    const query = await Query.findOneAndDelete({ queryId });

    if (!query) {
        return res.status(404).json({
            success: false,
            message: 'Query not found for the given queryId',
        });
    }
    const io = req.app.get('socket.io'); 
    io.emit('delete-query', query);
    return res.status(200).json({
        success: true,
        message: 'Query successfully deleted',
    });
});

exports.updateQuery = catchAsyncErrors(async (req, res) => {
    logger.info(`Updating query from IP: ${req.ip}`);

    const {
        query_category, // Include query_category in the request body for updates
        reason_not_order,
        action_taken,
        updated_By
    } = req.body;

    const { queryId } = req.params; // Get queryId from URL parameters

    // Find the query by queryId
    const existingQuery = await Query.findOne({ queryId });

    if (!existingQuery) {
        return res.status(404).json({
            success: false,
            message: 'Query not found',
        });
    }

    // Prepare the updated data
    const updateData = {
        query_category: query_category || existingQuery.query_category,
        reason_not_order: reason_not_order || existingQuery.reason_not_order,
        action_taken: action_taken || existingQuery.action_taken,
        updated_By: updated_By || existingQuery.updated_By,
        updated_at: Date.now(),
    };

    // Validate the updated query_category
    for (let category of updateData.query_category) {
        if (!category.category_name || !category.selected_sub_options || category.selected_sub_options.length === 0) {
            return res.status(400).json({ message: `Category "${category.category_name}" must have at least one sub-option selected.` });
        }

        // Check if description is required for the option "Other"
        if (category.selected_sub_options.includes('Other') && !category.description) {
            return res.status(400).json({ message: `Description is required for the option "Other" in category "${category.category_name}".` });
        }
    }

    // Add the update to the query's updated history
    existingQuery.updated_history.push({
        updated_at: new Date(),
        updated_data: updateData,
        updated_by: updated_By, // Updated by is fetched from request body
    });

    // Apply the updates to the query
    Object.assign(existingQuery, updateData);

    // Save the updated query with the new history
    const updatedQuery = await existingQuery.save();

    // Emit the updated query event using Socket.io
    const io = req.app.get('socket.io'); 
    io.emit('update-query', updatedQuery);

    res.status(200).json({
        success: true,
        message: 'Query updated successfully',
        query: updatedQuery
    });
});