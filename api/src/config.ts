import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port?: number;
  dataDir: string;
}

const port = process.env.PORT;

const config: Config = {
  port: port ? Number(port) : undefined,
  dataDir: process.env.DATA_DIR || 'data',
};

export default config;
