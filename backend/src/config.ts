import * as dotenv from "dotenv";
import * as fs from "fs";
import {Stash} from "s3-orm";
import { TlsOptions } from "tls";
import { Logger } from "./utils/Logger";
import { AwsCreds, AwsClientFactory } from "./utils/AwsClientFactory";
import { DataSource, DataSourceOptions, QueryRunner } from "typeorm";

dotenv.config();

const isDevMode = process.env.NODE_ENV == "development";
const pause = (ms: number) => new Promise(res => setTimeout(res, ms));

type Config = {
    databaseCertificateAuthority: string;
    port: number;
    awsCreds?: AwsCreds;
}
// NOTE: we only allow default values in devMode, we want it to fail hard and visibly in non-dev mode
// i.e. for production, you MUST specify these values explicitly
const config: Config = {
    databaseCertificateAuthority: process.env.POSTGRES_SSL_CA || "",
    port: +(process.env.PORT || (isDevMode ? 3745 : -1)),
    awsCreds: undefined,
};

Logger.debug('Running in ' + (isDevMode ? 'development' : 'production') + ' mode');


class DatabaseHelper {

    static isConnecting: boolean = false;
    static isConnected: boolean = false;
    static ds: DataSource;

    constructor() {
    }

    public static async close() {
        if (DatabaseHelper.ds) {
            await DatabaseHelper.ds.destroy();
        }

        DatabaseHelper.isConnecting = false;
        DatabaseHelper.isConnected = false;
    }

    /**
     * Creates a query runner to group queries (in a transaction)
     *
     * @returns The Query Runner
     */
    public static getQueryRunner(): QueryRunner {
        return DatabaseHelper.ds.createQueryRunner();
    }

    public static async connect() {
        Logger.debug("Attempting to connect to database...");

        if (DatabaseHelper.isConnecting) {
            // Someone else started the connecting, so wait a bit and try again
            await pause(500);
        }

        if (DatabaseHelper.isConnected) {
            return;
        }

        DatabaseHelper.isConnecting = true;

        const tlsConfig: TlsOptions | undefined = (config.databaseCertificateAuthority !== "") ?
            {
                rejectUnauthorized: true,
                ca: fs.readFileSync(config.databaseCertificateAuthority).toString(),
            } :
            undefined;

        const dbConfig: DataSourceOptions = {
            type: "postgres",
            url: process.env.POSTGRES_URI,
            synchronize: true,
            logging: false,
            entities: ["dist/**/*.entity{.ts,.js}", "src/**/*.entity.ts"],
            ssl: tlsConfig,
        };


        DatabaseHelper.ds = new DataSource(dbConfig);

        // establish database connection
        try {
            await DatabaseHelper.ds.initialize();
        }
        catch (err) {
            DatabaseHelper.isConnecting = false;
            DatabaseHelper.isConnected = false;
            Logger.error("Error during Data Source initialization:", err);
            process.exit(1);
        }

        DatabaseHelper.isConnecting = false;
        DatabaseHelper.isConnected = true;
        Logger.info("DataSource (postgres) has been initialized!");

        return true;
    }
}


async function setupConfig(){
    // Do any setup, like connect to databases, AWS, etc.
    setTimeout(async () => {
        Logger.info("Initializing AWS client...");
        await DatabaseHelper.connect();
        config.awsCreds = await AwsClientFactory.getClient();
        Logger.info("AWS client initialized!");
            
        await Stash.connect({
            bucket: process.env.AWS_BUCKET,
            rootUrl: "agents/data/",
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: config.awsCreds?.AccessKeyId,
            secretAccessKey: config.awsCreds?.SecretAccessKey,
            sessionToken: config.awsCreds?.SessionToken
        });
        
        Logger.info("S3 and Stash initialized!")

        

    }, 500);
}

export {
    DatabaseHelper,
    setupConfig,
    config,
    type Config
};

