const { Op } = require('sequelize');

const getContractsById = async (req, res) => {
  const { Contract } = req.app.get('models');
  const { id } = req.params;
  const contract = await Contract.findOne({ where: { id, ContractorId: req.profile.id }});
  if (!contract) return res.status(404).end();
  res.json(contract);
};

const getAllContracts = async (req, res) => {
  const {Contract} = req.app.get('models');
  const isNotTerminated = 'terminated';
  try {
    const contracts = await Contract.findAll({ where: {
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
    res.status(500).end();
  }
};


module.exports = {
  getContractsById,
  getAllContracts
};