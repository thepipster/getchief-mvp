import axios from "axios";
type AxiosRequestConfig = any;
type AxiosResponse<T = any> = {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: any;
};
interface AxiosError<T = any> {
    response?: {
        data: any;
        status: number;
        statusText: string;
    };
    message?: string;
}

let base_url = process.env.REACT_APP_API_URL || import.meta.env.VITE_API_URL;
if (!base_url) {
    base_url = "http://localhost:4374";
}

export type SendOptions = {
    verb: string,
    path: string,
    data?: Object
}

export default class BaseModel {

    name: string = "base-service";

    constructor(serviceName: string) {
        this.name = serviceName;
    }

    static toQuery(obj: object): string {
        const searchParams = new URLSearchParams();
        Object.keys(obj).forEach((key) => {
            if (Array.isArray(obj[key])) {
                return searchParams.append(key, encodeURIComponent(JSON.stringify(obj[key])));
            }
            else {
                return searchParams.append(key, obj[key]);
            }
        });
        return searchParams.toString();
    }

    static async __send(opts: SendOptions) {

        if (!opts.verb) {
            opts.verb = 'get';
        }

        const axiosOpts: AxiosRequestConfig = {
            method: opts.verb,
            data: {},
            url: `${base_url}/${opts.path}`,
            headers: {
                //'Authorization': `Bearer ${localStorage.getItem("x-token")}`
            }
        };

        if (opts.data && opts.verb == 'get') {
            axiosOpts.url += '?' + BaseModel.toQuery(opts.data);
        }
        else if (opts.data) {
            axiosOpts.data = opts.data;
        }

        try {
            console.log(`Sending [${opts.verb.toUpperCase()}] ${axiosOpts.url}`);
            const response = await axios.request(axiosOpts);

            if (response && response.data && response.data.result === 'fail') {
                throw new Error(response.data.message);
            }
            else {
                return response.data;
            }

        }
        catch (err: unknown) {
            // Check if error is an axios error by checking for response property
            const axiosErr = err as AxiosError;

            if (axiosErr.response) {
                if (axiosErr.response.status === 401) {
                    throw new Error("Session expired or user not authorized");
                }
                else if (axiosErr.response.status === 404) {
                    throw new Error(`Bad request from ${opts.verb.toUpperCase()} /${opts.path}`);
                }
                else if (axiosErr.response) {
                    const errorMessage = axiosErr.response.data.message || axiosErr.response.data;
                    throw new Error(errorMessage);
                }
            }

            // Check if error has message property
            if (typeof err === 'object' && err !== null && 'message' in err) {
                throw new Error(String(err.message));
            }

            // Fallback error message
            throw new Error(`Error while calling [${opts.verb}] ${opts.path}`);
        }

    }


}

