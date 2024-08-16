
const Agents = require("../Models/agentModel");
const Query = require("../Models/queryModel");
const CallDetails = require("../Models/callDetails");
const Crop = require("../Models/cropModel");
const Source = require("../Models/sourceModel");
const Tags = require("../Models/tagsModel");



exports.agentCreation = async (req, res) => {
 
    try { 
        if(Array.isArray(req.body)){
          const agents=await Agents.insertMany(req.body);
          res.status(201).send(agents);
        }
        else{
        const agent = new Agents(req.body);
        await agent.save();
        res.status(201).send(agent);
        }
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

  
exports.createSource = async (req, res) => {
    try {
      if(Array.isArray(req.body)){

        const sources = await Source.insertMany(req.body);
        // await sources.save();
        res.status(201).send(sources);
      }
      else{
        const source = new Source(req.body);
        await source.save();
        res.status(201).send(source);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  };
  
  exports.createTags = async (req, res) => {
    try {
      const { name } = req.body;
      const tag = new Tags({ name });
      await tag.save();
      res.status(201).send(tag);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  };
  

  

