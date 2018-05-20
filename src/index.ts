import express from 'express';

const app = express();

function determinePort(): number {
  const defaultPort = 80;
  if (process.env.PORT) {
    return parseInt(process.env.PORT);
  } else {
    return defaultPort;
  }
}

const port = determinePort();

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Started server on port ${port}`);
});
