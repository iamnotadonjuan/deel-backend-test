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

module.exports = app;
