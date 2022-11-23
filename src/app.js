const express = require('express');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model');
const router = require('./routes');

const app = express();



const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express API for Deel process',
    version: '1.0.0',
    description:
      'Deel code test',
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(bodyParser.json());

app.set('sequelize', sequelize);
app.set('models', sequelize.models);

app.use(router);

module.exports = app;
