const { Op } = require('sequelize');

const getBestProfession = async (req, res) => {
  const {Profile, Contract, Job} = req.app.get('models');
  const {start,end} = req.query;
  const isNotAClient = 'client';
  if (!start && !end) return res.status(400).end();
  try {
    const bestProfession = await Profile.findAll({
        where: {
          type: { [Op.not]: isNotAClient }
        },
        include: [{
          model: Contract,
          as: 'Contractor',
          include: [{
            model: Job,
            where: {
              paid: 1,
              paymentDate: { [Op.between]: [start, end] }
            }
          }]
        }]
      });
      const totalJobsToPay = bestProfession.map((bestP => ({
        ...bestP.dataValues,
        totalGained: bestP.Contractor.map((client) => client.Jobs.reduce((acc, obj) => acc + obj.price, 0)).reduce((c, v) => c + v, 0)
        })
      )).reduce((prev, current) => (prev.totalGained > current.totalGained) ? prev : current);
      
      if(totalJobsToPay.Contractor.length === 0) return res.status(404).end();

      res.json(totalJobsToPay);
  } catch (error) {
      console.error(error);
      res.status(500).end();
  }
};

const getBestClient = async (req, res) => {
  const {Profile, Contract, Job} = req.app.get('models');
  const {start,end,limit} = req.query;
  const isAClient = 'client';
  if (!start && !end) return res.status(400).end();
  try {
    const bestProfession = await Profile.findAll({
      where: {
        type: { [Op.eq]: isAClient }
      },
      limit: limit || 2,
      include: [{
        model: Contract,
        as: 'Client',
        include: [{
          model: Job,
          where: {
            paid: 1,
            paymentDate: { [Op.between]: [start, end] }
          }
        }]
      }]
    });
    const totalJobsToPay = bestProfession.map((bestP => ({
      ...bestP.dataValues,
      paid: bestP.Client.map((client) => client.Jobs.reduce((acc, obj) => acc + obj.price, 0)).
      reduce((c, v) => c + v, 0)
      })
    )).sort((a, b) => a.paid - b.paid);
      
    if(!totalJobsToPay) return res.status(404).end();

    res.json(totalJobsToPay);
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
};

module.exports = {
  getBestProfession,
  getBestClient
};
