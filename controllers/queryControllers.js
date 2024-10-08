const Query = require("../Models/queryModel");
const logger = require("../logger");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const logger = require("../logger");


exports.queryCreation = catchAsyncErrors(async (req, res) => {
    logger.info(`Creating new query from IP: ${req.ip}`);
    const { title, subtitle, description, other, created_by, updated_By } = req.body;

    const lastQuery = await Query.findOne().sort({ created_at: -1 });

    let newQueryId = "QU-1000";
    if (lastQuery && lastQuery.queryId) {
        const lastQueryIdNumber = parseInt(lastQuery.queryId.slice(3)) + 1;
        newQueryId = `QU-${lastQueryIdNumber}`;
    }

    // Ensure the new query ID is unique
    let existingQuery = await Query.findOne({ queryId: newQueryId });
    while (existingQuery) {
        const lastQueryIdNumber = parseInt(newQueryId.slice(3)) + 1;
        newQueryId = `QU-${lastQueryIdNumber}`;
        existingQuery = await Query.findOne({ queryId: newQueryId });
    }

    // Create the new query with the unique queryId
    const newQuery = await Query.create({
        queryId: newQueryId,          // Generated query ID
        title,                       // Optional
        subtitle,                   // Optional
        description,                 // Optional
        other,                       // Optional
        created_by,                  // Optional
        updated_By                   // Optional
    });

    res.status(201).json({
        success: true,
        message: 'Query created successful',
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

    return res.status(200).json({
        success: true,
        message: 'Query successfully deleted',
    });
});

exports.updateQuery = catchAsyncErrors(async (req, res) => {
    logger.info(`Updating query from IP: ${req.ip}`);

    const { title, subtitle, description, other, updated_By } = req.body;
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
        title: title || existingQuery.title,
        subtitle: subtitle || existingQuery.subtitle,
        description: description || existingQuery.description,
        other: other || existingQuery.other,
        updated_By: updated_By || existingQuery.updated_By,
        updated_at: Date.now(),
    };

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

    res.status(200).json({
        success: true,
        message: 'Query updated successfully',
        query: updatedQuery
    });
});

