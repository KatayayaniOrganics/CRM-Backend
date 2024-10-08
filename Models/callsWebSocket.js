const WebSocket = require('ws');
const logger = require('../logger');
const CallControllers = require('../controllers/CallControllers');

function setupCallsWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        logger.info('New WebSocket connection');

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                await handleMessage(ws, data);
            } catch (error) {
                logger.error('Error processing message:', error);
                sendError(ws, 'Invalid message format');
            }
        });

        ws.on('close', () => {
            logger.info('WebSocket connection closed');
        });
    });
}

async function handleMessage(ws, data) {
    switch (data.type) {
        case 'initCall':
            await initializeCall(ws, data);
            break;
        case 'updateCall':
            await updateCall(ws, data);
            break;
        case 'endCall':
            await endCall(ws, data);
            break;
        case 'searchCall':
            await searchCall(ws, data);
            break;
        default:
            logger.warn('Unknown message type:', data.type);
            sendError(ws, 'Unknown message type');
    }
}

async function initializeCall(ws, data) {
    try {
        const req = { body: data.callData };
        const res = (responseData) => {
            console.log('Sending call initialization response:', responseData);
            sendMessage(ws, { 
                type: 'callInitialized', 
                ...responseData
            });
        };
        await CallControllers.CallDetailsCreation(req, res);
    } catch (error) {
        console.error('Error initializing call:', error);
        sendError(ws, 'Failed to initialize call');
    }
}

async function updateCall(ws, data) {
    try {
        const req = { params: { callId: data.callId }, body: data.updateData, user: { id: data.agentId } };
        const res = {
            status: (code) => ({
                json: (data) => sendMessage(ws, { type: 'callUpdated', ...data })
            })
        };
        await CallControllers.CallUpdate(req, res);
    } catch (error) {
        logger.error('Error updating call:', error);
        sendError(ws, 'Failed to update call');
    }
}

async function endCall(ws, data) {
    try {
        // Assuming you want to update the call when ending it
        const req = { params: { callId: data.callId }, body: { duration: data.duration, outcome: data.outcome }, user: { id: data.agentId } };
        const res = {
            status: (code) => ({
                json: (data) => sendMessage(ws, { type: 'callEnded', ...data })
            })
        };
        await CallControllers.CallUpdate(req, res);
    } catch (error) {
        logger.error('Error ending call:', error);
        sendError(ws, 'Failed to end call');
    }
}

async function searchCall(ws, data) {
    try {
        const req = { query: data.searchParams };
        const res = {
            json: (data) => sendMessage(ws, { type: 'searchResults', data })
        };
        await CallControllers.callsearch(req, res);
    } catch (error) {
        logger.error('Error searching calls:', error);
        sendError(ws, 'Failed to search calls');
    }
}

function sendMessage(ws, message) {
    ws.send(JSON.stringify(message));
}

function sendError(ws, message) {
    sendMessage(ws, { type: 'error', message });
}

module.exports = setupCallsWebSocket;
