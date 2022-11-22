const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model')
const {getProfile} = require('./middleware/getProfile')
const {Op} = require('sequelize');
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

/**
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) =>{
    const {Contract} = req.app.get('models')
    const {id} = req.params;
    const contract = await Contract.findOne({where: { id, ContractorId: req.profile.id }});
    if(!contract) return res.status(404).end();
    res.json(contract);
});

/**
 * @returns contracts belonging to a user
 */

app.get('/contracts/', getProfile , async (req, res) =>{
    const {Contract} = req.app.get('models');
    const isNotTerminated = 'terminated';
    try {
        const contracts = await Contract.findAll({where: {
            status: { [Op.not]: isNotTerminated },
            [Op.or]: [
                { ContractorId: req.profile.id },
                { ClientId: req.profile.id }
            ]
        }});
        if(!contracts) return res.status(404).end();
        res.json(contracts);
    } catch (error) {
        console.error(error);
    }
});

app.get('/jobs/unpaid', getProfile , async (req, res) =>{
    const {Contract, Job} = req.app.get('models');
    const isNotTerminated = 'terminated';
    try {
        const JobsUnpaid = await Contract.findAll({
            include: Job,
            where: {
            '$Jobs.paid$': { [Op.ne]: 1 },
            status: { [Op.not]: isNotTerminated },
            [Op.or]: [
                { ContractorId: req.profile.id },
                { ClientId: req.profile.id }
            ],
        }});
        if(!JobsUnpaid) return res.status(404).end();
        res.json(JobsUnpaid);
    } catch (error) {
        console.error(error);
    }
});

app.post('/jobs/:job_id/pay', getProfile , async (req, res) =>{
    const {Profile, Contract, Job} = req.app.get('models');
    const isNotTerminated = 'terminated';
    const {job_id: JobID} = req.params;
    if (req.profile.status === isNotTerminated) return res.status(404).end();
    const t = await sequelize.transaction();
    try {
        const JobUnpaid = await Job.findOne({
            where: {
                id: JobID,
                paid: { [Op.ne]: 1 },
                price: { [Op.lte]: req.profile.balance },
            },
            include: [{
                model: Contract,
                as: 'Contractor',
                include: [{
                    model: Profile,
                    as: 'Contractor'
                },
                {
                    model: Profile,
                    as: 'Client'
                }]
            }]
        });
        if(!JobUnpaid) return res.status(404).end();
        // Update Job
        JobUnpaid.paid = 1;
        JobUnpaid.paymentDate = Date.now();

        // Move balance from Client to Contractor
        JobUnpaid.Contractor.Client.balance -= JobUnpaid.price;
        JobUnpaid.Contractor.Contractor.balance += JobUnpaid.price;
        const updateClient = JobUnpaid.Contractor.Client.save({ transaction: t });
        const updateContract = JobUnpaid.Contractor.Contractor.save({ transaction: t });
        const updateJob = JobUnpaid.save({ transaction: t });
        await Promise.all([updateClient, updateContract, updateJob]);
        await t.commit();
        res.json(JobUnpaid);
    } catch (error) {
        console.error(error);
        await t.rollback();
    }
});

module.exports = app;
