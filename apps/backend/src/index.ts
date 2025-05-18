import { createServer } from './presentation/server';

const start = async () => {
  const server = createServer();
  try {
    await server.listen({ port: 3000 });
    // eslint-disable-next-line no-console
    console.log('Server is running on http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

void start();
