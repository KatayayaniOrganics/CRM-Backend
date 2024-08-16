// const Agents = require("../Models/");
const Query = require("../Models/queryModel");
const CallDetails = require("../Models/callDetails");
const Crop = require("../Models/cropModel");


exports.agentCreation = async (req, res) => {
 
    try { 
        const { user_id, call_history, talktime_day, total_talktime, breaktime_day, total_breaktime } = req.body;
        const agent = new Agents({ user_id, call_history, talktime_day, total_talktime, breaktime_day, total_breaktime });
        await agent.save();
        res.status(201).send(agent);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message,
            });
        }
  }
  
  exports.queryCreation = async (req, res) => {
      try { 
        const { customer_id, query_category, order, tags, reason_not_ordered, description, created_by } = req.body;
        const query = new Query({ customer_id, query_category, order, tags, reason_not_ordered, description, created_by });
        await query.save();
        res.status(201).send(query);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
  }

  exports.CallDetailsCreation = async (req, res) => {
      try { 
        const { query_id, customer_id, agent_id, datetime, duration, reason_not_connected } = req.body;
        const callDetails = new CallDetails({ query_id, customer_id, agent_id, datetime, duration, reason_not_connected });
        await callDetails.save();
        res.status(201).send(callDetails);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
  }

  exports.CropsCreation=async (req, res) => {
      try { 
        const { name, sowing, products_used, crop_stage } = req.body;
        const crop = new Crop({ name, sowing, products_used, crop_stage });
        await crop.save();
        res.status(201).send(crop);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
  }