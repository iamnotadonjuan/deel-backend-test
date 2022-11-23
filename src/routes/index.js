const express = require('express');
const router = express.Router();
const {
  getContractsById,
  getAllContracts
} = require('../controller/contract');

const {
  unpaid,
  pay,
  deposit
} = require('../controller/pay');
const { getBestProfession, getBestClient } = require('../controller/admin');
const { getProfile } = require('../middleware/getProfile');

/**
 * @swagger
 * /contracts/:id:
 *   get:
 *     summary: Retrieve a contract.
 *     description: Get the contractId and retrieve an available contract.
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        description: Numeric ID of the contract to retrieve.
 *        schema:
 *          type: integer
 */
 router.get('/contracts/:id', getProfile, getContractsById);

/**
 * @swagger
 * /contracts:
 *   get:
 *     summary: Retrieve a list of contracts.
 *     description: Get a list of contracts belonging to a user.
 */
 
 router.get('/contracts/', getProfile , getAllContracts);
 
/**
 * @swagger
 * /jobs/undpaid:
 *   get:
 *     summary: Retrieve a list of unpaid jobs.
 *     description: Get all unpaid jobs by user.
 */
 
 router.get('/jobs/unpaid', getProfile , unpaid);
 
/**
 * @swagger
 * /jobs/:job_id/pay:
 *   post:
 *     summary: Pay for a job.
 *     description: Pay for a job if a client balance is >= of the payment amount
 *     parameters:
 *      - in: path
 *        name: job_id
 *        required: true
 *        description: Numeric ID of the job to pay.
 *        schema:
 *          type: integer
 */
 
 router.post('/jobs/:job_id/pay', getProfile , pay);
 
/**
 * @swagger
 * /balances/deposit/:userId:
 *   post:
 *     summary: Deposits money.
 *     description: Add money into the balance of a client.
 *     parameters:
 *      - in: path
 *        name: userId
 *        required: true
 *        description: Numeric ID of the client.
 *        schema:
 *          type: integer
 */
 
 router.post('/balances/deposit/:userId', getProfile, deposit);
 
/**
 * @swagger
 * /admin/best-profession/:
 *   get:
 *     summary: Retrieve best profession.
 *     description: Get the best profession filtered by date.
 *     parameters:
 *      - in: query
 *        name: start
 *        required: true
 *        description: Start date.
 *        schema:
 *          type: date
 *      - in: query
 *        name: end
 *        required: true
 *        description: End date.
 *        schema:
 *          type: date
 */
 
 router.get('/admin/best-profession', getProfile, getBestProfession);
 
/**
 * @swagger
 * /admin/best-clients/:
 *   get:
 *     summary: Retrieve a list of best clients.
 *     description: Get the clients the paid the most for jobs in the query time period.
 *     parameters:
 *      - in: query
 *        name: start
 *        required: true
 *        description: Start date.
 *        schema:
 *          type: date
 *      - in: query
 *        name: end
 *        required: true
 *        description: End date.
 *        schema:
 *          type: date
 *      - in: limit
 *        name: limit
 *        required: false
 *        description: Limit the best clients to retrieve.
 *        schema:
 *          type: integer
 */
 
 router.get('/admin/best-clients', getProfile, getBestClient);

 module.exports = router;
