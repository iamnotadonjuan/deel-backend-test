const { Op } = require('sequelize');

const unpaid = async (req, res) => {
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
    res.status(500).end();
  }
};

const pay = async (req, res) => {
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
    res.status(500).end();
  }
};

const deposit = async (req, res) => {
  const {Profile, Contract, Job} = req.app.get('models');
  const {userId} = req.params;
  const {depositAmount} = req.body;
  const t = await sequelize.transaction();
  try {
    const profile = await Profile.findOne({
      where: {
        id: userId
      },
      include: [{
        model: Contract,
        as: 'Client',
        include: [{
            model: Job,
        }]
      }]
    });
    if(!profile) return res.status(404).end();

    // deposit balance
    const totalJobsToPay = profile.Client.map((client) => client.Jobs.reduce((acc, obj) => acc + obj.price, 0)).reduce((c, v) => c + v, 0);
    if ((25 / 100 * depositAmount) + depositAmount > totalJobsToPay) return res.status(400).end('Can not deposite more than 25%');
    
    profile.balance += depositAmount;
    await profile.save({ transaction: t });
    await t.commit();
    res.json(profile);
  } catch (error) {
    console.error(error);
    await t.rollback();
  }
};

module.exports = {
  unpaid,
  pay,
  deposit
};
