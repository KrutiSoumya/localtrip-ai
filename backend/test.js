const { generateTrip } = require('./services/aiService');

generateTrip('Return valid JSON with a single field named "status" set to "ok".')
  .then(result => {
    console.log(result);
  });